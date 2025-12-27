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
    // Core Fleet Management
    private Integer vehicleId;
    private String vehicleType; // Container Truck, Tractor Unit, Heavy Lorry
    private String licensePlate;
    private BigDecimal capacityTons; // Heavy cargo focus
    private String requiredLicense; // B1, C, D, E

    // Vehicle Specifications
    private String make; // Mercedes, Volvo, MAN
    private String model; // Actros 1845, FH 460
    private String fuelType; // Diesel, LNG

    // Compliance & Safety
    private LocalDateTime registrationExpiryDate;
    private LocalDateTime insuranceExpiryDate;
    private LocalDateTime lastSafetyInspectionDate;
    private LocalDateTime nextSafetyInspectionDueDate;

    // Operational Status
    private String status;
    private BigDecimal currentLocationLat;
    private BigDecimal currentLocationLng;

    // Performance Tracking
    private Integer totalTripsCompleted;
    private BigDecimal totalDistanceDrivenKm;
    private BigDecimal averageFuelEfficiencyKmPerLiter;
    private BigDecimal totalFuelConsumedLiters;

    // Maintenance Tracking
    private LocalDateTime lastMaintenanceDate;
    private LocalDateTime nextMaintenanceDueDate;
    private BigDecimal maintenanceCostThisYear;
    private BigDecimal totalMaintenanceCost;

    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Trip Statistics (for compatibility)
    private Integer totalTrips;
    private Integer activeTrips;
}
