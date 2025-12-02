package com.logiflow.server.dtos.admin.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

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
    private BigDecimal totalRevenue;
    private String status;
}
