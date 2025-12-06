package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.TripCreateRequest;
import com.logiflow.server.dtos.dispatch.TripDto;
import com.logiflow.server.dtos.dispatch.TripListResponse;
import com.logiflow.server.dtos.dispatch.TripAssignRequest;
import com.logiflow.server.dtos.dispatch.TripStatusUpdateRequest;
import com.logiflow.server.models.*;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.route.RouteRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TripServiceImpl implements TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private TripAssignmentRepository tripAssignmentRepository;

    @Override
    @Transactional
    public TripDto createTrip(TripCreateRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + request.getVehicleId()));

        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new RuntimeException("Route not found with id: " + request.getRouteId()));

        List<Order> orders = orderRepository.findByIdsWithRelations(request.getOrderIds());
        
        if (orders.size() != request.getOrderIds().size()) {
            throw new RuntimeException("Some orders not found. Expected " + request.getOrderIds().size() + " orders, found " + orders.size());
        }

        for (Order order : orders) {
            if (order.getOrderStatus() != Order.OrderStatus.PENDING) {
                throw new RuntimeException("Order with id " + order.getOrderId() + " has status " + order.getOrderStatus() + ". Only PENDING orders can be assigned to a trip.");
            }
        }

        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setRoute(route);
        trip.setTripType(request.getTripType());
        trip.setScheduledDeparture(request.getScheduledDeparture());
        trip.setScheduledArrival(request.getScheduledArrival());
        trip.setStatus("scheduled");
        trip.setCreatedAt(LocalDateTime.now());

        Trip savedTrip = tripRepository.save(trip);

        for (Order order : orders) {
            order.setTrip(savedTrip);
            order.setOrderStatus(Order.OrderStatus.ASSIGNED);
        }

        orderRepository.saveAll(orders);
        orderRepository.flush();

        tripRepository.flush();

        Trip tripWithOrders = tripRepository.findByIdWithRelations(savedTrip.getTripId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve created trip"));

        List<Order> tripOrders = orderRepository.findByIdsWithRelations(request.getOrderIds());
        
        tripOrders = tripOrders.stream()
                .filter(order -> order.getTrip() != null && order.getTrip().getTripId().equals(savedTrip.getTripId()))
                .collect(Collectors.toList());
        
        tripWithOrders.setOrders(tripOrders != null ? tripOrders : new java.util.ArrayList<>());

        return TripDto.fromTrip(tripWithOrders);
    }

    @Override
    @Transactional(readOnly = true)
    public TripListResponse getTrips(String status) {
        String normalizedStatus = normalizeStatus(status);

        List<Trip> trips;
        if (normalizedStatus != null && !normalizedStatus.isEmpty()) {
            trips = tripRepository.findByStatusWithRelations(normalizedStatus.toLowerCase());
        } else {
            trips = tripRepository.findAllWithRelations();
        }

        List<TripDto> tripDtos = trips.stream()
                .map(TripDto::fromTrip)
                .collect(Collectors.toList());

        Map<String, Long> statusSummary = trips.stream()
                .collect(Collectors.groupingBy(Trip::getStatus, Collectors.counting()));

        TripListResponse response = new TripListResponse();
        response.setTrips(tripDtos);
        response.setTotalTrips(tripDtos.size());
        response.setStatusSummary(statusSummary);

        return response;
    }

    @Override
    @Transactional
    public TripDto assignTrip(Integer tripId, TripAssignRequest request) {
        Trip trip = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        Vehicle vehicle = trip.getVehicle();
        if (request.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + request.getVehicleId()));
            trip.setVehicle(vehicle);
        }

        Driver driver = driverRepository.findById(request.getDriverId())
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + request.getDriverId()));

        if (driver.getStatus() != null && !driver.getStatus().equalsIgnoreCase("available")) {
            throw new RuntimeException("Driver is not available (status: " + driver.getStatus() + ")");
        }
        if (vehicle == null) {
            throw new RuntimeException("Vehicle is required for trip assignment");
        }
        if (vehicle.getRequiredLicense() != null && driver.getLicenseType() != null
                && !vehicle.getRequiredLicense().equalsIgnoreCase(driver.getLicenseType())) {
            throw new RuntimeException("Driver license (" + driver.getLicenseType() + ") does not match vehicle requirement (" + vehicle.getRequiredLicense() + ")");
        }

        TripAssignment assignment = new TripAssignment();
        assignment.setTrip(trip);
        assignment.setDriver(driver);
        assignment.setRole("driver");
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setStatus("assigned");

        tripAssignmentRepository.save(assignment);

        if (trip.getStatus() == null || trip.getStatus().equalsIgnoreCase("scheduled")) {
            trip.setStatus("in_progress");
        }
        Trip saved = tripRepository.save(trip);

        Trip tripWithRelations = tripRepository.findByIdWithRelations(saved.getTripId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated trip"));

        return TripDto.fromTrip(tripWithRelations);
    }

    @Override
    @Transactional
    public TripDto updateTripStatus(Integer tripId, TripStatusUpdateRequest request) {
        Trip trip = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        String newStatus = normalizeStatus(request.getStatus());
        String currentStatus = trip.getStatus();
        if (currentStatus != null && currentStatus.equalsIgnoreCase(newStatus)) {
            return TripDto.fromTrip(trip);
        }

        if (!isValidStatus(newStatus)) {
            throw new RuntimeException("Invalid status: " + request.getStatus() + ". Valid statuses: assigned, in_progress, delayed, completed, cancelled");
        }


        trip.setStatus(newStatus);


        LocalDateTime now = LocalDateTime.now();
        if ("in_progress".equalsIgnoreCase(newStatus) && trip.getActualDeparture() == null) {
            trip.setActualDeparture(now);
        }
        if ("completed".equalsIgnoreCase(newStatus) && trip.getActualArrival() == null) {
            trip.setActualArrival(now);
        }

        if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
            for (TripAssignment assignment : trip.getTripAssignments()) {
                if ("in_progress".equalsIgnoreCase(newStatus)) {
                    assignment.setStatus("in_progress");
                } else if ("completed".equalsIgnoreCase(newStatus)) {
                    assignment.setStatus("completed");
                } else if ("cancelled".equalsIgnoreCase(newStatus)) {
                    assignment.setStatus("cancelled");
                }
            }
            tripAssignmentRepository.saveAll(trip.getTripAssignments());
        }

        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
            if ("completed".equalsIgnoreCase(newStatus)) {
                for (Order order : trip.getOrders()) {
                    if (order.getOrderStatus() == Order.OrderStatus.ASSIGNED || 
                        order.getOrderStatus() == Order.OrderStatus.IN_TRANSIT) {
                        order.setOrderStatus(Order.OrderStatus.DELIVERED);
                    }
                }
                orderRepository.saveAll(trip.getOrders());
            } else if ("cancelled".equalsIgnoreCase(newStatus)) {
                for (Order order : trip.getOrders()) {
                    if (order.getOrderStatus() == Order.OrderStatus.ASSIGNED || 
                        order.getOrderStatus() == Order.OrderStatus.IN_TRANSIT) {
                        order.setOrderStatus(Order.OrderStatus.CANCELLED);
                    }
                }
                orderRepository.saveAll(trip.getOrders());
            } else if ("in_progress".equalsIgnoreCase(newStatus)) {
                for (Order order : trip.getOrders()) {
                    if (order.getOrderStatus() == Order.OrderStatus.ASSIGNED) {
                        order.setOrderStatus(Order.OrderStatus.IN_TRANSIT);
                    }
                }
                orderRepository.saveAll(trip.getOrders());
            }
        }

        Trip savedTrip = tripRepository.save(trip);
        tripRepository.flush();

        Trip tripWithRelations = tripRepository.findByIdWithRelations(savedTrip.getTripId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated trip"));

        return TripDto.fromTrip(tripWithRelations);
    }

    private boolean isValidStatus(String status) {
        if (status == null) {
            return false;
        }
        String lower = status.toLowerCase();
        return lower.equals("assigned") || 
               lower.equals("in_progress") || 
               lower.equals("delayed") || 
               lower.equals("completed") || 
               lower.equals("cancelled") ||
               lower.equals("scheduled");
    }

    private String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return null;
        }

        String lower = status.trim().toLowerCase();
        return switch (lower) {
            case "pending", "scheduled" -> "scheduled";
            case "active", "in-progress", "in_progress", "inprogress" -> "in_progress";
            case "completed", "complete", "finished" -> "completed";
            case "cancelled", "canceled" -> "cancelled";
            case "assigned" -> "assigned";
            case "delayed" -> "delayed";
            default -> status.trim();
        };
    }
}

