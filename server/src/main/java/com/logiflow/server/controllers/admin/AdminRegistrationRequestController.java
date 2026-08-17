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
        String actor = authentication != null ? authentication.getName() : "admin";
        String result = registrationRequestService.approveRequest(id, actor);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<String> rejectRequest(@PathVariable Integer id, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        String result = registrationRequestService.rejectRequest(id, actor);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RegistrationRequest> updateRequest(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> updates,
            Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        RegistrationRequest saved = registrationRequestService.updateRequest(id, updates, actor);
        return ResponseEntity.ok(saved);
    }
}