package com.logiflow.server.dtos.admin.vehicle;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleDto {
    private String vehicleType;
    private String licensePlate;
    private Integer capacity;
    private String requiredLicense;
    private BigDecimal currentLocationLat;
    private BigDecimal currentLocationLng;
    private String status;
}
