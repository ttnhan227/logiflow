package com.logiflow.server.controllers.admin;

import com.logiflow.server.models.RegistrationRequest;
import com.logiflow.server.services.registration.RegistrationRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/registration-requests")
public class AdminRegistrationRequestController {

    private final RegistrationRequestService registrationRequestService;

    public AdminRegistrationRequestController(RegistrationRequestService registrationRequestService) {
        this.registrationRequestService = registrationRequestService;
    }

    @GetMapping
    public ResponseEntity<List<RegistrationRequest>> getAllRequests() {
        return ResponseEntity.ok(registrationRequestService.getAllRequests());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistrationRequest> getRequestById(@PathVariable Integer id) {
        return registrationRequestService.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<String> approveRequest(@PathVariable Integer id, Authentication authentication) {
        try {
            String result = registrationRequestService.approveRequest(id, authentication.getName());
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<String> rejectRequest(@PathVariable Integer id, Authentication authentication) {
        try {
            String result = registrationRequestService.rejectRequest(id, authentication.getName());
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RegistrationRequest> updateRequest(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> updates,
            Authentication authentication) {
        try {
            RegistrationRequest saved = registrationRequestService.updateRequest(id, updates, authentication.getName());
            return ResponseEntity.ok(saved);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}