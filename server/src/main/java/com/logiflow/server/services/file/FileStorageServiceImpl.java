package com.logiflow.server.services.file;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
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

    private final Cloudinary cloudinary;

    @Value("${app.upload.max-size:5242880}")
    private long maxSize;

    @Value("${app.upload.folder.profile-pictures}")
    private String profilePicturesFolder;

    @Value("${app.upload.folder.license-images}")
    private String licenseImagesFolder;

    @Value("${app.upload.folder.cv-documents}")
    private String cvDocumentsFolder;

    @Value("${app.upload.folder.business-licenses}")
    private String businessLicensesFolder;

    @Value("${app.upload.folder.tax-certificates}")
    private String taxCertificatesFolder;

    @Value("${app.upload.folder.company-logos}")
    private String companyLogosFolder;

    public FileStorageServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

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

        try {
            String filename = UUID.randomUUID().toString();

            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", profilePicturesFolder,
                    "public_id", filename,
                    "resource_type", "auto"
            );

            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            String secureUrl = (String) uploadResult.get("secure_url");

            if (secureUrl == null) {
                throw new RuntimeException("Cloudinary upload failed - no URL returned");
            }

            return secureUrl;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to Cloudinary", e);
        }
    }

    @Override
    public void deleteProfilePicture(String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) return;

        try {
            // Cloudinary URLs look like: https://res.cloudinary.com/cloud_name/image/upload/folder/filename
            // Extract public_id from URL (folder/filename without extension)
            String publicId = extractPublicIdFromCloudinaryUrl(cloudinaryUrl);

            if (publicId == null) {
                return; // Invalid URL format
            }

            Map<String, Object> deleteParams = ObjectUtils.asMap("resource_type", "image");
            cloudinary.uploader().destroy(publicId, deleteParams);

        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from Cloudinary", e);
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

        try {
            String filename = UUID.randomUUID().toString();

            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", licenseImagesFolder,
                    "public_id", filename,
                    "resource_type", "auto"
            );

            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            String secureUrl = (String) uploadResult.get("secure_url");

            if (secureUrl == null) {
                throw new RuntimeException("Cloudinary upload failed - no URL returned");
            }

            return secureUrl;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to Cloudinary", e);
        }
    }

    @Override
    public void deleteLicenseImage(String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) return;

        try {
            String publicId = extractPublicIdFromCloudinaryUrl(cloudinaryUrl);

            if (publicId == null) {
                return; // Invalid URL format
            }

            Map<String, Object> deleteParams = ObjectUtils.asMap("resource_type", "image");
            cloudinary.uploader().destroy(publicId, deleteParams);

        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from Cloudinary", e);
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

        try {
            String filename = UUID.randomUUID().toString();

            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", cvDocumentsFolder,
                    "public_id", filename,
                    "resource_type", "raw"
            );

            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            String secureUrl = (String) uploadResult.get("secure_url");

            if (secureUrl == null) {
                throw new RuntimeException("Cloudinary upload failed - no URL returned");
            }

            return secureUrl;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to Cloudinary", e);
        }
    }

    @Override
    public void deleteCV(String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) return;

        try {
            String publicId = extractPublicIdFromCloudinaryUrl(cloudinaryUrl);

            if (publicId == null) {
                return; // Invalid URL format
            }

            Map<String, Object> deleteParams = ObjectUtils.asMap("resource_type", "raw");
            cloudinary.uploader().destroy(publicId, deleteParams);

        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from Cloudinary", e);
        }
    }

    private String extractPublicIdFromCloudinaryUrl(String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) {
            return null;
        }

        try {
            // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
            // We need to extract: {folder}/{public_id}

            int uploadIndex = cloudinaryUrl.indexOf("/upload/");
            if (uploadIndex == -1) {
                return null;
            }

            String afterUpload = cloudinaryUrl.substring(uploadIndex + 8); // Skip "/upload/"
            int versionStart = afterUpload.indexOf("/v");

            String pathPart;
            if (versionStart != -1) {
                // Skip version part: /v1234567890/
                int firstSlashAfterVersion = afterUpload.indexOf('/', versionStart + 1);
                if (firstSlashAfterVersion == -1) {
                    return null;
                }
                pathPart = afterUpload.substring(firstSlashAfterVersion + 1);
            } else {
                pathPart = afterUpload;
            }

            // Remove file extension
            int lastDot = pathPart.lastIndexOf('.');
            if (lastDot != -1) {
                pathPart = pathPart.substring(0, lastDot);
            }

            return pathPart;

        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public String storeBusinessLicense(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("No file provided");
        }

        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds the allowed limit of " + maxSize + " bytes");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!ALLOWED_TYPES.contains(contentType) && !ALLOWED_DOCUMENT_TYPES.contains(contentType))) {
            throw new RuntimeException("Unsupported file type: " + contentType + ". Images and documents are allowed.");
        }

        try {
            String filename = UUID.randomUUID().toString();

            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", businessLicensesFolder,
                    "public_id", filename,
                    "resource_type", "auto"
            );

            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            String secureUrl = (String) uploadResult.get("secure_url");

            if (secureUrl == null) {
                throw new RuntimeException("Cloudinary upload failed - no URL returned");
            }

            return secureUrl;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to Cloudinary", e);
        }
    }

    @Override
    public void deleteBusinessLicense(String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) return;

        try {
            String publicId = extractPublicIdFromCloudinaryUrl(cloudinaryUrl);

            if (publicId == null) {
                return; // Invalid URL format
            }

            Map<String, Object> deleteParams = ObjectUtils.asMap("resource_type", "auto");
            cloudinary.uploader().destroy(publicId, deleteParams);

        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from Cloudinary", e);
        }
    }

    @Override
    public String storeTaxCertificate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("No file provided");
        }

        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds the allowed limit of " + maxSize + " bytes");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!ALLOWED_TYPES.contains(contentType) && !ALLOWED_DOCUMENT_TYPES.contains(contentType))) {
            throw new RuntimeException("Unsupported file type: " + contentType + ". Images and documents are allowed.");
        }

        try {
            String filename = UUID.randomUUID().toString();

            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", taxCertificatesFolder,
                    "public_id", filename,
                    "resource_type", "auto"
            );

            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            String secureUrl = (String) uploadResult.get("secure_url");

            if (secureUrl == null) {
                throw new RuntimeException("Cloudinary upload failed - no URL returned");
            }

            return secureUrl;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to Cloudinary", e);
        }
    }

    @Override
    public void deleteTaxCertificate(String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) return;

        try {
            String publicId = extractPublicIdFromCloudinaryUrl(cloudinaryUrl);

            if (publicId == null) {
                return; // Invalid URL format
            }

            Map<String, Object> deleteParams = ObjectUtils.asMap("resource_type", "auto");
            cloudinary.uploader().destroy(publicId, deleteParams);

        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from Cloudinary", e);
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
