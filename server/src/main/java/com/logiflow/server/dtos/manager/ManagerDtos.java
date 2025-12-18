package com.logiflow.server.dtos.manager;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class ManagerDtos {
    // 1. Manager Overview
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagerOverviewDto {

        private OverviewKpiDto kpi;

        private FleetStatusDto fleet;

        private DeliveriesSummaryDto deliveriesSummary;

        private List<AlertDto> topAlerts;

        private LocalDateTime lastUpdated;
    }

    // KPI tổng hợp
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewKpiDto {
        private int totalTrips;
        private int completedTrips;
        private int delayedTrips;
        private double onTimeRatePercent;
        private double fleetUtilizationPercent;
    }

    // Deliveries summary
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliveriesSummaryDto {
        private int totalTrips;
        private int completedTrips;
        private int cancelledTrips;
        private int delayedTrips;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationDto {
        private String code;        // ROUTE_DELAY / OVER_CAPACITY / COMPLIANCE / MAINTENANCE
        private String severity;    // HIGH / MEDIUM
        private String message;     // việc cần làm
        private String evidence;    // số liệu dẫn chứng
    }

    // 2 OPERATIONS PERFORMANCE (API /operations/performance)
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

        // tonnage utilization
        private Double totalCargoWeightKg;
        private Double totalVehicleCapacityKg;
        private Double averageTonnageUtilizationPercent;
        private Integer overCapacityTrips;

        //
        private Integer delayedCompletedTrips;
        private Integer delayedInProgressTrips;
        private Integer eligibleCompletedTrips;

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

        private String date;
        private Integer totalTrips;
        private Integer completedTrips;
        private Integer cancelledTrips;
        private Integer delayedTrips;
        private Double onTimeRatePercent;
        private Double averageDelayMinutes;
        private Double totalDistanceKm;
        private Double totalCargoWeightKg;
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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IssuesSummaryDto {
        private int totalIssues;
        private int delayedIssues;
        private int cancelledIssues;
        private int technicalIssues; // tạm thời 0 (chưa có model)
        private int highSeverity;    // tạm thời 0 (chưa có severity)
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IssuesReportResponseDto {
        private IssuesSummaryDto summary;
        private List<IssueReportItemDto> items;
    }

    // API 6: COMPLIANCE CHECK
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComplianceSummaryDto {
        private int totalViolations;
        private int highRiskCount;
        private int mediumRiskCount;
        private int lowRiskCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComplianceViolationDto {
        private String date;
        private String tripId;
        private String ruleCode;       // e.g. ARRIVAL_DELAY, MISSING_ACTUAL_TIME
        private String severity;       // LOW | MEDIUM | HIGH
        private String description;
        private Double value;          // số phút trễ, hoặc null
        private String driverId;     // thêm
        private String driverName;   // thêm
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComplianceCheckResponseDto {
        private ComplianceSummaryDto summary;
        private List<ComplianceViolationDto> items;
    }

    // API 7: ROUTE ANALYTICS / SUMMARY
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RouteSummaryItemDto {

        private String routeId;
        private String origin;
        private String destination;

        private Integer totalTrips;
        private Double totalDistanceKm;
        private Double averageDistanceKm;
        private Double averageDurationMinutes;
        private Double onTimeRatePercent;

        private String optimizationSuggestion;
        private Integer delayedTrips;
        private Integer cancelledTrips;
        private Double averageDelayMinutes;
        private Double totalCargoWeightKg;

    }

    // API 8: ALERTS
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertDto {

        private String alertId;
        private String type;
        private String severity;         // "LOW", "MEDIUM", "HIGH", "CRITICAL"
        private String title;
        private String message;

        private String relatedTripId;
        private String relatedDriverId;
        private String relatedDriverName;
        private String relatedVehicleId;

        private String createdAt;
        private Boolean acknowledged;
    }

    // API 9: MANAGER ACTIVITIES / AUDIT
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ManagerActivityDto {

        private String activityId;
        private String username;
        private String action;
        private String description;
        private String entityType;
        private String entityId;

        private String timestamp;
        private String ipAddress;
    }


}
