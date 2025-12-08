package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * DTO for delivery time statistics (average delivery times per day of week)
 */
@Data
@Builder
@AllArgsConstructor
public class DeliveryTimeStatsDto {
    private String day;           // Day of week (Mon, Tue, etc.)
    private Double avgMinutes;    // Average delivery time in minutes
    
    public static DeliveryTimeStatsDto of(String day, Double avgMinutes) {
        return DeliveryTimeStatsDto.builder()
            .day(day)
            .avgMinutes(avgMinutes != null ? Math.round(avgMinutes * 10.0) / 10.0 : 0.0)
            .build();
    }
}
