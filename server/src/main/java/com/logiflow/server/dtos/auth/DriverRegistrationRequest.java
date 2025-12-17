package com.logiflow.server.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DriverRegistrationRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String fullName;

    @NotBlank
    private String phone;

    // License fields
    private String licenseNumber;
    @NotBlank
    private String licenseType;
    @NotBlank
    private String licenseExpiry; // ISO date string, validated in service
    private String licenseIssueDate; // optional ISO date
    private String dateOfBirth; // optional ISO date

    private String address;

    // Emergency
    @NotBlank
    private String emergencyContactName;
    @NotBlank
    private String emergencyContactPhone;

    // Optional URL from upload step (future)
    private String licenseImageUrl;
    
    // Optional CV URL
    private String cvUrl;
}
