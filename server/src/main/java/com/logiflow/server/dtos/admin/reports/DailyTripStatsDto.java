package com.logiflow.server.dtos.admin.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for daily trip statistics
 */
@Data
@Builder
@AllArgsConstructor
public class DailyTripStatsDto {
    private LocalDate date;
    private Long totalTrips;
    private Long completedTrips;
    private Long cancelledTrips;
    private BigDecimal revenue;
    private Double averageDeliveryTimeMinutes;
}
