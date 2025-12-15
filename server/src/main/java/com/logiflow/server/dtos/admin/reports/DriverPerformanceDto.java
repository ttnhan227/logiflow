package com.logiflow.server.dtos.admin.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for individual driver performance metrics
 */
@Data
@Builder
@AllArgsConstructor
public class DriverPerformanceDto {
    private Integer driverId;
    private String driverName;
    private String email;
    private String phone;
    private Long totalTripsCompleted;
    private Long totalTripsCancelled;
    private Double completionRate;
    private Double averageDeliveryTimeMinutes;
    private Double onTimeDeliveryRate;
    private Double customerRating;
    private BigDecimal totalRevenue;
    private String status;

    // Week 3 additions
    private Double performanceScore; // Composite score (0-100)
    private String performanceGrade; // Excellent, Good, Needs Improvement, Critical
    private List<String> performanceAlerts; // Active alerts for this driver
    private List<String> improvementRecommendations; // Coach recommendations

    // Phase 1 Extended Metrics
    private Double dailyConsistencyScore; // Consistency measure (0-100)
    private Double peakHourPerformance; // Performance during 8AM-6PM
    private Double offHourPerformance; // Performance during off-hours
    private Double averageRevenuePerTrip; // Efficiency metric

    // Phase 3 Extended Features
    private List<String> efficiencyBadges; // Virtual achievement badges
}
