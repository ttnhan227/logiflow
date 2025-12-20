package com.logiflow.server.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerRegistrationRequest {
    // Company Information
    @NotBlank
    private String companyName;

    @NotBlank
    private String companyTaxId;

    private String companyIndustry;

    @NotBlank
    private String companyAddress;

    private String companyPhone;

    private String companyWebsite;

    // Authorized User Information
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String fullName;

    @NotBlank
    private String phone;

    @NotBlank
    private String userPosition;

    // Optional document URLs (uploaded separately)
    private String businessLicenseUrl;
    private String taxCertificateUrl;
}
