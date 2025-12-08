package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO for fleet overview statistics in the admin dashboard.
 */
@Data
@Builder
@AllArgsConstructor
public class FleetOverviewDto {
    private final int activeVehicles;
    private final int activeDeliveries;
    private final int pendingDeliveries;
    private final BigDecimal totalRevenue;
    private final int totalVehicles;
    private final double vehicleUtilization;  // Percentage of vehicles actively in use

    // Factory method for better readability
    public static FleetOverviewDto of(
            int activeVehicles,
            int activeDeliveries,
            int pendingDeliveries,
            BigDecimal totalRevenue,
            int totalVehicles) {
        double utilization = totalVehicles > 0 
            ? (double) activeVehicles / totalVehicles * 100 
            : 0.0;
        return FleetOverviewDto.builder()
                .activeVehicles(activeVehicles)
                .activeDeliveries(activeDeliveries)
                .pendingDeliveries(pendingDeliveries)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalVehicles(totalVehicles)
                .vehicleUtilization(Math.round(utilization * 10.0) / 10.0)
                .build();
    }
}
