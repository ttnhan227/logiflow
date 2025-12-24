 package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.trip.TripOversightDto;
import com.logiflow.server.dtos.admin.trip.TripOversightListResponse;
import com.logiflow.server.dtos.dispatch.OrderCreateRequest;
import com.logiflow.server.dtos.dispatch.OrderDto;
import com.logiflow.server.dtos.dispatch.OrderImportResponse;
import com.logiflow.server.dtos.dispatch.OrderListResponse;
import com.logiflow.server.dtos.dispatch.OrderUpdateRequest;
import com.logiflow.server.dtos.notification.AdminNotificationDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.services.dispatch.ShippingFeeCalculator;
import com.logiflow.server.services.maps.MapsService;
import com.logiflow.server.services.maps.MapsService;
import com.logiflow.server.services.maps.MapsService;
import com.logiflow.server.websocket.NotificationService;
import com.logiflow.server.utils.OrderFileParser;
// import removed: DriverComplianceService
import com.opencsv.CSVWriter;
import com.opencsv.exceptions.CsvException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class TripOversightServiceImpl implements TripOversightService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired(required = false)
    private TripAssignmentRepository tripAssignmentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Override
    public TripOversightDto getTripOversight(Integer tripId) {
        Trip trip = tripRepository.findByIdForAdminOversight(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));
        return TripOversightDto.fromTrip(trip);
    }

    @Override
    public TripOversightListResponse getTripsOversight(String status, int page, int size) {
        if (page < 0) page = 0;
        if (size < 1) size = 10;
        if (size > 100) size = 100;

        // Simplified approach: Load trips without complex joins first
        // TODO: Use repository joins once data integrity issues are resolved
        List<Trip> allTrips = tripRepository.findAll();
        if (status != null && !status.trim().isEmpty()) {
            allTrips = allTrips.stream()
                    .filter(trip -> trip.getStatus() != null && trip.getStatus().equals(status))
                    .collect(Collectors.toList());
        }

        // Manual pagination
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, allTrips.size());
        List<Trip> paginatedTrips = allTrips.subList(startIndex, Math.min(endIndex, allTrips.size()));

        // Convert to DTOs (with null-safe processing)
        List<TripOversightDto> tripDtos = new ArrayList<>();
        for (Trip trip : paginatedTrips) {
            TripOversightDto dto = TripOversightDto.fromTrip(trip);
            if (dto != null) {
                tripDtos.add(dto);
            }
        }

        // Sort trips by risk priority first, then by status
        tripDtos.sort((a, b) -> {
            // Risk priority mapping (higher number = higher priority)
            int riskPriorityA = getRiskPriority(a.getRisk());
            int riskPriorityB = getRiskPriority(b.getRisk());

            // First compare by risk priority (descending - higher risk first)
            int riskCompare = Integer.compare(riskPriorityB, riskPriorityA);
            if (riskCompare != 0) {
                return riskCompare;
            }

            // If risk is same, sort by status priority
            int statusPriorityA = getStatusPriority(a.getTripStatus());
            int statusPriorityB = getStatusPriority(b.getTripStatus());

            return Integer.compare(statusPriorityB, statusPriorityA);
        });

        TripOversightListResponse response = new TripOversightListResponse();
        response.setTrips(tripDtos);
        response.setCurrentPage(page);
        response.setPageSize(size);
        response.setTotalItems(allTrips.size());
        response.setTotalPages((int) Math.ceil((double) allTrips.size() / size));
        response.setHasNext(endIndex < allTrips.size());
        response.setHasPrevious(page > 0);

        return response;
    }

    @Override
    public List<TripOversightDto> getTripsWithDelayReports() {
        // Get all trips with delay reports (PENDING status)
        List<Trip> allTrips = tripRepository.findAll();
        List<Trip> delayedTrips = allTrips.stream()
                .filter(trip -> trip.getDelayReason() != null &&
                               !trip.getDelayReason().trim().isEmpty() &&
                               "PENDING".equalsIgnoreCase(trip.getDelayStatus()))
                .collect(Collectors.toList());

        // Convert to DTOs (with null-safe processing)
        List<TripOversightDto> tripDtos = new ArrayList<>();
        for (Trip trip : delayedTrips) {
            TripOversightDto dto = TripOversightDto.fromTrip(trip);
            if (dto != null) {
                tripDtos.add(dto);
            }
        }

        // Sort by creation date (newest delay reports first)
        tripDtos.sort((a, b) -> {
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            return 0;
        });

        return tripDtos;
    }

    @Override
    public TripOversightDto updateTripStatus(Integer tripId, String status) {
        Trip trip = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        String oldStatus = trip.getStatus();
        if (status == null || status.isBlank()) {
            throw new RuntimeException("Status is required");
        }

        // TODO: Validate status against allowed values when Trip model has enum status
        // For now, accept any string but could add validation
        trip.setStatus(status);
        Trip savedTrip = tripRepository.save(trip);

        // Audit the admin trip status update
        auditLogService.log(
            "ADMIN_UPDATE_TRIP_STATUS",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            String.format("Trip #%d status changed from '%s' to '%s'",
                tripId, oldStatus != null ? oldStatus : "null", status)
        );

        Trip tripWithRelations = tripRepository.findByIdWithRelations(savedTrip.getTripId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated trip"));
        return TripOversightDto.fromTrip(tripWithRelations);
    }

    @Override
    public TripOversightDto respondToTripDelayReport(Integer tripId, String responseType, Integer extensionMinutes) {
        Trip trip = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        if (trip.getDelayReason() == null || trip.getDelayReason().isBlank()) {
            throw new RuntimeException("No delay report found for this trip");
        }

        if (responseType == null || responseType.isBlank()) {
            throw new RuntimeException("Response type is required");
        }

        // Find the driver's trip assignment and user details for notifications
        Integer driverId = null;
        String driverUsername = null;
        if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
            var assignment = trip.getTripAssignments().stream()
                    .filter(ass -> ass.getDriver() != null)
                    .findFirst()
                    .orElse(null);
            if (assignment != null) {
                driverId = assignment.getDriver().getDriverId();
                driverUsername = assignment.getDriver().getUser().getUsername();
            }
        }

        String notificationMessage;
        String adminComment = null;
        switch (responseType.toUpperCase()) {
            case "APPROVED":
                // Extend SLA by custom minutes entered by admin
                Integer currentExtension = trip.getSlaExtensionMinutes() != null ? trip.getSlaExtensionMinutes() : 0;
                Integer approvedExtension = extensionMinutes != null && extensionMinutes > 0 ? extensionMinutes : 30;
                boolean wasAlreadyApproved = "APPROVED".equalsIgnoreCase(trip.getDelayStatus()) && currentExtension > 0;
                int newTotalExtension = currentExtension + approvedExtension;

                trip.setSlaExtensionMinutes(newTotalExtension);
                trip.setDelayStatus("APPROVED");
                if (wasAlreadyApproved) {
                    adminComment = "Delay SLA updated. Added " + approvedExtension + " minutes (total " + newTotalExtension + ").";
                    notificationMessage = "Update for trip #" + trip.getTripId() +
                            ": SLA was updated. Added " + approvedExtension + " minutes (total " + newTotalExtension + ").";
                } else {
                    adminComment = "Delay approved. SLA extended by " + approvedExtension + " minutes.";
                    notificationMessage = "Your delay report for trip #" + trip.getTripId() +
                            " has been approved. SLA extended by " + approvedExtension + " minutes.";
                }
                break;

            case "REJECTED":
                // Keep original SLA; record explicit rejection state and comment
                trip.setDelayStatus("REJECTED");
                adminComment = "Delay report rejected. SLA not extended.";
                notificationMessage = "Your delay report for trip #" + trip.getTripId() +
                        " could not be approved. Please contact admin for more details.";
                break;

            default:
                throw new RuntimeException("Invalid response type: " + responseType);
        }

        // Admin decision is tracked but no comment stored for customers
        Trip savedTrip = tripRepository.save(trip);

        // Audit the critical SLA extension decision
        String auditAction = "MANUAL_SLA_EXTENSION";
        String auditDetails = String.format("Trip #%d: %s | Driver: %s | Reason: %s",
            tripId, adminComment,
            driverUsername != null ? driverUsername : "Unknown",
            trip.getDelayReason() != null ? trip.getDelayReason() : "No reason provided");

        auditLogService.log(auditAction, "admin", "ADMIN", auditDetails);

        // Send delay response to driver
        if (driverUsername != null && !driverUsername.isEmpty()) {
            System.out.println("DEBUG: Admin approving delay for trip " + tripId + ", sending notification to driver " + driverUsername);
            System.out.println("DEBUG: Notification message: " + notificationMessage);
            notificationService.sendTripNotificationByUsername(
                driverUsername,
                tripId,
                "DELAY_RESPONSE",
                notificationMessage,
                trip.getStatus() // Include current trip status
            );
            System.out.println("DEBUG: Sent DELAY_RESPONSE notification to /topic/driver/" + driverUsername);
        } else {
            System.out.println("WARN: No driver found for trip " + tripId + ", cannot send notification");
        }

        // Send delay update notification to customers
        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
            for (Order order : trip.getOrders()) {
                if (order.getCustomer() != null) {
                    User customerUser = order.getCustomer();
                    String customerUsername = customerUser.getUsername();
                    String customerMessage;

                    if ("APPROVED".equalsIgnoreCase(responseType)) {
                        Integer approvedExtension = extensionMinutes != null && extensionMinutes > 0 ? extensionMinutes : 30;
                        customerMessage = String.format(
                            "Trip delay update for order #%d: Trip SLA extended by %d minutes. New ETA will be adjusted accordingly.",
                            order.getOrderId(),
                            approvedExtension
                        );
                    } else {
                        customerMessage = String.format(
                            "Trip delay update for order #%d: Trip delay report was not approved. Trip will proceed on original schedule.",
                            order.getOrderId()
                        );
                    }

                    try {
                        notificationService.sendOrderNotification(
                            customerUser.getUserId(),
                            order.getOrderId(),
                            "DELAY_UPDATE",
                            customerMessage,
                            trip.getStatus() != null ? trip.getStatus() : "unknown"
                        );
                        System.out.println("DEBUG: Sent DELAY_UPDATE notification to customer " + customerUsername + " for order " + order.getOrderId());
                    } catch (Exception e) {
                        System.err.println("Failed to send delay update notification to customer " + customerUsername + ": " + e.getMessage());
                    }
                }
            }
        }

        Trip tripWithRelations = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated trip"));
        return TripOversightDto.fromTrip(tripWithRelations);
    }

    // Helper method to get risk priority for sorting (higher number = higher priority)
    private int getRiskPriority(String risk) {
        if (risk == null) return 0;
        switch (risk.toUpperCase()) {
            case "OVERDUE": return 5;
            case "DUE_SOON": return 4;
            case "ON_TRACK": return 3;
            case "COMPLETED": return 2;
            case "UNKNOWN": return 1;
            default: return 0;
        }
    }

    // Helper method to get status priority for sorting (higher number = higher priority)
    private int getStatusPriority(String status) {
        if (status == null) return 0;
        switch (status.toLowerCase()) {
            case "in_progress": return 4;
            case "arrived": return 3;
            case "scheduled": return 2;
            case "assigned": return 1;
            case "completed": return 0; // Completed trips have lowest priority in default view
            default: return 0;
        }
    }

}
