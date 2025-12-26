package com.logiflow.server.dtos.driver;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class DriverDtos {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TripSummaryDto {
        private Integer tripId;
        private String status;
        private String assignmentStatus;  // status of the TripAssignment (assigned, accepted, declined, etc.)
        private String tripType;
        private LocalDateTime scheduledDeparture;
        private LocalDateTime scheduledArrival;
        private String routeName;        // gợi ý hiển thị
        private String vehiclePlate;     // gợi ý hiển thị
        private String pickupTypes;      // summary of pickup types in this trip (e.g., "WAREHOUSE, PORT_TERMINAL")

            public static TripSummaryDto fromTrip(com.logiflow.server.models.Trip trip) {
                if (trip == null) return null;
                TripSummaryDto dto = new TripSummaryDto();
                dto.setTripId(trip.getTripId());
                dto.setStatus(trip.getStatus());
                // Assignment status: get from first assignment if available
                String assignmentStatus = null;
                if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
                    assignmentStatus = trip.getTripAssignments().get(0).getStatus();
                }
                dto.setAssignmentStatus(assignmentStatus);
                dto.setTripType(trip.getTripType());
                dto.setScheduledDeparture(trip.getScheduledDeparture());
                dto.setScheduledArrival(trip.getScheduledArrival());
                dto.setRouteName(trip.getRoute() != null ? trip.getRoute().getRouteName() : null);
                dto.setVehiclePlate(trip.getVehicle() != null ? trip.getVehicle().getLicensePlate() : null);

                // Build pickup types summary
                if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
                    java.util.Set<String> pickupTypeSet = new java.util.HashSet<>();
                    for (com.logiflow.server.models.Order order : trip.getOrders()) {
                        if (order.getPickupType() != null) {
                            pickupTypeSet.add(order.getPickupType().name());
                        }
                    }
                    if (!pickupTypeSet.isEmpty()) {
                        dto.setPickupTypes(String.join(", ", pickupTypeSet));
                    }
                }

                return dto;
            }
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TripDetailDto {
        private Integer tripId;
        private String status;
        private String assignmentStatus;  // status of the TripAssignment (assigned, accepted, declined, etc.)
        private String tripType;
        private LocalDateTime scheduledDeparture;
        private LocalDateTime scheduledArrival;
        private LocalDateTime actualDeparture;
        private LocalDateTime actualArrival;

        private String routeName;

        private String vehicleType;
        private String vehiclePlate;
        private Integer vehicleCapacity;

        private String delayReason;
        private Integer slaExtensionMinutes;
        private String delayStatus;
        private String delayAdminComment;

        private List<OrderBrief> orders;

        // Driver location for map display
        private BigDecimal driverLat;
        private BigDecimal driverLng;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class OrderBrief {
        private Integer orderId;
        private String customerName;
        private String customerPhone;
        private String pickupAddress;
        private String pickupType;
        private String containerNumber;
        private String terminalName;
        private String warehouseName;
        private String dockNumber;
        private String deliveryAddress;
        private BigDecimal pickupLat;
        private BigDecimal pickupLng;
        private BigDecimal deliveryLat;
        private BigDecimal deliveryLng;
        private String packageDetails;
        private BigDecimal weightTons;
        private BigDecimal packageValue;
        private BigDecimal distanceKm;
        private String status;
        private String orderStatus;
        private String priority;
        private String priorityLevel;
        private String delayReason;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ScheduleItemDto {
        private Integer tripId;
        private LocalDateTime scheduledDeparture;
        private LocalDateTime scheduledArrival;
        private String status;
        private String routeName;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ComplianceDto {
        private BigDecimal hoursDrivenTotal;      // đã lái (tổng) — đơn giản
        private BigDecimal restRequiredHours;     // số giờ nghỉ còn phải nghỉ
        private LocalDateTime nextAvailableTime;  // từ DriverWorkLog.nextAvailableTime gần nhất
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class UpdateLocationRequest {
        private BigDecimal latitude;
        private BigDecimal longitude;
        private LocalDateTime timestamp;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DriverProfileDto {
        private Integer userId;
        private String username;
        private String email;
        private String fullName;
        private String phone;
        private String profilePictureUrl;
        private String driverLicenseNumber;
        private java.time.LocalDate licenseExpiryDate;
        private String vehicleType;
        private String vehiclePlateNumber;
        private LocalDateTime createdAt;
        private String status;
        private Integer totalDeliveries;
        private BigDecimal rating;
        private BigDecimal totalEarnings;
        private BigDecimal averageDeliveryTime; // in minutes
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class UpdateDriverProfileRequest {
        private String fullName;
        private String phone;
        private String driverLicenseNumber;
        private String vehicleType;
        private String vehiclePlateNumber;
        private String profilePictureUrl;
    }
}
