package com.logiflow.server.dtos.admin.user_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for driver user data in admin user management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverUserDto {
    // Base user fields
    private Integer userId;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String profilePictureUrl;
    private String roleName;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    // Driver-specific fields
    private String licenseType;
    private String licenseNumber;
    private LocalDate licenseExpiryDate;
    private LocalDate licenseIssueDate;
    private Integer yearsExperience;
    private String healthStatus;
    private BigDecimal currentLocationLat;
    private BigDecimal currentLocationLng;
    private BigDecimal rating;
    private String status;

    // Factory method for better readability
    public static DriverUserDto fromUserAndDriver(
            Integer userId, String username, String email, String fullName, String phone,
            String profilePictureUrl, String roleName, Boolean isActive, LocalDateTime createdAt, LocalDateTime lastLogin,
            String licenseType, String licenseNumber, LocalDate licenseExpiryDate, LocalDate licenseIssueDate,
            Integer yearsExperience, String healthStatus, BigDecimal currentLocationLat, BigDecimal currentLocationLng,
            BigDecimal rating, String status) {

        return DriverUserDto.builder()
                .userId(userId)
                .username(username)
                .email(email)
                .fullName(fullName)
                .phone(phone)
                .profilePictureUrl(profilePictureUrl)
                .roleName(roleName)
                .isActive(isActive)
                .createdAt(createdAt)
                .lastLogin(lastLogin)
                .licenseType(licenseType)
                .licenseNumber(licenseNumber)
                .licenseExpiryDate(licenseExpiryDate)
                .licenseIssueDate(licenseIssueDate)
                .yearsExperience(yearsExperience)
                .healthStatus(healthStatus)
                .currentLocationLat(currentLocationLat)
                .currentLocationLng(currentLocationLng)
                .rating(rating)
                .status(status)
                .build();
    }
}
