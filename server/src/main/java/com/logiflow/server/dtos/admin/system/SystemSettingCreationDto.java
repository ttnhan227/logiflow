package com.logiflow.server.dtos.admin.system;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for creating new system settings in admin system management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingCreationDto {

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must be at most 50 characters")
    private String category;

    @NotBlank(message = "Key is required")
    @Size(max = 100, message = "Key must be at most 100 characters")
    private String key;

    @NotNull(message = "Value is required")
    private String value;

    @NotNull(message = "Encryption flag is required")
    private Boolean isEncrypted = false;

    @Size(max = 255, message = "Description must be at most 255 characters")
    private String description;

    // Factory method for better readability
    public static SystemSettingCreationDto of(String category, String key, String value, boolean isEncrypted, String description) {
        return SystemSettingCreationDto.builder()
                .category(category)
                .key(key)
                .value(value)
                .isEncrypted(isEncrypted)
                .description(description)
                .build();
    }
}
