package com.logiflow.server.dtos.admin.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Comprehensive business intelligence report combining all analytics
 */
@Data
@Builder
@AllArgsConstructor
public class ComprehensiveReportDto {
    private LocalDate startDate;
    private LocalDate endDate;

    // === PERFORMANCE METRICS ===
    private Long totalTrips;
    private Long completedTrips;
    private Long cancelledTrips;
    private Double completionRate;
    private Double averageDeliveryTimeMinutes;
    private Double fleetUtilizationRate;
    private Double customerSatisfactionScore;
    private BigDecimal totalRevenue;
    private BigDecimal averageRevenuePerTrip;
    private Integer totalActiveDrivers;
    private Double averageTripsPerDriver;
    private List<DailyTripStatsDto> dailyStats;

    // === COST ANALYSIS ===
    private BigDecimal totalCosts;
    private BigDecimal netProfit;
    private Double profitMarginPercentage;
    private Double averageCostPerTrip;
    private Integer totalVehicles;
    private Integer activeVehicles;
    private Double vehicleUtilizationRate;
    private List<VehicleTypeCostDto> costBreakdownByCategory;
    private List<VehicleTypeCostDto> vehicleTypeCosts;

    // === COMPLIANCE METRICS ===
    private Double overallComplianceRate;
    private Integer workingHoursViolations;
    private Integer upcomingLicenseExpirations;
    private Integer restPeriodViolations;
    private Integer totalDrivers;
    private Integer driversWithValidLicense;
    private Integer driversWithExpiredLicense;
    private Integer driversWithExpiringSoonLicense;

    // === DRIVER PERFORMANCE ===
    private List<DriverPerformanceDto> driverPerformanceRankings;
    private Integer totalDriverCount;

    // === ADDITIONAL COMPUTED METRICS ===
    private Double onTimeDeliveryRate; // Overall on-time rate across all drivers
}
