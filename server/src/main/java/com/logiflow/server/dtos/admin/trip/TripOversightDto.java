package com.logiflow.server.dtos.admin.trip;

import com.logiflow.server.dtos.admin.trip.DriverSummaryDto;
import com.logiflow.server.dtos.admin.trip.VehicleSummaryDto;
import com.logiflow.server.dtos.dispatch.OrderDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Route;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.TripAssignment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripOversightDto {
    // Trip-level information
    private Integer tripId;
    private String tripStatus;
    private String tripType;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime scheduledArrival;
    private LocalDateTime actualDeparture;
    private LocalDateTime actualArrival;
    private LocalDateTime createdAt;
    private LocalDateTime slaDue;
    private LocalDateTime eta;
    private String delayReason;
    private Integer slaExtensionMinutes;
    private String delayStatus;

    // Route information
    private String originAddress;
    private String destinationAddress;
    private String originCity;
    private String destinationCity;
    private BigDecimal originLat;
    private BigDecimal originLng;
    private BigDecimal destinationLat;
    private BigDecimal destinationLng;
    private BigDecimal totalDistanceKm;
    private BigDecimal totalWeightTon;

    // Assignment information
    private DriverSummaryDto driver;
    private VehicleSummaryDto vehicle;
    private String assignmentStatus;

    // Orders within this trip
    private List<OrderSummaryDto> orders;

    // Risk assessment
    private String risk;
    private boolean hasUrgentOrders;

    // Creator information
    private Integer createdByUserId;
    private String createdByUsername;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderSummaryDto {
        private Integer orderId;
        private String customerName;
        private String customerPhone;
        private String pickupAddress;
        private String deliveryAddress;
        private String packageDetails;
        private BigDecimal weightTon;
        private BigDecimal packageValue;
        private Order.OrderStatus orderStatus;
        private Order.PriorityLevel priorityLevel;
        private LocalDateTime slaDue;
        private LocalDateTime eta;
    }

    public static TripOversightDto fromTrip(Trip trip) {
        if (trip == null) return null;

        TripOversightDto dto = new TripOversightDto();

        // Trip-level information
        dto.setTripId(trip.getTripId());
        dto.setTripStatus(trip.getStatus());
        dto.setTripType(trip.getTripType());
        dto.setScheduledDeparture(trip.getScheduledDeparture());
        dto.setScheduledArrival(trip.getScheduledArrival());
        dto.setActualDeparture(trip.getActualDeparture());
        dto.setActualArrival(trip.getActualArrival());
        dto.setCreatedAt(trip.getCreatedAt() != null ? trip.getCreatedAt() : LocalDateTime.now());
        dto.setDelayReason(trip.getDelayReason());
        dto.setSlaExtensionMinutes(trip.getSlaExtensionMinutes() != null ? trip.getSlaExtensionMinutes() : 0);
        dto.setDelayStatus(trip.getDelayStatus());

        // Route information - with null checks
        if (trip.getRoute() != null) {
            Route route = trip.getRoute();
            dto.setOriginAddress(route.getOriginAddress());
            dto.setDestinationAddress(route.getDestinationAddress());
            dto.setOriginCity(extractCity(route.getOriginAddress()));
            dto.setDestinationCity(extractCity(route.getDestinationAddress()));
            dto.setOriginLat(route.getOriginLat());
            dto.setOriginLng(route.getOriginLng());
            dto.setDestinationLat(route.getDestinationLat());
            dto.setDestinationLng(route.getDestinationLng());
            dto.setEta(trip.getScheduledArrival()); // Use scheduled arrival as ETA
        }

        // Assignment information - find the most relevant assignment with null checks
        String assignmentStatus = null;
        if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
            // For active trips, look for active assignments first
            // For completed trips, show the driver who completed it
            TripAssignment selectedAssignment = null;

            // First pass: look for active assignments
            for (TripAssignment assignment : trip.getTripAssignments()) {
                if (assignment.getStatus() != null && (
                    "assigned".equalsIgnoreCase(assignment.getStatus()) ||
                    "accepted".equalsIgnoreCase(assignment.getStatus()) ||
                    "in_progress".equalsIgnoreCase(assignment.getStatus()))) {
                    selectedAssignment = assignment;
                    break;
                }
            }

            // Second pass: if no active assignment, use completed assignment
            if (selectedAssignment == null) {
                for (TripAssignment assignment : trip.getTripAssignments()) {
                    if ("completed".equalsIgnoreCase(assignment.getStatus())) {
                        selectedAssignment = assignment;
                        break;
                    }
                }
            }

            // Third pass: if none found, use any assignment as fallback
            if (selectedAssignment == null && !trip.getTripAssignments().isEmpty()) {
                selectedAssignment = trip.getTripAssignments().get(0);
            }

            if (selectedAssignment != null) {
                if (selectedAssignment.getDriver() != null) {
                    DriverSummaryDto driverDto = DriverSummaryDto.fromDriver(selectedAssignment.getDriver(), new java.util.ArrayList<>());
                    // Try to get real-time GPS location from tracking system first
                    try {
                        com.logiflow.server.controllers.maps.GpsTrackingController.LocationMessage latestLocation =
                            com.logiflow.server.controllers.maps.GpsTrackingController.getLatestLocation(
                                selectedAssignment.getDriver().getDriverId().toString(),
                                trip.getTripId().toString()
                            );
                        if (latestLocation != null) {
                            driverDto.setCurrentLat(BigDecimal.valueOf(latestLocation.getLatitude()));
                            driverDto.setCurrentLng(BigDecimal.valueOf(latestLocation.getLongitude()));
                        } else {
                            // Fallback to database location if GPS memory doesn't have it
                            com.logiflow.server.models.Driver driver = selectedAssignment.getDriver();
                            if (driver.getCurrentLocationLat() != null && driver.getCurrentLocationLng() != null) {
                                driverDto.setCurrentLat(driver.getCurrentLocationLat());
                                driverDto.setCurrentLng(driver.getCurrentLocationLng());
                            }
                        }
                    } catch (Exception e) {
                        // GPS location not available, use database location as fallback
                        com.logiflow.server.models.Driver driver = selectedAssignment.getDriver();
                        if (driver.getCurrentLocationLat() != null && driver.getCurrentLocationLng() != null) {
                            driverDto.setCurrentLat(driver.getCurrentLocationLat());
                            driverDto.setCurrentLng(driver.getCurrentLocationLng());
                        }
                    }
                    dto.setDriver(driverDto);
                }
                if (trip.getVehicle() != null) {
                    dto.setVehicle(VehicleSummaryDto.fromVehicle(trip.getVehicle()));
                }
                assignmentStatus = selectedAssignment.getStatus();
            }
        }
        dto.setAssignmentStatus(assignmentStatus);

        // Process orders within this trip - with null checks
        List<OrderSummaryDto> orderSummaries = new ArrayList<>();
        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
            orderSummaries = trip.getOrders().stream()
                .filter(order -> order != null)
                .map(order -> {
                    OrderSummaryDto orderDto = new OrderSummaryDto();
                    orderDto.setOrderId(order.getOrderId());
                    orderDto.setCustomerName(order.getCustomerName());
                    orderDto.setCustomerPhone(order.getCustomerPhone());
                    orderDto.setPickupAddress(order.getPickupAddress());
                    orderDto.setDeliveryAddress(order.getDeliveryAddress());
                    orderDto.setPackageDetails(order.getPackageDetails());
                    orderDto.setWeightTon(order.getWeightTons());
                    orderDto.setPackageValue(order.getPackageValue());
                    orderDto.setOrderStatus(order.getOrderStatus());
                    orderDto.setPriorityLevel(order.getPriorityLevel());

                    // Calculate SLA and ETA for this order
                    orderDto.setSlaDue(calculateOrderSla(order));
                    orderDto.setEta(orderDto.getSlaDue()); // Use SLA as ETA estimate

                    return orderDto;
                })
                .collect(Collectors.toList());
        }

        dto.setOrders(orderSummaries);

        // Calculate aggregates with null checks
        BigDecimal totalWeight = orderSummaries.stream()
            .filter(order -> order != null && order.getWeightTon() != null)
            .map(OrderSummaryDto::getWeightTon)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalWeightTon(totalWeight);

        BigDecimal totalDistance = BigDecimal.ZERO;
        if (trip.getOrders() != null) {
            totalDistance = trip.getOrders().stream()
                .filter(order -> order != null && order.getDistanceKm() != null)
                .map(Order::getDistanceKm)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        dto.setTotalDistanceKm(totalDistance);

        // Risk assessment with null checks - Start with calculated risk
        String calculatedRisk = calculateTripRisk(trip);

        // Override risk for completed trips - they're not overdue anymore
        if ("completed".equalsIgnoreCase(trip.getStatus())) {
            dto.setRisk("COMPLETED");
        } else {
            dto.setRisk(calculatedRisk);
        }

        boolean hasUrgentOrders = false;
        if (trip.getOrders() != null) {
            hasUrgentOrders = trip.getOrders().stream()
                .anyMatch(order -> order != null && order.getPriorityLevel() == Order.PriorityLevel.URGENT);
        }
        dto.setHasUrgentOrders(hasUrgentOrders);

        // Creator information (from first order or trip creator) with null checks
        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
            Order firstOrder = trip.getOrders().get(0);
            if (firstOrder != null && firstOrder.getCreatedBy() != null) {
                dto.setCreatedByUserId(firstOrder.getCreatedBy().getUserId());
                dto.setCreatedByUsername(firstOrder.getCreatedBy().getUsername());
            }
        }

        // Calculate trip-level SLA (earliest urgent SLA or default)
        dto.setSlaDue(calculateTripSla(trip));
        dto.setEta(dto.getSlaDue()); // Trip ETA is the same as SLA

        return dto;
    }

    private static String extractCity(String address) {
        if (address == null || address.trim().isEmpty()) return "";
        // Simple extraction - in a real app, you might use geocoding or address parsing
        String[] parts = address.split(",");
        return parts.length > 1 ? parts[parts.length - 2].trim() : address;
    }

    private static LocalDateTime calculateOrderSla(Order order) {
        if (order.getCreatedAt() == null) return null;
        int hoursToAdd = order.getPriorityLevel() == Order.PriorityLevel.URGENT ? 4 : 24;
        LocalDateTime slaDue = order.getCreatedAt().plusHours(hoursToAdd);
        // Add trip-level extensions
        if (order.getTrip() != null && order.getTrip().getSlaExtensionMinutes() != null) {
            slaDue = slaDue.plusMinutes(order.getTrip().getSlaExtensionMinutes());
        }
        return slaDue;
    }

    private static LocalDateTime calculateTripSla(Trip trip) {
        // Trip SLA is determined by the earliest urgent order SLA, or latest normal order SLA
        return trip.getOrders().stream()
            .map(TripOversightDto::calculateOrderSla)
            .filter(sla -> sla != null)
            .min(LocalDateTime::compareTo)
            .orElse(null);
    }

    private static String calculateTripRisk(Trip trip) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime slaDue = calculateTripSla(trip);

        if (slaDue == null) return "UNKNOWN";

        long minutesToSla = java.time.Duration.between(now, slaDue).toMinutes();

        if (minutesToSla < 0) return "OVERDUE";
        if (minutesToSla < 240) return "DUE_SOON"; // 4 hours
        return "ON_TRACK";
    }
}
