package com.logiflow.server.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "registration_requests")
public class RegistrationRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Integer requestId;

    @Column(name = "email", length = 100, nullable = false, unique = true)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Driver-specific fields (optional for other roles)
    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "license_type", length = 20)
    private String licenseType;

    @Column(name = "license_expiry")
    private LocalDate licenseExpiry;

    @Column(name = "license_issue_date")
    private LocalDate licenseIssueDate;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(name = "license_image_url", length = 500)
    private String licenseImageUrl;

    @Column(name = "cv_url", length = 500)
    private String cvUrl;

    // Customer-specific fields (optional for other roles)
    @Column(name = "company_name", length = 100)
    private String companyName;

    @Column(name = "company_tax_id", length = 50)
    private String companyTaxId;

    @Column(name = "company_industry", length = 50)
    private String companyIndustry;

    @Column(name = "company_address", length = 255)
    private String companyAddress;

    @Column(name = "company_phone", length = 20)
    private String companyPhone;

    @Column(name = "company_website", length = 100)
    private String companyWebsite;

    @Column(name = "business_license_url", length = 500)
    private String businessLicenseUrl;

    @Column(name = "tax_certificate_url", length = 500)
    private String taxCertificateUrl;

    // User position in company (for customer registration)
    @Column(name = "user_position", length = 50)
    private String userPosition;

    public enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}
