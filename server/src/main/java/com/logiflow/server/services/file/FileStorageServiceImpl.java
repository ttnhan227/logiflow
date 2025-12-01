package com.logiflow.server.services.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.upload.license.dir:uploads/license-images}")
    private String licenseUploadDir;

    @Value("${app.upload.cv.dir:uploads/cv-documents}")
    private String cvUploadDir;

    // fallback to property if present; otherwise default will be handled by spring property itself
    @Value("${app.upload.max-size:5242880}")
    private long maxSize;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private static final Set<String> ALLOWED_DOCUMENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private static final Map<String, String> CONTENT_TYPE_TO_EXT = new HashMap<>() {{
        put("image/jpeg", ".jpg");
        put("image/png", ".png");
        put("image/gif", ".gif");
        put("image/webp", ".webp");
        put("application/pdf", ".pdf");
        put("application/msword", ".doc");
        put("application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx");
    }};

    @Override
    public String storeProfilePicture(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("No file provided");
        }

        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds the allowed limit of " + maxSize + " bytes");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new RuntimeException("Unsupported file type: " + contentType);
        }

        String extension = getExtension(file.getOriginalFilename(), contentType);
        String filename = UUID.randomUUID().toString() + extension;

        try {
            Path targetDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            // create directories if not exist
            Files.createDirectories(targetDir);

            Path target = targetDir.resolve(filename);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }

            // Build public path starting with / (as stored in DB and expected by client)
            String publicPath = "/" + uploadDir.replaceAll("\\\\", "/") + "/" + filename;
            // Normalize duplicate slashes
            publicPath = publicPath.replaceAll("/+", "/");
            return publicPath;

        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public void deleteProfilePicture(String publicPath) {
        if (publicPath == null || publicPath.isBlank()) return;

        try {
            // Only allow deleting files that are under the configured uploadDir
            // uploadDir is like "uploads/profile-pictures"
            String normalizedUploadDir = Paths.get(uploadDir).toAbsolutePath().normalize().toString();

            // Derive filename from publicPath safely
            String filename = null;
            int lastSlash = publicPath.lastIndexOf('/');
            if (lastSlash >= 0 && lastSlash < publicPath.length() - 1) {
                filename = publicPath.substring(lastSlash + 1);
            } else {
                // nothing to delete
                return;
            }

            Path target = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);

            // Ensure target is inside upload dir
            if (!target.toAbsolutePath().normalize().startsWith(normalizedUploadDir)) {
                return; // do not delete outside upload dir
            }

            if (Files.exists(target) && Files.isRegularFile(target)) {
                Files.delete(target);
            }
        } catch (IOException e) {
            // swallow or rethrow as runtime? we choose to throw wrapped runtime so caller can log/handle
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    @Override
    public String storeLicenseImage(MultipartFile file) {
        // Reuse same validations as profile picture
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("No file provided");
        }

        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds the allowed limit of " + maxSize + " bytes");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new RuntimeException("Unsupported file type: " + contentType);
        }

        String extension = getExtension(file.getOriginalFilename(), contentType);
        String filename = UUID.randomUUID().toString() + extension;

        try {
            Path targetDir = Paths.get(licenseUploadDir).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);
            Path target = targetDir.resolve(filename);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            String publicPath = "/" + licenseUploadDir.replaceAll("\\\\", "/") + "/" + filename;
            return publicPath.replaceAll("/+", "/");
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public void deleteLicenseImage(String publicPath) {
        if (publicPath == null || publicPath.isBlank()) return;
        try {
            String normalizedUploadDir = Paths.get(licenseUploadDir).toAbsolutePath().normalize().toString();
            String filename = null;
            int lastSlash = publicPath.lastIndexOf('/');
            if (lastSlash >= 0 && lastSlash < publicPath.length() - 1) {
                filename = publicPath.substring(lastSlash + 1);
            } else {
                return;
            }
            Path target = Paths.get(licenseUploadDir).toAbsolutePath().normalize().resolve(filename);
            if (!target.toAbsolutePath().normalize().startsWith(normalizedUploadDir)) {
                return;
            }
            if (Files.exists(target) && Files.isRegularFile(target)) {
                Files.delete(target);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    @Override
    public String storeCV(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("No file provided");
        }

        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds the allowed limit of " + maxSize + " bytes");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_DOCUMENT_TYPES.contains(contentType)) {
            throw new RuntimeException("Unsupported file type: " + contentType + ". Only PDF and Word documents are allowed.");
        }

        String extension = getExtension(file.getOriginalFilename(), contentType);
        String filename = UUID.randomUUID().toString() + extension;

        try {
            Path targetDir = Paths.get(cvUploadDir).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);
            Path target = targetDir.resolve(filename);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            String publicPath = "/" + cvUploadDir.replaceAll("\\\\", "/") + "/" + filename;
            return publicPath.replaceAll("/+", "/");
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public void deleteCV(String publicPath) {
        if (publicPath == null || publicPath.isBlank()) return;
        try {
            String normalizedUploadDir = Paths.get(cvUploadDir).toAbsolutePath().normalize().toString();
            String filename = null;
            int lastSlash = publicPath.lastIndexOf('/');
            if (lastSlash >= 0 && lastSlash < publicPath.length() - 1) {
                filename = publicPath.substring(lastSlash + 1);
            } else {
                return;
            }
            Path target = Paths.get(cvUploadDir).toAbsolutePath().normalize().resolve(filename);
            if (!target.toAbsolutePath().normalize().startsWith(normalizedUploadDir)) {
                return;
            }
            if (Files.exists(target) && Files.isRegularFile(target)) {
                Files.delete(target);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    private String getExtension(String originalFilename, String contentType) {
        if (originalFilename != null) {
            int idx = originalFilename.lastIndexOf('.');
            if (idx > 0 && idx < originalFilename.length() - 1) {
                return originalFilename.substring(idx);
            }
        }
        // fallback from content type
        return CONTENT_TYPE_TO_EXT.getOrDefault(contentType, "");
    }
}
