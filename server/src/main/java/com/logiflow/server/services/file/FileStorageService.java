package com.logiflow.server.services.file;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    /**
     * Store a profile picture file and return the public path to the stored file
     * (for example: /uploads/profile-pictures/<filename>). Throws runtime exceptions
     * on validation or IO errors.
     */
    String storeProfilePicture(MultipartFile file);

    /**
     * Delete a stored profile picture given its public path (e.g. /uploads/profile-pictures/<file>).
     * This method should be safe and only delete files that were stored under the configured upload dir.
     */
    void deleteProfilePicture(String publicPath);

    /**
     * Store a driver's license image in a public license-images folder and return the public path
     * (e.g. /uploads/license-images/<filename>).
     */
    String storeLicenseImage(MultipartFile file);

    /**
     * Delete a stored driver's license image given its public path.
     */
    void deleteLicenseImage(String publicPath);

    /**
     * Store a CV file (PDF or document) and return the public path
     * (e.g. /uploads/cv-documents/<filename>).
     */
    String storeCV(MultipartFile file);

    /**
     * Delete a stored CV file given its public path.
     */
    void deleteCV(String publicPath);

    /**
     * Store a business license document and return the public path
     * (e.g. /uploads/business-licenses/<filename>).
     */
    String storeBusinessLicense(MultipartFile file);

    /**
     * Delete a stored business license document given its public path.
     */
    void deleteBusinessLicense(String publicPath);

    /**
     * Store a tax certificate document and return the public path
     * (e.g. /uploads/tax-certificates/<filename>).
     */
    String storeTaxCertificate(MultipartFile file);

    /**
     * Delete a stored tax certificate document given its public path.
     */
    void deleteTaxCertificate(String publicPath);
}
