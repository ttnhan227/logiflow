package com.logiflow.server.dtos.admin.system;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

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

    // Factory method for better readability
    public static FleetOverviewDto of(
            int activeVehicles,
            int activeDeliveries,
            int pendingDeliveries) {
        return FleetOverviewDto.builder()
                .activeVehicles(activeVehicles)
                .activeDeliveries(activeDeliveries)
                .pendingDeliveries(pendingDeliveries)
                .build();
    }
}
