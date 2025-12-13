package com.logiflow.server.dtos.admin.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * DTO for vehicle type costs
 */
@Data
@Builder
@AllArgsConstructor
public class VehicleTypeCostDto {
    private String vehicleType;
    private Integer totalVehicles;
    private Integer activeVehicles;
    private Long tripsCompleted;
    private Double utilizationRate;
}
