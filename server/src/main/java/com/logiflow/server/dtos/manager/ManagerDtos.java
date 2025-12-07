package com.logiflow.server.dtos.manager;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ManagerDtos {

    // 1. DASHBOARD
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ManagerOverviewDto {

        private Integer totalTrips;
        private Integer completedTrips;
        private Integer cancelledTrips;

        private Integer totalDrivers;
        private Integer activeDrivers;

        private Integer totalVehicles;
        private Integer activeVehicles;

        private Integer openIncidents;
        private Integer unresolvedAlerts;

        private Integer onTimeCompletedTrips;
        private Double onTimeRatePercent;

        private Double totalDistanceKm;
        private Double averageVehicleUtilizationPercent;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ManagerKpiDto {

        private Double onTimeRatePercent;
        private Double averageDelayMinutes;
        private Double averageDistancePerTripKm;
        private Double averageLoadUtilizationPercent;
    }

    // 2. OPERATIONS
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class PerformanceSummaryDto {

        private Integer totalTrips;
        private Integer completedTrips;
        private Integer cancelledTrips;
        private Integer delayedTrips;

        private Double onTimeRatePercent;
        private Double averageDelayMinutes;

        private Double totalDistanceKm;
        private Double averageDistancePerTripKm;

        private Double averageFuelConsumptionPerTripLiters;
        private Double averageCostPerTrip;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DriverPerformanceDto {

        private String driverId;
        private String driverCode;
        private String driverName;

        private Integer totalTrips;
        private Integer completedTrips;
        private Integer cancelledTrips;
        private Integer delayedTrips;

        private Double onTimeRatePercent;
        private Double averageDelayMinutes;

        private Double totalDistanceKm;
        private Double averageDistancePerTripKm;

        private Double averageRating;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class FleetStatusDto {

        private Integer totalVehicles;
        private Integer activeVehicles;
        private Integer idleVehicles;
        private Integer inMaintenanceVehicles;
        private Integer unavailableVehicles;

        private Double averageUtilizationPercent;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VehicleStatusDto {

        private String vehicleId;
        private String licensePlate;

        private String status;        // ACTIVE, IDLE, MAINTENANCE, UNAVAILABLE, ...
        private Integer activeTrips;
        private Double utilizationPercent;
    }

    // 3. COMPLIANCE
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ComplianceCheckResultDto {

        private Integer totalDrivers;
        private Integer compliantDrivers;
        private Integer nonCompliantDrivers;

        private Integer totalVehicles;
        private Integer compliantVehicles;
        private Integer nonCompliantVehicles;

        private List<DriverComplianceDto> driverDetails;
        private List<VehicleComplianceDto> vehicleDetails;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DriverComplianceDto {

        private String driverId;
        private String driverCode;
        private String driverName;

        private Boolean compliant;
        private List<String> violations;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VehicleComplianceDto {

        private String vehicleId;
        private String licensePlate;

        private Boolean compliant;
        private List<String> violations;
    }

    // 4. ANALYTICS (ROUTE SUMMARY)
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RouteSummaryDto {

        private String routeId;
        private String routeCode;
        private String routeName;

        private Integer totalTrips;
        private Integer completedTrips;
        private Integer cancelledTrips;

        private Double onTimeRatePercent;

        private Double averageDistanceKm;
        private Double averageDurationMinutes;

        private Double averageFuelConsumptionLiters;
        private Double averageLoadUtilizationPercent;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RouteSummaryOverviewDto {

        private Integer totalRoutes;
        private Integer totalTrips;
        private Integer completedTrips;

        private Double overallOnTimeRatePercent;

        private List<RouteSummaryDto> routes;
    }

    // 5. ALERTS
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AlertDto {

        private String id;

        private String type;         // DELAY, INCIDENT, VEHICLE_BREAKDOWN, ...
        private String severity;     // INFO, WARNING, CRITICAL
        private String message;

        private String source;       // SYSTEM, DRIVER_APP, DISPATCH, ...
        private String status;       // OPEN, IN_PROGRESS, RESOLVED

        private String relatedEntityType; // TRIP, VEHICLE, DRIVER, ...
        private String relatedEntityId;

        private LocalDateTime createdAt;
        private LocalDateTime resolvedAt;
    }

    // 6. AUDIT (MANAGER ACTIVITIES)
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ManagerActivityLogDto {

        private String id;

        private String actorId;
        private String actorName;

        private String action;       // "UPDATE_TRIP_STATUS", "APPROVE_ORDER", ...
        private String entityType;   // TRIP, ORDER, VEHICLE, DRIVER, ...
        private String entityId;

        private String description;

        private LocalDateTime timestamp;
        private String ipAddress;
    }

    // 7. REPORTS (DELIVERIES)
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DeliveryReportItemDto {

        private String shipmentId;
        private String orderCode;

        private String routeId;
        private String routeName;

        private String driverId;
        private String driverName;

        private String vehicleId;
        private String vehiclePlate;

        private LocalDateTime pickupTime;
        private LocalDateTime deliveryTime;

        private String status;               // COMPLETED, CANCELLED, FAILED, ...

        private Double distanceKm;
        private Double totalWeightKg;

        private BigDecimal codAmount;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DeliveryReportDto {

        private Integer totalRecords;
        private Integer completedDeliveries;
        private Integer failedDeliveries;

        private Double totalDistanceKm;
        private Double averageDistancePerDeliveryKm;

        private BigDecimal totalCodAmount;

        private List<DeliveryReportItemDto> items;
    }
}
