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

    @Column(name = "vehicle_type", length = 20, nullable = false)
    private String vehicleType;

    @Column(name = "license_plate", length = 20, nullable = false, unique = true)
    private String licensePlate;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "required_license", length = 10, nullable = false)
    private String requiredLicense;

    @Column(name = "current_location_lat", precision = 10, scale = 8)
    private BigDecimal currentLocationLat;

    @Column(name = "current_location_lng", precision = 11, scale = 8)
    private BigDecimal currentLocationLng;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "available";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Trip> trips;
}
