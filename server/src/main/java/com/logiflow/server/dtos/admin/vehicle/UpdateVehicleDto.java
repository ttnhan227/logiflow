package com.logiflow.server.dtos.admin.vehicle;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleDto {
    // Basic fields
    private String vehicleType;
    private String licensePlate;
    private BigDecimal capacityTons;
    private String requiredLicense;

    // Specifications
    private String make;
    private String model;
    private String fuelType;

    // Compliance dates
    private LocalDateTime registrationExpiryDate;
    private LocalDateTime insuranceExpiryDate;
    private LocalDateTime lastSafetyInspectionDate;
    private LocalDateTime nextSafetyInspectionDueDate;

    // Maintenance
    private LocalDateTime lastMaintenanceDate;
    private LocalDateTime nextMaintenanceDueDate;

    // Operational
    private BigDecimal currentLocationLat;
    private BigDecimal currentLocationLng;

    // Status
    private String status;
}
