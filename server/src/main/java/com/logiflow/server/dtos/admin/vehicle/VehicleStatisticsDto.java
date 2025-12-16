package com.logiflow.server.dtos.admin.vehicle;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleStatisticsDto {
    private Integer totalVehicles;
    private Integer availableVehicles;
    private Integer inUseVehicles;
    private Integer maintenanceVehicles;
    private Integer vans;
    private Integer trucks;
    private Integer containers;
}
