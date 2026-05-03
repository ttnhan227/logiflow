package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.TripCreateRequest;
import com.logiflow.server.dtos.dispatch.TripDto;
import com.logiflow.server.dtos.dispatch.TripListResponse;
import com.logiflow.server.dtos.dispatch.TripAssignRequest;
import com.logiflow.server.dtos.dispatch.TripStatusUpdateRequest;
import com.logiflow.server.models.*;
import com.logiflow.server.models.TripProgressEvent;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.route.RouteRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.trip.TripProgressEventRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import com.logiflow.server.repositories.delivery.DeliveryConfirmationRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.logiflow.server.constants.AuditActions;
import com.logiflow.server.constants.TripStatus;
import com.logiflow.server.dtos.dispatch.TripCancelRequest;
import com.logiflow.server.dtos.dispatch.TripRerouteRequest;
import com.logiflow.server.services.dispatch.TripAssignmentMatchingService;
import com.logiflow.server.services.admin.AuditLogService;
import com.logiflow.server.websocket.NotificationService;
import com.logiflow.server.services.payment.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class TripServiceImpl implements TripService {

    private static final Logger log = LoggerFactory.getLogger(TripServiceImpl.class);
    private static final String SYSTEM_ACTOR = "system";
    private static final String SYSTEM_ROLE = "SYSTEM";

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final RouteRepository routeRepository;
    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;
    private final TripAssignmentRepository tripAssignmentRepository;
    private final DeliveryConfirmationRepository deliveryConfirmationRepository;
    private final TripProgressEventRepository tripProgressEventRepository;
    private final TripAssignmentMatchingService tripAssignmentMatchingService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final PaymentService paymentService;

    public TripServiceImpl(
            TripRepository tripRepository,
            VehicleRepository vehicleRepository,
            RouteRepository routeRepository,
            OrderRepository orderRepository,
            DriverRepository driverRepository,
            TripAssignmentRepository tripAssignmentRepository,
            DeliveryConfirmationRepository deliveryConfirmationRepository,
            TripProgressEventRepository tripProgressEventRepository,
            TripAssignmentMatchingService tripAssignmentMatchingService,
            AuditLogService auditLogService,
            NotificationService notificationService,
            PaymentService paymentService) {
        this.tripRepository = tripRepository;
        this.vehicleRepository = vehicleRepository;
        this.routeRepository = routeRepository;
        this.orderRepository = orderRepository;
        this.driverRepository = driverRepository;
        this.tripAssignmentRepository = tripAssignmentRepository;
        this.deliveryConfirmationRepository = deliveryConfirmationRepository;
        this.tripProgressEventRepository = tripProgressEventRepository;
        this.tripAssignmentMatchingService = tripAssignmentMatchingService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
        this.paymentService = paymentService;
    }

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
        trip.setStatus(TripStatus.SCHEDULED);
        trip.setCreatedAt(LocalDateTime.now());

        Trip savedTrip = tripRepository.save(trip);

        // Progress event
        addProgressEvent(savedTrip, TripProgressEvent.EventType.CREATED, "Trip created", "{\"tripType\":\"" + request.getTripType() + "\"}");

        for (Order order : orders) {
            order.setTrip(savedTrip);
            order.setOrderStatus(Order.OrderStatus.ASSIGNED);
        }

        orderRepository.saveAll(orders);
        orderRepository.flush();

        tripRepository.flush();
        tripProgressEventRepository.flush();

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
    public TripListResponse getTrips(String status, int page, int size) {
        if (page < 0) page = 0;
        if (size < 1) size = 10;
        if (size > 100) size = 100;

        String normalizedStatus = normalizeStatus(status);

        // For proper global sorting, we need to fetch all trips and sort them in memory
        // before pagination. This ensures consistent sorting across all pages.
        List<Trip> allTrips;
        if (normalizedStatus != null && !normalizedStatus.isEmpty()) {
            allTrips = tripRepository.findByStatusWithRelations(normalizedStatus.toLowerCase());
        } else {
            allTrips = tripRepository.findAllWithRelations();
        }

        // Sort by newest first, then by status priority for same creation date
        Map<String, Integer> statusPriority = Map.of(
            TripStatus.SCHEDULED,   1,  // Highest priority - trips ready to be assigned
            TripStatus.ASSIGNED,    2,  // Driver assigned but not started
            TripStatus.IN_PROGRESS, 3,  // Currently active trips
            TripStatus.DELAYED,     4,  // Delayed trips (still active)
            TripStatus.ARRIVED,     5,  // Arrived at destination
            TripStatus.COMPLETED,   6,  // Finished trips
            TripStatus.CANCELLED,   7   // Cancelled trips (lowest priority)
        );

        allTrips.sort((a, b) -> {
            // First sort by newest creation date
            int dateCompare = b.getCreatedAt().compareTo(a.getCreatedAt());
            if (dateCompare != 0) {
                return dateCompare;
            }

            // If same creation date, sort by status priority
            int aPriority = statusPriority.getOrDefault(a.getStatus(), 99);
            int bPriority = statusPriority.getOrDefault(b.getStatus(), 99);
            return Integer.compare(aPriority, bPriority);
        });

        // Manual pagination after sorting
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, allTrips.size());
        List<Trip> pageTrips = allTrips.subList(startIndex, endIndex);

        // Load relations for the trips in this page
        List<Integer> tripIds = pageTrips.stream()
            .map(Trip::getTripId)
            .collect(Collectors.toList());

        Map<Integer, List<Order>> ordersByTripId = orderRepository.findByTripIdsWithRelations(tripIds).stream()
            .collect(Collectors.groupingBy(o -> o.getTrip() != null ? o.getTrip().getTripId() : null));

        // Create TripDto from paginated results
        List<TripDto> tripDtos = pageTrips.stream()
            .peek(t -> t.setOrders(ordersByTripId.getOrDefault(t.getTripId(), new java.util.ArrayList<>())))
            .map(TripDto::fromTrip)
            .collect(Collectors.toList());

        // Create a mock Page object for compatibility
        org.springframework.data.domain.PageImpl<Trip> tripPage =
            new org.springframework.data.domain.PageImpl<>(pageTrips, PageRequest.of(page, size), allTrips.size());

        // Summary: keep same behavior as before (counts from ALL trips with/without status filter)
        List<Trip> summaryTrips;
        if (normalizedStatus != null && !normalizedStatus.isEmpty()) {
            summaryTrips = tripRepository.findByStatusWithRelations(normalizedStatus.toLowerCase());
        } else {
            summaryTrips = tripRepository.findAllWithRelations();
        }

        Map<String, Long> statusSummary = summaryTrips.stream()
                .collect(Collectors.groupingBy(Trip::getStatus, Collectors.counting()));

        TripListResponse response = new TripListResponse();
        response.setTrips(tripDtos);
        response.setCurrentPage(tripPage.getNumber());
        response.setPageSize(tripPage.getSize());
        response.setTotalItems(tripPage.getTotalElements());
        response.setTotalPages(tripPage.getTotalPages());
        response.setHasNext(tripPage.hasNext());
        response.setHasPrevious(tripPage.hasPrevious());
        response.setStatusSummary(statusSummary);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public TripDto getTripById(Integer tripId) {
        Trip trip = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));
        List<Order> orders = orderRepository.findByTripIdsWithRelations(java.util.List.of(tripId));
        trip.setOrders(orders != null ? orders : new java.util.ArrayList<>());
        return TripDto.fromTrip(trip);
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

        // Centralized intelligent validation (availability, active assignment, rest/compliance, license, capacity)
        tripAssignmentMatchingService.validateAssignment(tripId, request.getDriverId(), vehicle != null ? vehicle.getVehicleId() : null);

        TripAssignment assignment = new TripAssignment();
        assignment.setTrip(trip);
        assignment.setDriver(driver);
        assignment.setRole("driver");
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setStatus("assigned");

        tripAssignmentRepository.save(assignment);

        addProgressEvent(trip, TripProgressEvent.EventType.ASSIGNED,
                "Driver assigned (driverId=" + driver.getDriverId() + ")",
                "{\"driverId\":" + driver.getDriverId() + ",\"vehicleId\":" + (vehicle != null ? vehicle.getVehicleId() : null) + "}");
        tripProgressEventRepository.flush();

        // Update driver status to reflect assignment
        driver.setStatus(TripStatus.ASSIGNED);
        driverRepository.save(driver);

        // When assigning a trip to a driver, set status to "assigned" (not "in_progress")
        // The trip becomes "in_progress" only when the driver accepts and starts it
        if (trip.getStatus() == null || trip.getStatus().equalsIgnoreCase(TripStatus.SCHEDULED)) {
            trip.setStatus(TripStatus.ASSIGNED);
        }
        Trip saved = tripRepository.save(trip);

        // Send notification to driver about assignment
        try {
            String message = "New trip assigned: #" + tripId +
                           " - Vehicle: " + (vehicle != null ? vehicle.getLicensePlate() : "Unknown") +
                           " - Scheduled: " + trip.getScheduledDeparture().toString();
            notificationService.sendTripNotification(
                driver.getDriverId(),
                tripId,
                AuditActions.TRIP_ASSIGNED,
                message,
                TripStatus.ASSIGNED
            );
        } catch (Exception e) {
            log.error("Failed to send driver assignment notification: {}", e.getMessage());
        }

        // Audit the critical trip assignment operation
        String driverUsername = driver.getUser() != null ? driver.getUser().getUsername() : "Unknown";
        String vehiclePlate = vehicle != null ? vehicle.getLicensePlate() : "Unknown";
        auditLogService.log(
            AuditActions.TRIP_ASSIGNED,
            SYSTEM_ACTOR,
            SYSTEM_ROLE,
            String.format("Trip #%d assigned to driver %s (%s) with vehicle %s",
                tripId, driverUsername, driver.getDriverId(), vehiclePlate)
        );

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
        addProgressEvent(trip, TripProgressEvent.EventType.STATUS_CHANGED,
                "Trip status changed to " + newStatus,
                "{\"from\":\"" + (currentStatus != null ? currentStatus : "") + "\",\"to\":\"" + newStatus + "\"}");


        LocalDateTime now = LocalDateTime.now();
        if (TripStatus.IN_PROGRESS.equalsIgnoreCase(newStatus) && trip.getActualDeparture() == null) {
            trip.setActualDeparture(now);
        }
        if (TripStatus.COMPLETED.equalsIgnoreCase(newStatus) && trip.getActualArrival() == null) {
            trip.setActualArrival(now);
        }

        if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
            for (TripAssignment assignment : trip.getTripAssignments()) {
                if (TripStatus.IN_PROGRESS.equalsIgnoreCase(newStatus)) {
                    assignment.setStatus(TripStatus.IN_PROGRESS);
                } else if (TripStatus.COMPLETED.equalsIgnoreCase(newStatus)) {
                    assignment.setStatus(TripStatus.COMPLETED);
                    // Reset driver status to available when trip is completed
                    if (assignment.getDriver() != null) {
                        assignment.getDriver().setStatus("available");
                        driverRepository.save(assignment.getDriver());
                    }
                } else if (TripStatus.CANCELLED.equalsIgnoreCase(newStatus)) {
                    assignment.setStatus(TripStatus.CANCELLED);
                    // Reset driver status to available when trip is cancelled
                    if (assignment.getDriver() != null) {
                        assignment.getDriver().setStatus("available");
                        driverRepository.save(assignment.getDriver());
                    }
                }
            }
            tripAssignmentRepository.saveAll(trip.getTripAssignments());
        }

        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
            if (TripStatus.COMPLETED.equalsIgnoreCase(newStatus)) {
                for (Order order : trip.getOrders()) {
                    if (order.getOrderStatus() == Order.OrderStatus.ASSIGNED || 
                        order.getOrderStatus() == Order.OrderStatus.IN_TRANSIT) {
                        order.setOrderStatus(Order.OrderStatus.DELIVERED);
                        
                        // Send delivery notification to customer if customer is associated
                        if (order.getCustomer() != null) {
                            try {
                                notificationService.notifyOrderDelivered(
                                    order.getCustomer().getUserId(),
                                    order.getOrderId(),
                                    order.getCustomerName(),
                                    order.getDeliveryAddress()
                                );

                                // Send payment request email with PayPal link
                                paymentService.sendPaymentRequest(order.getOrderId());
                            } catch (Exception e) {
                                log.error("Failed to send delivery notification/payment request for order #{}: {}",
                                    order.getOrderId(), e.getMessage());
                            }
                        }
                    }
                }
                orderRepository.saveAll(trip.getOrders());
            } else if (TripStatus.CANCELLED.equalsIgnoreCase(newStatus)) {
                // Business rule: cancelling a trip should unassign orders so they can be re-dispatched
                for (Order order : trip.getOrders()) {
                    if (order.getOrderStatus() == Order.OrderStatus.ASSIGNED ||
                        order.getOrderStatus() == Order.OrderStatus.IN_TRANSIT) {
                        order.setOrderStatus(Order.OrderStatus.PENDING);
                        order.setTrip(null);
                    }
                }
                orderRepository.saveAll(trip.getOrders());
            } else if (TripStatus.IN_PROGRESS.equalsIgnoreCase(newStatus)) {
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
        tripProgressEventRepository.flush();

        Trip tripWithRelations = tripRepository.findByIdWithRelations(savedTrip.getTripId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated trip"));

        return TripDto.fromTrip(tripWithRelations);
    }

    @Override
    @Transactional
    public TripDto rerouteTrip(Integer tripId, TripRerouteRequest request) {
        Trip trip = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        if (trip.getStatus() != null && trip.getStatus().equalsIgnoreCase(TripStatus.COMPLETED)) {
            throw new RuntimeException("Cannot reroute a completed trip");
        }
        if (trip.getStatus() != null && trip.getStatus().equalsIgnoreCase(TripStatus.CANCELLED)) {
            throw new RuntimeException("Cannot reroute a cancelled trip");
        }

        Route newRoute = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new RuntimeException("Route not found with id: " + request.getRouteId()));

        Integer oldRouteId = trip.getRoute() != null ? trip.getRoute().getRouteId() : null;
        trip.setRoute(newRoute);

        addProgressEvent(trip, TripProgressEvent.EventType.REROUTED,
                "Trip rerouted",
                "{\"fromRouteId\":" + oldRouteId + ",\"toRouteId\":" + newRoute.getRouteId() + "}");

        Trip saved = tripRepository.save(trip);
        tripRepository.flush();
        tripProgressEventRepository.flush();

        Trip tripWithRelations = tripRepository.findByIdWithRelations(saved.getTripId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated trip"));

        return TripDto.fromTrip(tripWithRelations);
    }

    @Override
    @Transactional
    public TripDto cancelTrip(Integer tripId, TripCancelRequest request) {
        Trip trip = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        if (trip.getStatus() != null && trip.getStatus().equalsIgnoreCase(TripStatus.COMPLETED)) {
            throw new RuntimeException("Cannot cancel a completed trip");
        }
        if (trip.getStatus() != null && trip.getStatus().equalsIgnoreCase(TripStatus.CANCELLED)) {
            return TripDto.fromTrip(trip);
        }

        trip.setStatus(TripStatus.CANCELLED);

        // Cancel assignments and release driver
        if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
            for (TripAssignment assignment : trip.getTripAssignments()) {
                assignment.setStatus(TripStatus.CANCELLED);
                if (assignment.getDriver() != null) {
                    assignment.getDriver().setStatus("available");
                    driverRepository.save(assignment.getDriver());
                }
            }
            tripAssignmentRepository.saveAll(trip.getTripAssignments());
        }

        // Unassign orders back to PENDING
        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
            for (Order order : trip.getOrders()) {
                if (order.getOrderStatus() == Order.OrderStatus.ASSIGNED ||
                    order.getOrderStatus() == Order.OrderStatus.IN_TRANSIT) {
                    order.setOrderStatus(Order.OrderStatus.PENDING);
                }
                order.setTrip(null);
            }
            orderRepository.saveAll(trip.getOrders());
        }

        addProgressEvent(trip, TripProgressEvent.EventType.CANCELLED,
                "Trip cancelled",
                "{\"reason\":\"" + escapeJson(request.getReason()) + "\"}");

        Trip savedTrip = tripRepository.save(trip);

        // Audit the critical trip cancellation operation
        auditLogService.log(
            AuditActions.TRIP_CANCELLED,
            SYSTEM_ACTOR,
            SYSTEM_ROLE,
            String.format("Trip #%d cancelled | Reason: %s | Orders affected: %d",
                tripId,
                request.getReason() != null ? request.getReason() : "No reason provided",
                trip.getOrders() != null ? trip.getOrders().size() : 0)
        );
        tripRepository.flush();
        tripProgressEventRepository.flush();

        Trip tripWithRelations = tripRepository.findByIdWithRelations(savedTrip.getTripId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated trip"));

        return TripDto.fromTrip(tripWithRelations);
    }

    private void addProgressEvent(Trip trip, TripProgressEvent.EventType type, String message, String metadata) {
        if (trip == null) return;
        TripProgressEvent e = new TripProgressEvent();
        e.setTrip(trip);
        e.setEventType(type);
        e.setMessage(message);
        e.setMetadata(metadata);
        e.setCreatedAt(LocalDateTime.now());
        tripProgressEventRepository.save(e);
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private boolean isValidStatus(String status) {
        if (status == null) {
            return false;
        }
        String lower = status.toLowerCase();
        return lower.equals(TripStatus.ASSIGNED) ||
               lower.equals(TripStatus.IN_PROGRESS) ||
               lower.equals(TripStatus.DELAYED) ||
               lower.equals(TripStatus.COMPLETED) ||
               lower.equals(TripStatus.CANCELLED) ||
               lower.equals(TripStatus.SCHEDULED);
    }

    @Override
    @Transactional(readOnly = true)
    public com.logiflow.server.dtos.dispatch.DeliveryConfirmationResponseDto getDeliveryConfirmation(Integer tripId) {
        // Ensure trip exists (consistent error handling)
        tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        // If no confirmation exists, return an empty/null DTO instead of throwing an error
        var confirmationOpt = deliveryConfirmationRepository.findByTripTripId(tripId);
        
        if (confirmationOpt.isEmpty()) {
            // Return an empty DTO with only tripId set (safe null object pattern)
            var dto = new com.logiflow.server.dtos.dispatch.DeliveryConfirmationResponseDto();
            dto.setTripId(tripId);
            return dto;
        }

        var confirmation = confirmationOpt.get();
        var dto = new com.logiflow.server.dtos.dispatch.DeliveryConfirmationResponseDto();
        dto.setConfirmationId(confirmation.getConfirmationId());
        dto.setTripId(tripId);
        dto.setConfirmationType(confirmation.getConfirmationType());
        dto.setSignatureData(confirmation.getSignatureData());
        dto.setPhotoData(confirmation.getPhotoData());
        dto.setOtpCode(confirmation.getOtpCode());
        dto.setRecipientName(confirmation.getRecipientName());
        dto.setNotes(confirmation.getNotes());
        dto.setConfirmedAt(confirmation.getConfirmedAt());
        dto.setConfirmedBy(confirmation.getConfirmedBy());
        return dto;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return null;
        }

        String lower = status.trim().toLowerCase();
        return switch (lower) {
            case "pending", "scheduled" -> TripStatus.SCHEDULED;
            case "active", "in-progress", "in_progress", "inprogress" -> TripStatus.IN_PROGRESS;
            case "completed", "complete", "finished" -> TripStatus.COMPLETED;
            case "cancelled", "canceled" -> TripStatus.CANCELLED;
            case "assigned" -> TripStatus.ASSIGNED;
            case "delayed" -> TripStatus.DELAYED;
            default -> status.trim();
        };
    }
}
