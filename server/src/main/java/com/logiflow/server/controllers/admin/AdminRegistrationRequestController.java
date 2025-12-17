package com.logiflow.server.controllers.admin;

import com.logiflow.server.models.RegistrationRequest;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.models.Driver;
import com.logiflow.server.repositories.registration.RegistrationRequestRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.services.admin.AuditLogService;
import com.logiflow.server.services.registration.RegistrationRequestServiceImpl;
import com.logiflow.server.websocket.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/registration-requests")
public class AdminRegistrationRequestController {

    private static final Logger logger = LoggerFactory.getLogger(AdminRegistrationRequestController.class);

    @Autowired
    private RegistrationRequestRepository registrationRequestRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private DriverRepository driverRepository;
    @Autowired
    private AuditLogService auditLogService;
    @Autowired
    private RegistrationRequestServiceImpl registrationRequestService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private String generateUniqueUsername(RegistrationRequest req) {
        String base;
        if (req.getEmail() != null && req.getEmail().contains("@")) {
            base = req.getEmail().substring(0, req.getEmail().indexOf('@'));
        } else if (req.getFullName() != null && !req.getFullName().isBlank()) {
            base = req.getFullName().trim().toLowerCase().replaceAll("[^a-z0-9]+", ".");
        } else {
            base = "driver";
        }

        base = base.toLowerCase();
        if (base.length() > 30) {
            base = base.substring(0, 30);
        }
        if (base.isBlank()) {
            base = "driver";
        }

        String candidate = base;
        int attempt = 0;
        while (userRepository.findByUsername(candidate).isPresent()) {
            attempt++;
            candidate = base + "." + (1000 + (int) (Math.random() * 9000));
            if (attempt > 20) {
                candidate = "driver." + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
        }
        return candidate;
    }

    private String generateTempPassword() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    @GetMapping
    public ResponseEntity<List<RegistrationRequest>> getAllRequests() {
        List<RegistrationRequest> requests = registrationRequestRepository.findAll();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistrationRequest> getRequestById(@PathVariable Integer id) {
        Optional<RegistrationRequest> reqOpt = registrationRequestRepository.findById(id);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }

        RegistrationRequest req = reqOpt.get();

        // Trigger OCR extraction if license image exists and OCR hasn't been attempted
        if (req.getLicenseImageUrl() != null && !req.getLicenseImageUrl().trim().isEmpty()) {
            if (req.getOcrExtractionStatus() == null || "PENDING".equals(req.getOcrExtractionStatus())) {
                logger.info("Starting OCR extraction for registration request ID: {}", id);
                try {
                    RegistrationRequestServiceImpl.LicenseInfo licenseInfo = registrationRequestService.extractLicenseInfo(req.getLicenseImageUrl());

                    if (licenseInfo.isExtractionSuccessful()) {
                        req.setExtractedLicenseNumber(licenseInfo.getLicenseNumber());
                        req.setExtractedLicenseType(licenseInfo.getLicenseType());
                        if (licenseInfo.getExpiryDate() != null) {
                            req.setExtractedLicenseExpiry(LocalDate.parse(licenseInfo.getExpiryDate()));
                        }
                        req.setOcrExtractionStatus("SUCCESS");
                        req.setOcrErrorMessage(null);
                        logger.info("OCR extraction successful for request ID: {} - License: {}, Type: {}",
                            id, licenseInfo.getLicenseNumber(), licenseInfo.getLicenseType());
                    } else {
                        req.setOcrExtractionStatus("FAILED");
                        req.setOcrErrorMessage(licenseInfo.getErrorMessage());
                        logger.warn("OCR extraction failed for request ID: {} - Reason: {}", id, licenseInfo.getErrorMessage());
                    }

                    // Save the updated request with OCR results
                    registrationRequestRepository.save(req);
                } catch (Exception e) {
                    logger.error("OCR processing error for request ID: {} - Error: {}", id, e.getMessage(), e);
                    req.setOcrExtractionStatus("FAILED");
                    req.setOcrErrorMessage("OCR processing error: " + e.getMessage());
                    registrationRequestRepository.save(req);
                }
            } else {
                logger.debug("OCR already processed for request ID: {} - Status: {}", id, req.getOcrExtractionStatus());
            }
        } else {
            logger.debug("No license image found for request ID: {}", id);
        }

        return ResponseEntity.ok(req);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<String> approveRequest(@PathVariable Integer id) {
        Optional<RegistrationRequest> reqOpt = registrationRequestRepository.findById(id);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Request not found");
        }
        RegistrationRequest req = reqOpt.get();
        if (req.getStatus() != RegistrationRequest.RequestStatus.PENDING) {
            return ResponseEntity.badRequest().body("Request already processed");
        }

        // Admin creates credentials upon approval (driver does NOT set username/password)
        String generatedUsername = generateUniqueUsername(req);
        String tempPassword = generateTempPassword();

        // Create user
        User user = new User();
        user.setUsername(generatedUsername);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setFullName(req.getFullName());
        user.setRole(req.getRole());
        user.setIsActive(true);
        userRepository.save(user);
        // If approving a driver, create Driver entity as well
        if (req.getRole() != null && "DRIVER".equalsIgnoreCase(req.getRole().getRoleName())) {
            Driver driver = new Driver();
            driver.setUser(user);

            // Map licenseType if available
            driver.setLicenseType(req.getLicenseType() != null ? req.getLicenseType() : "");
            // Default yearsExperience to 0
            driver.setYearsExperience(0);
            // healthStatus default is FIT from entity
            // status default is available
            driverRepository.save(driver);
        }

        // Update request status
        req.setStatus(RegistrationRequest.RequestStatus.APPROVED);
        req.setUsername(generatedUsername);
        registrationRequestRepository.save(req);
        
        auditLogService.log(
            "APPROVE_REGISTRATION",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Approved registration for: " + user.getUsername() + " (Role: " + req.getRole().getRoleName() + ")"
        );
        
        return ResponseEntity.ok(
            "Request approved successfully. Created driver account username='" + user.getUsername() +
            "' with temporary password='" + tempPassword + "'."
        );
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<String> rejectRequest(@PathVariable Integer id) {
        Optional<RegistrationRequest> reqOpt = registrationRequestRepository.findById(id);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Request not found");
        }
        RegistrationRequest req = reqOpt.get();
        if (req.getStatus() != RegistrationRequest.RequestStatus.PENDING) {
            return ResponseEntity.badRequest().body("Request already processed");
        }
        req.setStatus(RegistrationRequest.RequestStatus.REJECTED);
        registrationRequestRepository.save(req);
        
        auditLogService.log(
            "REJECT_REGISTRATION",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Rejected registration for: " + req.getUsername() + " (Role: " + req.getRole().getRoleName() + ")"
        );
        
        return ResponseEntity.ok("Request rejected successfully");
    }
}
