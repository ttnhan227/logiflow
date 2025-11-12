package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.TripCreateRequest;
import com.logiflow.server.dtos.dispatch.TripDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Route;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.route.RouteRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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

        //Create
        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setRoute(route);
        trip.setTripType(request.getTripType());
        trip.setScheduledDeparture(request.getScheduledDeparture());
        trip.setScheduledArrival(request.getScheduledArrival());
        trip.setStatus("scheduled");
        trip.setCreatedAt(LocalDateTime.now());

        //Save trip first
        Trip savedTrip = tripRepository.save(trip);

        for (Order order : orders) {
            order.setTrip(savedTrip);
            order.setOrderStatus(Order.OrderStatus.ASSIGNED);
        }

        // Save and flush to ensure database is updated
        orderRepository.saveAll(orders);
        orderRepository.flush();
        
        // Refresh saved trip to ensure it's in sync with database
        tripRepository.flush();

        // Reload trip with vehicle and route
        Trip tripWithOrders = tripRepository.findByIdWithRelations(savedTrip.getTripId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve created trip"));

        // Query orders by the original orderIds (they now have trip set)
        // This ensures we get the orders that were just saved
        List<Order> tripOrders = orderRepository.findByIdsWithRelations(request.getOrderIds());
        
        // Verify all orders belong to this trip
        tripOrders = tripOrders.stream()
                .filter(order -> order.getTrip() != null && order.getTrip().getTripId().equals(savedTrip.getTripId()))
                .collect(java.util.stream.Collectors.toList());
        
        // Manually set orders to trip for DTO conversion (always set, even if empty)
        tripWithOrders.setOrders(tripOrders != null ? tripOrders : new java.util.ArrayList<>());

        return TripDto.fromTrip(tripWithOrders);
    }
}

