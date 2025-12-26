package com.logiflow.server.services.driver;

import com.logiflow.server.dtos.delivery.DeliveryConfirmationDto;
import com.logiflow.server.dtos.driver.DriverDtos.*;
import com.logiflow.server.models.*;
import com.logiflow.server.repositories.delivery.DeliveryConfirmationRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.driver_worklog.DriverWorkLogRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.websocket.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import com.logiflow.server.services.maps.MapsService;
import com.logiflow.server.services.admin.SystemSettingsService;
import com.logiflow.server.services.payment.PaymentService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DriverServiceImpl implements DriverService {



    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final OrderRepository orderRepository;
    private final DriverWorkLogRepository driverWorkLogRepository;
    private final MapsService mapsService;
    private final TripAssignmentRepository tripAssignmentRepository;
    private final NotificationService notificationService;
    private final DeliveryConfirmationRepository deliveryConfirmationRepository;
    private final SystemSettingsService systemSettingsService;
    private final PaymentService paymentService;

    public DriverServiceImpl(UserRepository userRepository,
                         DriverRepository driverRepository,
                         TripRepository tripRepository,
                         OrderRepository orderRepository,
                         DriverWorkLogRepository driverWorkLogRepository,
                         MapsService mapsService,
                         TripAssignmentRepository tripAssignmentRepository,
                         NotificationService notificationService,
                         DeliveryConfirmationRepository deliveryConfirmationRepository,
                         SystemSettingsService systemSettingsService,
                         PaymentService paymentService) {
        this.userRepository = userRepository;
        this.driverRepository = driverRepository;
        this.tripRepository = tripRepository;
        this.orderRepository = orderRepository;
        this.driverWorkLogRepository = driverWorkLogRepository;
        this.mapsService = mapsService;
        this.tripAssignmentRepository = tripAssignmentRepository;
        this.notificationService = notificationService;
        this.deliveryConfirmationRepository = deliveryConfirmationRepository;
        this.systemSettingsService = systemSettingsService;
        this.paymentService = paymentService;
    }

    private String resolveDriverUsername(Integer driverId) {
        if (driverId == null) return null;
        try {
            return driverRepository.findById(driverId)
                    .map(d -> d.getUser() != null ? d.getUser().getUsername() : null)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private void notifyDriver(Integer driverId, String type, String message) {
        String username = resolveDriverUsername(driverId);
        if (username != null && !username.isBlank()) {
            notificationService.sendDriverNotificationByUsername(username, type, message);
        } else {
            notificationService.sendDriverNotification(driverId, type, message);
        }
    }
    @Override
    public void acceptTripAssignment(Integer driverId, Integer tripId) {
        int updated = tripAssignmentRepository.updateStatusByDriverAndTrip(driverId, tripId, "accepted");
        if (updated == 0) {
            throw new RuntimeException("Trip assignment not found or not assigned to you");
        }
        // Send notification to driver
        notifyDriver(driverId, "TRIP_ACCEPTED", "You have accepted trip #" + tripId);
    }

    @Override
    public void declineTripAssignment(Integer driverId, Integer tripId) {
        int updated = tripAssignmentRepository.updateStatusByDriverAndTrip(driverId, tripId, "declined");
        if (updated == 0) {
            throw new RuntimeException("Trip assignment not found or not assigned to you");
        }
        // Send notification to driver
        notifyDriver(driverId, "TRIP_DECLINED", "You have declined trip #" + tripId);
    }

    @Override
    public void cancelTripAssignment(Integer driverId, Integer tripId) {
        // Reset assignment back to "assigned" so it can be picked up by another driver
        int updated = tripAssignmentRepository.updateStatusByDriverAndTrip(driverId, tripId, "assigned");
        if (updated == 0) {
            throw new RuntimeException("Trip assignment not found or not assigned to you");
        }
        // Send notification to driver
        notifyDriver(driverId, "TRIP_CANCELLED", "Trip #" + tripId + " has been cancelled");
    }

    @Override
    public void reportTripDelay(Integer driverId, Integer tripId, String delayReason, Integer estimatedDelayMinutes) {
        Trip trip = tripRepository.findTripByDriverAndTripId(driverId, tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found or not assigned to you"));

        // Check delay status and SLA extensions
        boolean hasSlaExtension = trip.getSlaExtensionMinutes() != null && trip.getSlaExtensionMinutes() > 0;

        // BLOCK any new delay reports after admin approval - drivers cannot submit additional delays
        // This includes updates - once approved, no more delay submissions possible
        if (hasSlaExtension || "APPROVED".equalsIgnoreCase(trip.getDelayStatus())) {
            throw new RuntimeException("Cannot submit delay report: This trip already has admin-approved extensions. Please contact admin directly if you need further assistance.");
        }

        // Allow updating pending or rejected delay reports (before approval)
        boolean hasPreviousDelay = trip.getDelayReason() != null && !trip.getDelayReason().isEmpty();

        // Store delay reason - timing information is included in the text description
        trip.setDelayReason(delayReason);
        // Whenever driver submits or updates, reset status back to PENDING
        trip.setDelayStatus("PENDING");

        tripRepository.save(trip);

        // Send notification to admins about the delay report
        String notificationType = hasPreviousDelay ? "Driver updated delay report" : "Driver reported delay";
        String notificationMessage = String.format(
                "%s for trip #%d: %s",
                notificationType, tripId, delayReason
        );

        // Send broadcast notification to all admin users with action link using TRIP ID
        notificationService.broadcastToAdminsWithAction(
                "DELAY_REPORT",
                "WARNING",
                "Driver Delay Report",
                notificationMessage,
                "/admin/trips-oversight/" + tripId,  // ✅ Use tripId, not orderId
                "Review Delay",
                tripId  // ✅ Use tripId as the reference ID
        );

        // Also send notification to driver confirming their delay report/update
        String driverMessage = hasPreviousDelay
                ? "Delay report updated for trip #" + tripId + ". Admin will review your latest information."
                : "Delay report submitted for trip #" + tripId + ". Admin will review.";
        notifyDriver(driverId, "DELAY_REPORTED", driverMessage);
    }

    @Override
    public void updateTripStatus(Integer driverId, Integer tripId, String status) {
        Trip trip = tripRepository.findTripByDriverAndTripId(driverId, tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found or not assigned to you"));
        
        // Validate status transitions
        String currentStatus = trip.getStatus();
        boolean validTransition = false;
        
        switch (status) {
            case "in_progress":
                validTransition = currentStatus.equals("scheduled") || currentStatus.equals("assigned");
                if (validTransition) {
                    trip.setActualDeparture(LocalDateTime.now());
                }
                break;
            case "arrived":
                validTransition = currentStatus.equals("in_progress");
                break;
            case "completed":
                validTransition = currentStatus.equals("arrived") || currentStatus.equals("in_progress");
                if (validTransition) {
                    trip.setActualArrival(LocalDateTime.now());
                }
                break;
            default:
                throw new RuntimeException("Invalid status: " + status);
        }
        
        if (!validTransition) {
            throw new RuntimeException("Invalid status transition from " + currentStatus + " to " + status);
        }
        
        trip.setStatus(status);
        tripRepository.save(trip);
        
        // Send notification to driver about status change
        String notificationMessage = "Trip #" + tripId + " status updated to " + status;
        String username = resolveDriverUsername(driverId);
        if (username != null && !username.isBlank()) {
            notificationService.sendTripNotificationByUsername(username, tripId, "TRIP_STATUS_UPDATE", notificationMessage, status);
        } else {
            notificationService.sendTripNotification(driverId, tripId, "TRIP_STATUS_UPDATE", notificationMessage, status);
        }
    }

    /** Lấy driver từ Authentication.getName() — có thể là số (userId) hoặc username */
    @Override
    public Driver getCurrentDriver(String authName) {
        Optional<User> userOpt;
        try {
            Integer id = Integer.parseInt(authName);
            userOpt = userRepository.findByIdWithRole(id); // đã có sẵn
        } catch (NumberFormatException ex) {
            userOpt = userRepository.findByUsernameWithRole(authName); // đã có sẵn
        }
        User user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
        return driverRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Driver not found for current user"));
    }

    @Override
    public List<TripSummaryDto> getMyTrips(Integer driverId, String status) {
        List<Trip> trips = tripRepository.findTripsByDriverAndStatus(driverId, status);
        return trips.stream().map(this::toSummary).toList();
    }

    @Override
    public TripDetailDto getMyTripDetail(Integer driverId, Integer tripId) {
        Trip trip = tripRepository.findTripByDriverAndTripId(driverId, tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found or not assigned to you"));
        TripDetailDto dto = toDetail(trip);

        // Add route info using MapsService if possible
        if (trip.getRoute() != null) {
            try {
                var route = trip.getRoute();
                BigDecimal startLat = null, startLng = null, endLat = null, endLng = null;

                if (route.getIsTripRoute() != null && route.getIsTripRoute()) {
                    // For trip routes, use first and last waypoints
                    if (route.getWaypoints() != null && !route.getWaypoints().isEmpty()) {
                        // Parse waypoints JSON to get start and end coordinates
                        try {
                            // For now, skip complex waypoint parsing - just use total distance
                            // TODO: Implement waypoint parsing for detailed directions
                        } catch (Exception e) {
                            // Fallback: use stored total distance
                        }
                    }
                } else {
                    // For single routes, use origin/destination (if they existed)
                    // Since we removed them, this branch won't execute for new routes
                    // TODO: Handle legacy single routes if any exist
                }
            } catch (Exception e) {
                // Log or handle error, but don't fail the request
            }
        }
        return dto;
    }

    @Override
    public void updateMyLocation(Integer driverId, BigDecimal lat, BigDecimal lng) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        driver.setCurrentLocationLat(lat);
        driver.setCurrentLocationLng(lng);
        // JPA sẽ flush khi transaction commit
    }

    @Override
    public List<ScheduleItemDto> getMySchedule(Integer driverId, LocalDate start, LocalDate end) {
        LocalDateTime from = start.atStartOfDay();
        LocalDateTime to = end.plusDays(1).atStartOfDay(); // inclusive end-day
        List<Trip> trips = tripRepository.findTripsByDriverAndDateRange(driverId, from, to);
        return trips.stream().map(t -> new ScheduleItemDto(
                t.getTripId(),
                t.getScheduledDeparture(),
                t.getScheduledArrival(),
                t.getStatus(),
                t.getRoute() != null ? t.getRoute().getRouteName() : null
        )).sorted(Comparator.comparing(ScheduleItemDto::getScheduledDeparture)).toList();
    }

    @Override
    public ComplianceDto getMyCompliance(Integer driverId) {
        // Get work hours from driver work logs
        BigDecimal hours = driverWorkLogRepository.sumHoursWorkedByDriverId(driverId);

        // Get compliance settings from system configuration
        BigDecimal maxDailyHours = getSystemSettingAsBigDecimal("compliance", "max_daily_hours", new BigDecimal("8.00"));
        BigDecimal mandatoryRestHours = getSystemSettingAsBigDecimal("work-rest", "mandatory_rest_hours", new BigDecimal("8.00"));

        // Calculate required rest based on system settings
        BigDecimal restRequired = hours != null && hours.compareTo(maxDailyHours) >= 0
                ? mandatoryRestHours
                : BigDecimal.ZERO;

        // Get next available time from DriverWorkLog (simplified - return null for now)
        LocalDateTime nextAvailable = null;

        return new ComplianceDto(hours == null ? BigDecimal.ZERO : hours, restRequired, nextAvailable);
    }

    private BigDecimal getSystemSettingAsBigDecimal(String category, String key, BigDecimal defaultValue) {
        try {
            // TODO: Implement proper system settings lookup once SystemSettingsService has getSettingValue method
            // For now, return defaults but structure is ready for system settings integration
            return defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }

    // ======= mapping =======
    private TripSummaryDto toSummary(Trip t) {
        String plate = (t.getVehicle() != null) ? t.getVehicle().getLicensePlate() : null;
        String routeName = (t.getRoute() != null) ? t.getRoute().getRouteName() : null;
        String assignmentStatus = null;
        if (t.getTripAssignments() != null && !t.getTripAssignments().isEmpty()) {
            assignmentStatus = t.getTripAssignments().get(0).getStatus();
        }

        // Build pickup types summary
        String pickupTypes = null;
        if (t.getOrders() != null && !t.getOrders().isEmpty()) {
            java.util.Set<String> pickupTypeSet = new java.util.HashSet<>();
            for (com.logiflow.server.models.Order order : t.getOrders()) {
                if (order.getPickupType() != null) {
                    pickupTypeSet.add(order.getPickupType().name());
                }
            }
            if (!pickupTypeSet.isEmpty()) {
                pickupTypes = String.join(", ", pickupTypeSet);
            }
        }

        return new TripSummaryDto(
                t.getTripId(),
                t.getStatus(),
                assignmentStatus,
                t.getTripType(),
                t.getScheduledDeparture(),
                t.getScheduledArrival(),
                routeName,
                plate,
                pickupTypes
        );
    }

    private TripDetailDto toDetail(Trip t) {
        TripDetailDto dto = new TripDetailDto();
        dto.setTripId(t.getTripId());
        dto.setStatus(t.getStatus());
        String assignmentStatus = null;
        if (t.getTripAssignments() != null && !t.getTripAssignments().isEmpty()) {
            assignmentStatus = t.getTripAssignments().get(0).getStatus();
        }
        dto.setAssignmentStatus(assignmentStatus);
        dto.setTripType(t.getTripType() != null ? t.getTripType() : "STANDARD");
        dto.setScheduledDeparture(t.getScheduledDeparture());
        dto.setScheduledArrival(t.getScheduledArrival());
        dto.setActualDeparture(t.getActualDeparture());
        dto.setActualArrival(t.getActualArrival());

        if (t.getRoute() != null) {
            dto.setRouteName(t.getRoute().getRouteName());
        }
        if (t.getVehicle() != null) {
            dto.setVehicleType(t.getVehicle().getVehicleType());
            dto.setVehiclePlate(t.getVehicle().getLicensePlate());
            dto.setVehicleCapacity(t.getVehicle().getCapacity());
        }

        dto.setDelayReason(t.getDelayReason());
        dto.setSlaExtensionMinutes(t.getSlaExtensionMinutes());
        dto.setDelayStatus(t.getDelayStatus());

        if (t.getOrders() != null) {
            dto.setOrders(t.getOrders().stream().map(o -> {
                OrderBrief brief = new OrderBrief();
                brief.setOrderId(o.getOrderId());
                brief.setCustomerName(o.getCustomerName());
                brief.setCustomerPhone(o.getCustomerPhone());
                brief.setPickupAddress(o.getPickupAddress());
                brief.setPickupType(o.getPickupType() != null ? o.getPickupType().name() : null);
                brief.setContainerNumber(o.getContainerNumber());
                brief.setTerminalName(o.getTerminalName());
                brief.setWarehouseName(o.getWarehouseName());
                brief.setDockNumber(o.getDockNumber());
                brief.setDeliveryAddress(o.getDeliveryAddress());
                brief.setPickupLat(o.getPickupLat());
                brief.setPickupLng(o.getPickupLng());
                brief.setDeliveryLat(o.getDeliveryLat());
                brief.setDeliveryLng(o.getDeliveryLng());
                brief.setPackageDetails(o.getPackageDetails());
                brief.setWeightTons(o.getWeightTons());
                brief.setPackageValue(o.getPackageValue());
                brief.setDistanceKm(o.getDistanceKm());
                brief.setStatus(o.getOrderStatus() != null ? o.getOrderStatus().name() : null);
                brief.setOrderStatus(o.getOrderStatus() != null ? o.getOrderStatus().name() : null);
                brief.setPriority(o.getPriorityLevel() != null ? o.getPriorityLevel().name() : null);
                brief.setPriorityLevel(o.getPriorityLevel() != null ? o.getPriorityLevel().name() : null);
                // Delay reason now comes from the trip (applies to all orders)
                brief.setDelayReason(t.getDelayReason());
                return brief;
            }).toList());
        }

        // Add driver location for map display
        if (t.getTripAssignments() != null && !t.getTripAssignments().isEmpty()) {
            Driver driver = t.getTripAssignments().get(0).getDriver();
            if (driver != null) {
                dto.setDriverLat(driver.getCurrentLocationLat());
                dto.setDriverLng(driver.getCurrentLocationLng());
            }
        }

        return dto;
    }

    @Override
    public void confirmDelivery(Integer driverId, Integer tripId, DeliveryConfirmationDto confirmationDto) {
        // Verify the trip belongs to this driver
        Trip trip = tripRepository.findTripByDriverAndTripId(driverId, tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found or not assigned to you"));

        // Verify the trip is in a state that can be confirmed (arrived or in_progress)
        if (!trip.getStatus().equals("arrived") && !trip.getStatus().equals("in_progress")) {
            throw new RuntimeException("Trip must be in 'arrived' or 'in_progress' state to confirm delivery");
        }

        if (confirmationDto == null) {
            throw new RuntimeException("Confirmation payload is required");
        }

        String type = confirmationDto.getConfirmationType();
        if (type == null || type.isBlank()) {
            throw new RuntimeException("confirmationType is required (SIGNATURE, PHOTO, OTP)");
        }
        type = type.trim().toUpperCase();



        // Validate payload by confirmation type
        switch (type) {
            case "SIGNATURE" -> {
                if (confirmationDto.getSignatureData() == null || confirmationDto.getSignatureData().isBlank()) {
                    throw new RuntimeException("signatureData is required for SIGNATURE confirmation");
                }
            }
            case "PHOTO" -> {
                if (confirmationDto.getPhotoData() == null || confirmationDto.getPhotoData().isBlank()) {
                    throw new RuntimeException("photoData is required for PHOTO confirmation");
                }
            }
            case "OTP" -> {
                if (confirmationDto.getOtpCode() == null || confirmationDto.getOtpCode().isBlank()) {
                    throw new RuntimeException("otpCode is required for OTP confirmation");
                }
            }
            default -> throw new RuntimeException("Invalid confirmationType: " + type + " (expected SIGNATURE, PHOTO, OTP)");
        }

        // Create delivery confirmation record
        DeliveryConfirmation confirmation = new DeliveryConfirmation();
        confirmation.setTrip(trip);
        confirmation.setConfirmationType(type);
        confirmation.setSignatureData(confirmationDto.getSignatureData());
        confirmation.setPhotoData(confirmationDto.getPhotoData());
        confirmation.setOtpCode(confirmationDto.getOtpCode());
        confirmation.setRecipientName(confirmationDto.getRecipientName());
        confirmation.setNotes(confirmationDto.getNotes());
        confirmation.setConfirmedBy(driverId);

        deliveryConfirmationRepository.save(confirmation);

        // Check if all orders are delivered before completing the trip
        boolean allOrdersDelivered = true;
        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
            allOrdersDelivered = trip.getOrders().stream()
                .allMatch(order -> order.getOrderStatus() == Order.OrderStatus.DELIVERED);
        }

        // Only complete the trip if all orders are delivered
        if (allOrdersDelivered) {
            // Send admin notification for delivered orders that need payment review
            if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
                List<Integer> pendingPaymentOrders = trip.getOrders().stream()
                    .filter(order -> order.getPaymentStatus() == Order.PaymentStatus.PENDING)
                    .map(Order::getOrderId)
                    .toList();

                if (!pendingPaymentOrders.isEmpty()) {
                    String notificationMessage = String.format(
                        "Orders delivered and ready for payment review: %s",
                        String.join(", ", pendingPaymentOrders.stream().map(String::valueOf).toArray(String[]::new))
                    );

                    // Send broadcast notification to all admin users
                    notificationService.broadcastToAdminsWithAction(
                        "ORDERS_DELIVERED",
                        "INFO",
                        "Orders Delivered - Payment Review Needed",
                        notificationMessage,
                        "/admin/payment-handling",
                        "Review Orders",
                        tripId
                    );
                }
            }

            // Update trip status to completed
            trip.setStatus("completed");
            trip.setActualArrival(LocalDateTime.now());

            // Update assignment status to completed
            tripAssignmentRepository.updateStatusByDriverAndTrip(driverId, tripId, "completed");

            // Send notification
            notificationService.sendTripNotification(
                    driverId,
                    tripId,
                    "DELIVERY_CONFIRMED",
                    "Delivery for trip #" + tripId + " has been confirmed",
                    "completed"
            );
        } else {
            // Send notification that trip confirmation was received but not all orders are delivered
            notificationService.sendTripNotification(
                    driverId,
                    tripId,
                    "DELIVERY_CONFIRMED",
                    "Trip confirmation received. Please ensure all orders are marked as delivered.",
                    trip.getStatus()
            );
        }

        tripRepository.save(trip);
    }

    @Override
    public DriverProfileDto getProfile(String driverUsername) {
        Driver driver = getCurrentDriver(driverUsername);

        // For now, calculate performance metrics dynamically based on completed trips
        // Total deliveries, earnings, and average time will be computed from actual trip data
        int totalDeliveries = countCompletedTrips(driver);
        BigDecimal totalEarnings = calculateTotalEarnings(driver);
        BigDecimal averageDeliveryTime = calculateAverageDeliveryTime(driver);

        DriverProfileDto profile = new DriverProfileDto();
        profile.setUserId(driver.getUser().getUserId());
        profile.setUsername(driver.getUser().getUsername());
        profile.setEmail(driver.getUser().getEmail());
        profile.setFullName(driver.getUser().getFullName());
        profile.setPhone(driver.getUser().getPhone());
        profile.setProfilePictureUrl(driver.getUser().getProfilePictureUrl());
        profile.setDriverLicenseNumber(driver.getLicenseNumber());
        profile.setLicenseExpiryDate(driver.getLicenseExpiryDate());
        profile.setVehicleType(null); // Company assigns vehicles - not personal
        profile.setVehiclePlateNumber(null); // Company property - not in driver profile
        profile.setCreatedAt(driver.getUser().getCreatedAt());
        profile.setStatus(driver.getStatus() != null ? driver.getStatus() : "ACTIVE");
        profile.setTotalDeliveries(totalDeliveries);
        profile.setRating(driver.getRating());
        profile.setTotalEarnings(totalEarnings);
        profile.setAverageDeliveryTime(averageDeliveryTime);

        return profile;
    }

    private int countCompletedTrips(Driver driver) {
        // Count completed trips for this driver - this would be calculated from trip assignments
        // For now, return 0 until proper trip counting logic is implemented
        return 0;
    }

    private BigDecimal calculateTotalEarnings(Driver driver) {
        // Calculate total earnings from completed orders/trips
        // For now, return 0 until proper earnings calculation is implemented
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateAverageDeliveryTime(Driver driver) {
        // Calculate average delivery time from completed trips
        // For now, return 0 until proper calculation is implemented
        return BigDecimal.ZERO;
    }

    @Override
    public void updateOrderStatus(Integer driverId, Integer tripId, Integer orderId, String status) {
        // Verify the trip belongs to this driver
        Trip trip = tripRepository.findTripByDriverAndTripId(driverId, tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found or not assigned to you"));

        // Find the order in this trip
        Order order = trip.getOrders().stream()
                .filter(o -> o.getOrderId().equals(orderId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Order not found in this trip"));

        // Debug logging
        System.out.println("DEBUG: updateOrderStatus - orderId: " + orderId + ", currentStatus: " + order.getOrderStatus() + ", requestedStatus: " + status);

        // Validate status transitions
        Order.OrderStatus currentStatus = order.getOrderStatus();
        Order.OrderStatus newStatus;

        try {
            newStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid order status: " + status + ". Valid values: PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED");
        }

        // Validate allowed transitions
        boolean validTransition = false;
        switch (currentStatus) {
            case ASSIGNED:
                validTransition = newStatus == Order.OrderStatus.IN_TRANSIT || newStatus == Order.OrderStatus.DELIVERED;
                break;
            case IN_TRANSIT:
                validTransition = newStatus == Order.OrderStatus.DELIVERED;
                break;
            case DELIVERED:
                // Allow re-delivery if needed (e.g., for corrections)
                validTransition = newStatus == Order.OrderStatus.DELIVERED;
                break;
            default:
                validTransition = false;
        }

        if (!validTransition) {
            throw new RuntimeException("Invalid status transition from " + currentStatus + " to " + newStatus + ". ASSIGNED->IN_TRANSIT/DELIVERED, IN_TRANSIT->DELIVERED only.");
        }

        // Update order status
        order.setOrderStatus(newStatus);

        // If order is delivered and has payment status PENDING, trigger payment notification
        if (newStatus == Order.OrderStatus.DELIVERED && order.getPaymentStatus() == Order.PaymentStatus.PENDING) {
            // Send payment request to customer
            if (order.getCustomer() != null) {
                try {
                    paymentService.sendPaymentRequest(order.getOrderId());
                } catch (Exception e) {
                    // Log error but don't fail the order update
                    System.err.println("Failed to send payment request for order #" + orderId + ": " + e.getMessage());
                }
            }
        }

        orderRepository.save(order);

        // Send notification to driver about order status change
        String notificationMessage = "Order #" + orderId + " status updated to " + newStatus.name();
        notifyDriver(driverId, "ORDER_STATUS_UPDATE", notificationMessage);
    }

    @Override
    public DriverProfileDto updateProfile(String driverUsername, UpdateDriverProfileRequest request) {
        Driver driver = getCurrentDriver(driverUsername);

        // Update User entity fields
        if (request.getFullName() != null) {
            driver.getUser().setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            driver.getUser().setPhone(request.getPhone());
        }
        if (request.getProfilePictureUrl() != null) {
            driver.getUser().setProfilePictureUrl(request.getProfilePictureUrl());
        }

        // Note: Driver-specific fields like driverLicenseNumber, vehicleType, vehiclePlateNumber
        // are not implemented in the current Driver model, so we skip them for now
        // They can be added later when the Driver entity is extended

        // Save entities
        userRepository.save(driver.getUser());
        driverRepository.save(driver);

        return getProfile(driverUsername);
    }
}
