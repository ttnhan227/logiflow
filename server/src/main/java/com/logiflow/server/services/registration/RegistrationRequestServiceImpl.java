package com.logiflow.server.services.registration;

import com.logiflow.server.dtos.auth.DriverRegistrationRequest;
import com.logiflow.server.models.RegistrationRequest;
import com.logiflow.server.models.Role;
import com.logiflow.server.repositories.registration.RegistrationRequestRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.websocket.NotificationService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class RegistrationRequestServiceImpl implements RegistrationRequestService {

    private final RegistrationRequestRepository registrationRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public RegistrationRequestServiceImpl(
            RegistrationRequestRepository registrationRequestRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService) {
        this.registrationRequestRepository = registrationRequestRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    @Override
    public void createDriverRequest(DriverRegistrationRequest req) {
        // Uniqueness checks across users and pending requests
        userRepository.findByUsername(req.getUsername()).ifPresent(u -> { throw new RuntimeException("Username already exists"); });
        userRepository.findByEmail(req.getEmail()).ifPresent(u -> { throw new RuntimeException("Email already exists"); });
        registrationRequestRepository.findByUsername(req.getUsername()).ifPresent(r -> { throw new RuntimeException("Username is already pending approval"); });
        registrationRequestRepository.findByEmail(req.getEmail()).ifPresent(r -> { throw new RuntimeException("Email is already pending approval"); });

        Role driverRole = roleRepository.findByRoleName("DRIVER")
                .orElseThrow(() -> new RuntimeException("Driver role not found"));

        RegistrationRequest entity = new RegistrationRequest();
        entity.setUsername(req.getUsername());
        entity.setEmail(req.getEmail());
        entity.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        entity.setFullName(req.getFullName());
        entity.setPhone(req.getPhone());
        entity.setRole(driverRole);
        entity.setStatus(RegistrationRequest.RequestStatus.PENDING);
        entity.setCreatedAt(LocalDateTime.now());

        // Map driver fields
        entity.setLicenseNumber(req.getLicenseNumber());
        entity.setLicenseType(req.getLicenseType());
        if (req.getLicenseExpiry() != null && !req.getLicenseExpiry().isBlank()) {
            entity.setLicenseExpiry(LocalDate.parse(req.getLicenseExpiry()));
        }
        if (req.getDateOfBirth() != null && !req.getDateOfBirth().isBlank()) {
            entity.setDateOfBirth(LocalDate.parse(req.getDateOfBirth()));
        }
        entity.setAddress(req.getAddress());
        entity.setEmergencyContactName(req.getEmergencyContactName());
        entity.setEmergencyContactPhone(req.getEmergencyContactPhone());
        entity.setLicenseImageUrl(req.getLicenseImageUrl());
        entity.setCvUrl(req.getCvUrl());

        RegistrationRequest saved = registrationRequestRepository.save(entity);
        
        // Send notification to admins about new registration request
        notificationService.notifyNewRegistrationRequest(
            saved.getUsername(), 
            driverRole.getRoleName(), 
            saved.getRequestId()
        );
    }
}
