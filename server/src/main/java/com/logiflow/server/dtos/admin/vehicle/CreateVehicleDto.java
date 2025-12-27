package com.logiflow.server.dtos.admin.vehicle;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateVehicleDto {
    // Required fields
    private String vehicleType;
    private String licensePlate;
    private BigDecimal capacityTons;
    private String requiredLicense;

    // Optional specifications
    private String make;
    private String model;
    private String fuelType;

    // Optional compliance dates
    private LocalDateTime registrationExpiryDate;
    private LocalDateTime insuranceExpiryDate;
    private LocalDateTime lastSafetyInspectionDate;
    private LocalDateTime nextSafetyInspectionDueDate;

    // Optional maintenance
    private LocalDateTime lastMaintenanceDate;
    private LocalDateTime nextMaintenanceDueDate;

    // Optional operational
    private BigDecimal currentLocationLat;
    private BigDecimal currentLocationLng;

    // Status (defaults to available if not provided)
    private String status;
}
