package com.logiflow.server.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProfileDto {

    // User details
    private Integer userId;
    private String username;
    private String email;
    private String roleName;
    private String roleDescription;
    private Boolean isActive;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;

    // Driver details (nullable if user is not a driver)
    private Boolean isDriver;
    private Integer driverId;
    private String fullName;
    private String phone;
    private String licenseType;
    private Integer yearsExperience;
    private String healthStatus;
    private BigDecimal currentLocationLat;
    private BigDecimal currentLocationLng;
    private String driverStatus;

    // Statistics
    private Integer totalTrips;
    private Integer completedTrips;
    private BigDecimal totalHoursWorked;
    private Integer totalOrders;
}
