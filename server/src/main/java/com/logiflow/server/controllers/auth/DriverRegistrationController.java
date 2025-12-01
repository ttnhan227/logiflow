package com.logiflow.server.controllers.auth;

import com.logiflow.server.dtos.auth.AuthResponse;
import com.logiflow.server.dtos.auth.DriverRegistrationRequest;
import com.logiflow.server.services.registration.RegistrationRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/driver")
public class DriverRegistrationController {

    private final RegistrationRequestService registrationRequestService;

    public DriverRegistrationController(RegistrationRequestService registrationRequestService) {
        this.registrationRequestService = registrationRequestService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerDriver(@Valid @RequestBody DriverRegistrationRequest request) {
        try {
            registrationRequestService.createDriverRequest(request);
            return ResponseEntity.ok(new AuthResponse(null, null, null, null,
                    "Driver registration request submitted successfully. Please wait for admin approval."));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, null, null, null, ex.getMessage()));
        }
    }
}
