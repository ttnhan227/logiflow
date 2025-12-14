package com.logiflow.server.dtos.manager;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ManagerDtos {

    // 1) DRIVER PERFORMANCE (API /operations/drivers/performance)
//    @Data
//    @NoArgsConstructor
//    @AllArgsConstructor
//    @Builder
//    public static class DriverPerformanceDto {
//
//        private String driverId;
//        private String driverName;
//
//        private Integer totalTrips;
//        private Integer completedTrips;
//        private Integer cancelledTrips;
//        private Integer delayedTrips;
//
//        private Double onTimeRatePercent;    // 0–100
//        private Double averageDelayMinutes;  // phút
//        private Double totalDistanceKm;      // km
//    }

    // 2) OPERATIONS PERFORMANCE (API /operations/performance)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OperationsPerformanceDto {
        private Integer totalTrips;
        private Integer completedTrips;
        private Integer cancelledTrips;
        private Integer delayedTrips;

        private Double onTimeRatePercent;
        private Double averageDelayMinutes;
        private Double totalDistanceKm;
        private Double averageDistancePerTripKm;
    }

    // 3) FLEET STATUS (API /fleet/status)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FleetStatusDto {

        private Integer totalVehicles;
        private Integer activeVehicles;
        private Integer idleVehicles;
        private Integer inMaintenanceVehicles;
        private Integer unavailableVehicles;

        private Double averageUtilizationPercent;
    }

    // 4) DELIVERY REPORT (API /reports/deliveries)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DeliveryReportItemDto {

        private String date;                  // "2025-12-10"
        private Integer totalTrips;
        private Integer completedTrips;
        private Integer cancelledTrips;
        private Integer delayedTrips;
        private Double onTimeRatePercent;
        private Double averageDelayMinutes;
        private Double totalDistanceKm;
    }

    // API 5: Compliance / Issues Report
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IssueReportItemDto {

        private String tripId;          // ID chuyến
        private String driverId;
        private String driverName;
        private String vehicleId;
        private String date;            // yyyy-MM-dd
        private String issueType;       // "Delayed", "Cancelled", "VehicleFailure", ...
        private String description;     // mô tả ngắn
        private Double delayMinutes;    // nếu có
    }

    // API 6: COMPLIANCE CHECK
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComplianceCheckDto {

        private Integer totalTripsChecked;
        private Integer compliantTrips;
        private Integer tripsWithViolations;

        private Integer totalViolations;
        private Integer speedingViolations;
        private Integer routeDeviationViolations;
        private Integer lateDeliveryViolations;

        private Integer driversWithViolations;
        private Double complianceRatePercent;   // % chuyến tuân thủ
    }

    // API 7: ROUTE ANALYTICS / SUMMARY
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RouteSummaryItemDto {

        private String routeId;                 // R001, R002...
        private String origin;                  // "Warehouse A"
        private String destination;             // "City Center"

        private Integer totalTrips;
        private Double totalDistanceKm;
        private Double averageDistanceKm;
        private Double averageDurationMinutes;
        private Double onTimeRatePercent;

        private String optimizationSuggestion;  // gợi ý tối ưu đơn giản
    }

    // API 8: ALERTS
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertDto {

        private String alertId;          // A001
        private String type;             // "VEHICLE_MAINTENANCE", "DRIVER_BEHAVIOR", "DELAY_RISK", ...
        private String severity;         // "LOW", "MEDIUM", "HIGH", "CRITICAL"
        private String title;            // "Vehicle V01 due for maintenance"
        private String message;          // mô tả chi tiết

        private String relatedDriverId;  // có thể null
        private String relatedDriverName;
        private String relatedVehicleId; // có thể null

        private String createdAt;        // "2025-12-11T10:30:00"
        private Boolean acknowledged;    // đã đọc/chấp nhận hay chưa
    }

    // API 9: MANAGER ACTIVITIES / AUDIT
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ManagerActivityDto {

        private String activityId;       // "M001"
        private String username;         // "sarah.manager"
        private String action;           // "VIEW_DRIVER_PERFORMANCE"
        private String description;      // mô tả ngắn
        private String entityType;       // "TRIP", "DRIVER", "VEHICLE", "ROUTE", ...
        private String entityId;         // "D001", "R003", ...

        private String timestamp;        // "2025-12-11T10:30:00"
        private String ipAddress;        // "192.168.1.10"
    }


}
