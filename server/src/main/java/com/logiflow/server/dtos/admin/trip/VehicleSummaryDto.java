package com.logiflow.server.dtos.admin.trip;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleSummaryDto {
    private Integer vehicleId;
    private String licensePlate;
    private java.math.BigDecimal capacityTons;
    private String vehicleType;
    private String status;
    // Add more fields as needed

    public static VehicleSummaryDto fromVehicle(com.logiflow.server.models.Vehicle vehicle) {
        if (vehicle == null) return null;
        return new VehicleSummaryDto(
            vehicle.getVehicleId(),
            vehicle.getLicensePlate(),
            vehicle.getCapacityTons(),
            vehicle.getVehicleType(),
            vehicle.getStatus()
        );
    }
}
