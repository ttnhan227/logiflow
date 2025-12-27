package com.logiflow.server.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    private Integer vehicleId;

    // Core Fleet Management (per SRS requirements)
    @Column(name = "vehicle_type", length = 20, nullable = false)
    private String vehicleType; // Container Truck, Tractor Unit, Heavy Lorry

    @Column(name = "license_plate", length = 20, nullable = false, unique = true)
    private String licensePlate;

    @Column(name = "capacity_tons", nullable = false)
    private BigDecimal capacityTons; // Heavy cargo focus - tonnage capacity

    @Column(name = "required_license", length = 10, nullable = false)
    private String requiredLicense; // B1, C, D, E for heavy vehicles

    // Vehicle Specifications (essential for heavy logistics)
    @Column(name = "make", length = 50)
    private String make; // Mercedes, Volvo, MAN, etc.

    @Column(name = "model", length = 50)
    private String model; // Actros 1845, FH 460, etc.

    @Column(name = "fuel_type", length = 20)
    private String fuelType; // Diesel, LNG for heavy trucks

    // Compliance & Safety (critical for heavy transport)
    @Column(name = "registration_expiry_date")
    private LocalDateTime registrationExpiryDate;

    @Column(name = "insurance_expiry_date")
    private LocalDateTime insuranceExpiryDate;

    @Column(name = "last_safety_inspection_date")
    private LocalDateTime lastSafetyInspectionDate;

    @Column(name = "next_safety_inspection_due_date")
    private LocalDateTime nextSafetyInspectionDueDate;

    // Operational Status
    @Column(name = "status", length = 20, nullable = false)
    private String status = "available";

    @Column(name = "current_location_lat", precision = 10, scale = 8)
    private BigDecimal currentLocationLat;

    @Column(name = "current_location_lng", precision = 11, scale = 8)
    private BigDecimal currentLocationLng;

    // Performance Tracking (for driver assignment intelligence)
    @Column(name = "total_trips_completed")
    private Integer totalTripsCompleted = 0;

    @Column(name = "total_distance_driven_km", precision = 10, scale = 2)
    private BigDecimal totalDistanceDrivenKm = BigDecimal.ZERO;

    @Column(name = "average_fuel_efficiency_km_per_liter", precision = 4, scale = 2)
    private BigDecimal averageFuelEfficiencyKmPerLiter;

    @Column(name = "total_fuel_consumed_liters", precision = 10, scale = 2)
    private BigDecimal totalFuelConsumedLiters = BigDecimal.ZERO;

    // Maintenance Tracking (essential for fleet reliability)
    @Column(name = "last_maintenance_date")
    private LocalDateTime lastMaintenanceDate;

    @Column(name = "next_maintenance_due_date")
    private LocalDateTime nextMaintenanceDueDate;

    @Column(name = "maintenance_cost_this_year", precision = 12, scale = 2)
    private BigDecimal maintenanceCostThisYear = BigDecimal.ZERO;

    @Column(name = "total_maintenance_cost", precision = 12, scale = 2)
    private BigDecimal totalMaintenanceCost = BigDecimal.ZERO;

    // Metadata
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Trip> trips;
}
