package com.logiflow.server.controllers.upload;

import com.logiflow.server.dtos.upload.UploadResponse;
import com.logiflow.server.exceptions.BusinessRuleException;
import com.logiflow.server.services.file.FileStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final FileStorageService fileStorageService;

    public UploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(value = "/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> uploadProfilePicture(Authentication authentication, @RequestParam("file") MultipartFile file) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Profile picture file cannot be empty");
        }

        String path = fileStorageService.storeProfilePicture(file);
        UploadResponse response = new UploadResponse(path);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/license-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> uploadLicenseImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("License image file cannot be empty");
        }

        String path = fileStorageService.storeLicenseImage(file);
        UploadResponse response = new UploadResponse(path);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/cv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> uploadCV(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("CV file cannot be empty");
        }

        String path = fileStorageService.storeCV(file);
        UploadResponse response = new UploadResponse(path);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/business-license", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> uploadBusinessLicense(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Business license file cannot be empty");
        }

        String path = fileStorageService.storeBusinessLicense(file);
        UploadResponse response = new UploadResponse(path);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/tax-certificate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> uploadTaxCertificate(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Tax certificate file cannot be empty");
        }

        String path = fileStorageService.storeTaxCertificate(file);
        UploadResponse response = new UploadResponse(path);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

