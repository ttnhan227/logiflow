package com.logiflow.server.dtos.upload;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UploadResponse {
    // Path relative to server root, e.g. /uploads/profile-pictures/<file>
    private String path;
}
