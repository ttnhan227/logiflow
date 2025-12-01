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

    // Factory method for better readability
    public static FleetOverviewDto of(
            int activeVehicles,
            int activeDeliveries,
            int pendingDeliveries,
            BigDecimal totalRevenue) {
        return FleetOverviewDto.builder()
                .activeVehicles(activeVehicles)
                .activeDeliveries(activeDeliveries)
                .pendingDeliveries(pendingDeliveries)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .build();
    }
}
