package com.logiflow.server.controllers.upload;

import com.logiflow.server.dtos.upload.UploadResponse;
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
        try {
            // Ensure the caller is authenticated. Security configuration requires authentication for /api/**,
            // but double-check here to provide a clear 401 when called without auth.
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            String path = fileStorageService.storeProfilePicture(file);
            UploadResponse response = new UploadResponse(path);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            // For now, return 400 Bad Request for validation/IO errors with no body
            return ResponseEntity.badRequest().build();
        }
    }
}
