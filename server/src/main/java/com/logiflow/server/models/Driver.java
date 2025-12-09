package com.logiflow.server.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "driver_id")
    private Integer driverId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    // Contact information (using User phone and fullName)

    @Column(name = "license_type", length = 10, nullable = false)
    private String licenseType;

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "license_expiry")
    private java.time.LocalDate licenseExpiryDate;

    @Column(name = "years_experience", nullable = false)
    private Integer yearsExperience;

    @Enumerated(EnumType.STRING)
    @Column(name = "health_status", length = 20, nullable = false)
    private HealthStatus healthStatus = HealthStatus.FIT;

    @Column(name = "current_location_lat", precision = 10, scale = 8)
    private BigDecimal currentLocationLat;

    @Column(name = "current_location_lng", precision = 11, scale = 8)
    private BigDecimal currentLocationLng;

    @Column(name = "rating", precision = 3, scale = 2)
    private java.math.BigDecimal rating;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "available";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public static enum HealthStatus {
        FIT,
        SICK,
        RESTING
    }

    @OneToMany(mappedBy = "driver", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TripAssignment> tripAssignments;

    @OneToMany(mappedBy = "driver", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DriverWorkLog> driverWorkLogs;
}
