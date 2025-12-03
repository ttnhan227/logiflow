package com.logiflow.server.dtos.admin.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for performance report containing historical analytics
 */
@Data
@Builder
@AllArgsConstructor
public class PerformanceReportDto {
    private LocalDate startDate;
    private LocalDate endDate;
    
    // Trip metrics
    private Long totalTrips;
    private Long completedTrips;
    private Long cancelledTrips;
    private Double completionRate;
    private Double averageDeliveryTimeMinutes;
    
    // Revenue metrics
    private BigDecimal totalRevenue;
    private BigDecimal averageRevenuePerTrip;
    
    // Driver metrics
    private Integer totalActiveDrivers;
    private Double averageTripsPerDriver;
    
    // Historical trends
    private List<DailyTripStatsDto> dailyStats;
}
