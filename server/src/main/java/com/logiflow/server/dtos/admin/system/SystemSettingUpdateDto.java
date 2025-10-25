package com.logiflow.server.dtos.admin.system;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for updating system settings in admin system management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingUpdateDto {

    @NotNull(message = "Setting ID is required")
    private Integer settingId;

    @Size(max = 50, message = "Category must be at most 50 characters")
    private String category; // Optional for update

    @Size(max = 100, message = "Key must be at most 100 characters")
    private String key; // Optional for update - use with caution

    private String value; // Optional for update

    private Boolean isEncrypted; // Optional for update

    @Size(max = 255, message = "Description must be at most 255 characters")
    private String description;

    // Factory method for better readability
    public static SystemSettingUpdateDto of(Integer settingId, String category, String key, String value, Boolean isEncrypted, String description) {
        return SystemSettingUpdateDto.builder()
                .settingId(settingId)
                .category(category)
                .key(key)
                .value(value)
                .isEncrypted(isEncrypted)
                .description(description)
                .build();
    }
}
