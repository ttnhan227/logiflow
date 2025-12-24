package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

/**
 * DTO for fleet lifecycle and asset management data
 */
@Data
@Builder
@AllArgsConstructor
public class FleetLifecycleDto {
    // Age analysis
    private final Map<String, Integer> vehicleAgeGroups; // "0-2_years", "2-4_years", "4+_years"
    private final Map<String, Integer> vehicleTypes; // "Container Trucks", "Heavy Trucks", "Vans"

    // Utilization status
    private final Integer availableVehicles;
    private final Integer inUseVehicles;
    private final Integer maintenanceVehicles;

    // Static factory method
    public static FleetLifecycleDto of(
            Map<String, Integer> vehicleAgeGroups,
            Map<String, Integer> vehicleTypes,
            Integer availableVehicles,
            Integer inUseVehicles,
            Integer maintenanceVehicles) {
        return FleetLifecycleDto.builder()
            .vehicleAgeGroups(vehicleAgeGroups)
            .vehicleTypes(vehicleTypes)
            .availableVehicles(availableVehicles)
            .inUseVehicles(inUseVehicles)
            .maintenanceVehicles(maintenanceVehicles)
            .build();
    }
}
