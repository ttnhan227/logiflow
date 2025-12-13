package com.logiflow.server.dtos.admin.vehicle;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDto {
    private Integer vehicleId;
    private String vehicleType;
    private String licensePlate;
    private Integer capacity;
    private String requiredLicense;
    private BigDecimal currentLocationLat;
    private BigDecimal currentLocationLng;
    private String status;
    private LocalDateTime createdAt;
    private Integer totalTrips;
    private Integer activeTrips;
}
