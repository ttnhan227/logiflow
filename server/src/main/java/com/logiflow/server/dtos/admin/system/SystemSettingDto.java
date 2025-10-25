package com.logiflow.server.dtos.admin.system;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingDto {

    private Integer settingId;
    private String category;
    private String key;
    private String value; // Consider masking sensitive values in response
    private Boolean isEncrypted;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
