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
}
