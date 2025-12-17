package com.logiflow.server.services.driver;

import com.logiflow.server.dtos.delivery.DeliveryConfirmationDto;
import com.logiflow.server.dtos.driver.DriverDtos.*;
import com.logiflow.server.models.*;
import com.logiflow.server.repositories.delivery.DeliveryConfirmationRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.driver_worklog.DriverWorkLogRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.websocket.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import com.logiflow.server.services.maps.MapsService;

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
    private final DriverWorkLogRepository driverWorkLogRepository;
    private final MapsService mapsService;
    private final TripAssignmentRepository tripAssignmentRepository;
    private final NotificationService notificationService;
    private final DeliveryConfirmationRepository deliveryConfirmationRepository;

    public DriverServiceImpl(UserRepository userRepository,
                         DriverRepository driverRepository,
                         TripRepository tripRepository,
                         DriverWorkLogRepository driverWorkLogRepository,
                         MapsService mapsService,
                         TripAssignmentRepository tripAssignmentRepository,
                         NotificationService notificationService,
                         DeliveryConfirmationRepository deliveryConfirmationRepository) {
        this.userRepository = userRepository;
        this.driverRepository = driverRepository;
        this.tripRepository = tripRepository;
        this.driverWorkLogRepository = driverWorkLogRepository;
        this.mapsService = mapsService;
        this.tripAssignmentRepository = tripAssignmentRepository;
        this.notificationService = notificationService;
        this.deliveryConfirmationRepository = deliveryConfirmationRepository;
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
        // Clear previous admin comment so the next response is explicit
        trip.setDelayAdminComment(null);

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
                validTransition = currentStatus.equals("scheduled");
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
                // Use coordinates if available, else skip
                var route = trip.getRoute();
                if (route.getOriginLat() != null && route.getOriginLng() != null &&
                    route.getDestinationLat() != null && route.getDestinationLng() != null) {
                    var directions = mapsService.getDirections(
                        route.getOriginLat().toString(),
                        route.getOriginLng().toString(),
                        route.getDestinationLat().toString(),
                        route.getDestinationLng().toString(),
                        false // don't include geometry by default
                    );
                    if (directions != null) {
                        // Optionally, you can extend TripDetailDto to include these fields
                        // For now, add as transient fields or log for debugging
                        // Example: log.info("Trip {}: {} km, {} min", tripId, directions.getTotalDistance(), directions.getTotalDuration());
                        // If you want to expose this, add fields to TripDetailDto and set here
                    }
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
        // đơn giản: tổng cộng giờ đã làm + yêu cầu nghỉ tối thiểu 8h nếu lái > 8h
        BigDecimal hours = driverWorkLogRepository.sumHoursWorkedByDriverId(driverId);
        // logic đơn giản: nếu hours >= 8 thì bắt buộc nghỉ 8h, nếu <8 thì restRequired = 0
        BigDecimal restRequired = hours != null && hours.compareTo(new BigDecimal("8.00")) >= 0
                ? new BigDecimal("8.00")
                : BigDecimal.ZERO;

        // lấy nextAvailableTime gần nhất từ DriverWorkLog (nếu có)
        LocalDateTime nextAvailable = null;
        // cách đơn giản: không có repo riêng, ta có thể để null (hoặc sau này bổ sung query)
        // Trong bản tối giản: trả null, vẫn compile & chạy.

        return new ComplianceDto(hours == null ? BigDecimal.ZERO : hours, restRequired, nextAvailable);
    }

    // ======= mapping =======
    private TripSummaryDto toSummary(Trip t) {
        String plate = (t.getVehicle() != null) ? t.getVehicle().getLicensePlate() : null;
        String routeName = (t.getRoute() != null) ? t.getRoute().getRouteName() : null;
        String assignmentStatus = null;
        if (t.getTripAssignments() != null && !t.getTripAssignments().isEmpty()) {
            assignmentStatus = t.getTripAssignments().get(0).getStatus();
        }
        return new TripSummaryDto(
                t.getTripId(),
                t.getStatus(),
                assignmentStatus,
                t.getTripType(),
                t.getScheduledDeparture(),
                t.getScheduledArrival(),
                routeName,
                plate
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
        dto.setTripType(t.getTripType());
        dto.setScheduledDeparture(t.getScheduledDeparture());
        dto.setScheduledArrival(t.getScheduledArrival());
        dto.setActualDeparture(t.getActualDeparture());
        dto.setActualArrival(t.getActualArrival());

        if (t.getRoute() != null) {
            dto.setRouteName(t.getRoute().getRouteName());
            dto.setOriginAddress(t.getRoute().getOriginAddress());
            dto.setDestinationAddress(t.getRoute().getDestinationAddress());
            dto.setOriginLat(t.getRoute().getOriginLat());
            dto.setOriginLng(t.getRoute().getOriginLng());
            dto.setDestinationLat(t.getRoute().getDestinationLat());
            dto.setDestinationLng(t.getRoute().getDestinationLng());
        }
        if (t.getVehicle() != null) {
            dto.setVehicleType(t.getVehicle().getVehicleType());
            dto.setVehiclePlate(t.getVehicle().getLicensePlate());
            dto.setVehicleCapacity(t.getVehicle().getCapacity());
        }

        dto.setDelayReason(t.getDelayReason());
        dto.setSlaExtensionMinutes(t.getSlaExtensionMinutes());
        dto.setDelayStatus(t.getDelayStatus());
        dto.setDelayAdminComment(t.getDelayAdminComment());

        if (t.getOrders() != null) {
            dto.setOrders(t.getOrders().stream().map(o -> {
                OrderBrief brief = new OrderBrief();
                brief.setOrderId(o.getOrderId());
                brief.setCustomerName(o.getCustomerName());
                brief.setCustomerPhone(o.getCustomerPhone());
                brief.setPickupAddress(o.getPickupAddress());
                brief.setDeliveryAddress(o.getDeliveryAddress());
                brief.setPackageDetails(o.getPackageDetails());
                brief.setWeightKg(o.getWeightKg());
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

        // Basic recipient info (optional but recommended)
        if (confirmationDto.getRecipientName() == null || confirmationDto.getRecipientName().isBlank()) {
            throw new RuntimeException("recipientName is required");
        }

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

        // Update all orders in this trip to 'DELIVERED' status
        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
            trip.getOrders().forEach(order -> {
                order.setOrderStatus(Order.OrderStatus.DELIVERED);
            });
        }

        // Update trip status to completed
        trip.setStatus("completed");
        trip.setActualArrival(LocalDateTime.now());

        // Update assignment status to completed
        tripAssignmentRepository.updateStatusByDriverAndTrip(driverId, tripId, "completed");

        tripRepository.save(trip);

        // Send notification
        notificationService.sendTripNotification(
                driverId,
                tripId,
                "DELIVERY_CONFIRMED",
                "Delivery for trip #" + tripId + " has been confirmed",
                "completed"
        );
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
