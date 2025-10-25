package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.system.SystemSettingDto;
import com.logiflow.server.dtos.admin.system.SystemSettingCreationDto;
import com.logiflow.server.dtos.admin.system.SystemSettingUpdateDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface SystemSettingsService {

    // Create setting
    SystemSettingDto createSetting(SystemSettingCreationDto creationDto);

    // Update setting
    SystemSettingDto updateSetting(SystemSettingUpdateDto updateDto);

    // Delete setting
    void deleteSetting(Integer settingId);

    // Get setting by ID
    Optional<SystemSettingDto> getSettingById(Integer settingId);

    // Get all settings with pagination
    Page<SystemSettingDto> getSettings(Pageable pageable);

    // Search settings by term
    Page<SystemSettingDto> searchSettings(String searchTerm, Pageable pageable);

    // Check if setting exists by category and key
    boolean settingExists(String category, String key);
}
