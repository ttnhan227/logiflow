package com.logiflow.server.controllers.auth;

import com.logiflow.server.dtos.auth.AuthResponse;
import com.logiflow.server.dtos.auth.DriverRegistrationRequest;
import com.logiflow.server.services.registration.RegistrationRequestService;
import com.logiflow.server.services.registration.RegistrationRequestServiceImpl;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/registration")
public class DriverRegistrationController {

    private final RegistrationRequestService registrationRequestService;
    private final RegistrationRequestServiceImpl registrationRequestServiceImpl;

    public DriverRegistrationController(RegistrationRequestService registrationRequestService, RegistrationRequestServiceImpl registrationRequestServiceImpl) {
        this.registrationRequestService = registrationRequestService;
        this.registrationRequestServiceImpl = registrationRequestServiceImpl;
    }

    @PostMapping("/driver")
    public ResponseEntity<AuthResponse> registerDriver(@Valid @RequestBody DriverRegistrationRequest request) {
        try {
            registrationRequestService.createDriverRequest(request);
            return ResponseEntity.ok(new AuthResponse(null, null, null, null,
                    "Driver registration request submitted successfully. Please wait for admin approval."));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, null, null, null, ex.getMessage()));
        }
    }

    @PostMapping("/extract-license")
    public ResponseEntity<Map<String, Object>> extractLicenseInfo(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String imageUrl = request.get("imageUrl");
            if (imageUrl == null || imageUrl.trim().isEmpty()) {
                response.put("success", false);
                response.put("error", "No image URL provided");
                return ResponseEntity.badRequest().body(response);
            }

            RegistrationRequestServiceImpl.LicenseInfo licenseInfo = 
                registrationRequestServiceImpl.extractLicenseInfoFromUrl(imageUrl);

            if (licenseInfo.isExtractionSuccessful()) {
                Map<String, String> extractedData = new HashMap<>();
                extractedData.put("licenseNumber", licenseInfo.getLicenseNumber());
                extractedData.put("licenseType", licenseInfo.getLicenseType());
                extractedData.put("licenseExpiry", licenseInfo.getExpiryDate());
                
                response.put("success", true);
                response.put("data", extractedData);
                response.put("message", "License information extracted successfully");
            } else {
                response.put("success", false);
                response.put("error", licenseInfo.getErrorMessage());
                response.put("message", "OCR extraction failed - manual entry required");
            }

            return ResponseEntity.ok(response);

        } catch (Throwable e) {
            response.put("success", false);
            response.put("error", "OCR processing failed: " + e.getMessage());
            response.put("message", "Unable to process license image - please enter information manually");
            return ResponseEntity.status(500).body(response);
        }
    }
}
