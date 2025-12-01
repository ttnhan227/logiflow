package com.logiflow.server.controllers.admin;

import com.logiflow.server.models.RegistrationRequest;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.models.Driver;
import com.logiflow.server.repositories.registration.RegistrationRequestRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/registration-requests")
public class AdminRegistrationRequestController {
    @Autowired
    private RegistrationRequestRepository registrationRequestRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private DriverRepository driverRepository;

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
        return ResponseEntity.ok(reqOpt.get());
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
        // Create user
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPasswordHash(req.getPasswordHash());
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
            driver.setFullName(user.getFullName());
            driver.setPhone(user.getPhone());
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
        registrationRequestRepository.save(req);
        return ResponseEntity.ok("Request approved successfully");
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
        return ResponseEntity.ok("Request rejected successfully");
    }
}
