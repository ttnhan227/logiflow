package com.logiflow.server.controllers.admin;

import com.logiflow.server.models.RegistrationRequest;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Customer;
import com.logiflow.server.repositories.registration.RegistrationRequestRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.customer.CustomerRepository;
import com.logiflow.server.services.admin.AuditLogService;
import com.logiflow.server.services.email.EmailService;
import com.logiflow.server.services.registration.RegistrationRequestServiceImpl;
import com.logiflow.server.websocket.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
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
    private CustomerRepository customerRepository;
    @Autowired
    private AuditLogService auditLogService;
    @Autowired
    private RegistrationRequestServiceImpl registrationRequestService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private EmailService emailService;
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

    private String generateCompanyCode(String companyName) {
        if (companyName == null || companyName.trim().isEmpty()) {
            return "COMP" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        // Create base code from company name
        String base = companyName.trim().toUpperCase()
            .replaceAll("[^A-Z0-9]", "") // Remove non-alphanumeric
            .substring(0, Math.min(8, companyName.length())); // Take first 8 chars

        if (base.length() < 4) {
            base = "COMP" + base;
        }

        // Ensure uniqueness
        String candidate = base;
        int attempt = 0;
        while (customerRepository.findByCompanyCode(candidate).isPresent()) {
            attempt++;
            candidate = base + (100 + (int) (Math.random() * 900));
            if (attempt > 20) {
                candidate = "COMP" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                break;
            }
        }
        return candidate;
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

        // Note: OCR extraction is performed during initial registration, not here
        // This keeps the controller simple and avoids complex OCR logic in admin views

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
        user.setDateOfBirth(req.getDateOfBirth());
        user.setAddress(req.getAddress());
        user.setRole(req.getRole());
        user.setIsActive(true);
        userRepository.save(user);
        // Create role-specific entity
        if (req.getRole() != null && "DRIVER".equalsIgnoreCase(req.getRole().getRoleName())) {
            // If approving a driver, create Driver entity
            Driver driver = new Driver();
            driver.setUser(user);

            // Map license fields from registration request
            driver.setLicenseType(req.getLicenseType() != null ? req.getLicenseType() : "");
            driver.setLicenseNumber(req.getLicenseNumber());
            if (req.getLicenseExpiry() != null) {
                driver.setLicenseExpiryDate(req.getLicenseExpiry());
            }
            driver.setLicenseIssueDate(req.getLicenseIssueDate());

            // Default yearsExperience to 0
            driver.setYearsExperience(0);
            // healthStatus default is FIT from entity
            // status default is available
            driverRepository.save(driver);
        } else if (req.getRole() != null && "CUSTOMER".equalsIgnoreCase(req.getRole().getRoleName())) {
            // If approving a customer, create Customer entity
            Customer customer = new Customer();
            customer.setUser(user);

            // Map company fields from registration request
            customer.setCompanyName(req.getCompanyName());
            customer.setCompanyCode(generateCompanyCode(req.getCompanyName()));
            customer.setDefaultDeliveryAddress(req.getCompanyAddress());

            // Initialize stats
            customer.setTotalOrders(0);
            customer.setTotalSpent(java.math.BigDecimal.ZERO);

            customerRepository.save(customer);
        }

        // Update request status
        req.setStatus(RegistrationRequest.RequestStatus.APPROVED);
        registrationRequestRepository.save(req);

        // Send welcome email with credentials
        logger.info("Attempting to send registration approval email to: {} (username: {}, role: {})",
            user.getEmail(), user.getUsername(), req.getRole().getRoleName());
        try {
            emailService.sendRegistrationApprovalEmail(
                user.getEmail(),
                user.getFullName(),
                user.getUsername(),
                tempPassword,
                req.getRole().getRoleName()
            );
            logger.info("Registration approval email sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send registration approval email to {}: {}", user.getEmail(), e.getMessage(), e);
            // Don't fail the approval process if email fails
        }

        auditLogService.log(
            "APPROVE_REGISTRATION",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Approved registration for: " + user.getUsername() + " (Role: " + req.getRole().getRoleName() + ")"
        );

        return ResponseEntity.ok(
            "Request approved successfully. Created account username='" + user.getUsername() +
            "' with temporary password='" + tempPassword + "'. Welcome email sent to " + user.getEmail() + "."
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
            "Rejected registration for: " + req.getEmail() + " (Role: " + req.getRole().getRoleName() + ")"
        );

        return ResponseEntity.ok("Request rejected successfully");
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RegistrationRequest> updateRequest(@PathVariable Integer id,
                                                            @RequestBody Map<String, Object> updates) {
        Optional<RegistrationRequest> reqOpt = registrationRequestRepository.findById(id);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }

        RegistrationRequest req = reqOpt.get();
        if (req.getStatus() != RegistrationRequest.RequestStatus.PENDING) {
            return ResponseEntity.badRequest().build(); // Can't edit processed requests
        }

        // Update editable fields
        if (updates.containsKey("fullName")) {
            req.setFullName((String) updates.get("fullName"));
        }
        if (updates.containsKey("phone")) {
            req.setPhone((String) updates.get("phone"));
        }
        if (updates.containsKey("dateOfBirth")) {
            String dateStr = (String) updates.get("dateOfBirth");
            if (dateStr != null && !dateStr.trim().isEmpty()) {
                req.setDateOfBirth(java.time.LocalDate.parse(dateStr));
            } else {
                req.setDateOfBirth(null);
            }
        }
        if (updates.containsKey("address")) {
            req.setAddress((String) updates.get("address"));
        }
        if (updates.containsKey("licenseNumber")) {
            req.setLicenseNumber((String) updates.get("licenseNumber"));
        }
        if (updates.containsKey("licenseType")) {
            req.setLicenseType((String) updates.get("licenseType"));
        }
        if (updates.containsKey("licenseExpiry")) {
            String dateStr = (String) updates.get("licenseExpiry");
            if (dateStr != null && !dateStr.trim().isEmpty()) {
                req.setLicenseExpiry(java.time.LocalDate.parse(dateStr));
            } else {
                req.setLicenseExpiry(null);
            }
        }
        if (updates.containsKey("emergencyContactName")) {
            req.setEmergencyContactName((String) updates.get("emergencyContactName"));
        }
        if (updates.containsKey("emergencyContactPhone")) {
            req.setEmergencyContactPhone((String) updates.get("emergencyContactPhone"));
        }

        RegistrationRequest saved = registrationRequestRepository.save(req);

        auditLogService.log(
            "UPDATE_REGISTRATION_REQUEST",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Updated registration request for: " + req.getEmail()
        );

        return ResponseEntity.ok(saved);
    }
}
