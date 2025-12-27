package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.system.SystemSettingDto;
import com.logiflow.server.dtos.admin.system.SystemSettingCreationDto;
import com.logiflow.server.dtos.admin.system.SystemSettingUpdateDto;
import com.logiflow.server.models.SystemSetting;
import com.logiflow.server.repositories.system.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SystemSettingsServiceImpl implements SystemSettingsService {

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private AuditLogService auditLogService;

    // TODO: Add encryption service when implementing encryption feature
    // @Autowired
    // private EncryptionService encryptionService;

    @Override
    @Transactional
    public SystemSettingDto createSetting(SystemSettingCreationDto creationDto) {
        // Validate uniqueness
        if (systemSettingRepository.existsByCategoryAndKey(creationDto.getCategory(), creationDto.getKey())) {
            throw new RuntimeException("Setting with category '" + creationDto.getCategory() +
                                     "' and key '" + creationDto.getKey() + "' already exists");
        }

        SystemSetting setting = new SystemSetting();
        setting.setCategory(creationDto.getCategory());
        setting.setKey(creationDto.getKey());
        setting.setValue(creationDto.getValue());
        setting.setIsEncrypted(creationDto.getIsEncrypted() != null ? creationDto.getIsEncrypted() : false);
        setting.setDescription(creationDto.getDescription());

        // TODO: Encrypt value if isEncrypted is true

        SystemSetting savedSetting = systemSettingRepository.save(setting);

        auditLogService.log(
            "CREATE_SETTING",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Created setting: [" + savedSetting.getCategory() + "] " + savedSetting.getKey() + " (ID: " + savedSetting.getSettingId() + ")"
        );
        return convertToDto(savedSetting);
    }

    @Override
    @Transactional
    public SystemSettingDto updateSetting(SystemSettingUpdateDto updateDto) {
        SystemSetting setting = systemSettingRepository.findById(updateDto.getSettingId())
            .orElseThrow(() -> new RuntimeException("Setting not found"));

        // Update fields if provided (allow partial updates)
        if (updateDto.getCategory() != null && !updateDto.getCategory().isEmpty()) {
            setting.setCategory(updateDto.getCategory());
        }
        if (updateDto.getKey() != null && !updateDto.getKey().isEmpty()) {
            setting.setKey(updateDto.getKey());
        }
        if (updateDto.getValue() != null) {
            setting.setValue(updateDto.getValue());
        }
        if (updateDto.getIsEncrypted() != null) {
            setting.setIsEncrypted(updateDto.getIsEncrypted());
        }
        if (updateDto.getDescription() != null) {
            setting.setDescription(updateDto.getDescription());
        }

        // TODO: Handle encryption/decryption based on isEncrypted change

        SystemSetting savedSetting = systemSettingRepository.save(setting);

        auditLogService.log(
            "UPDATE_SETTING",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Updated setting: [" + savedSetting.getCategory() + "] " + savedSetting.getKey() + " (ID: " + savedSetting.getSettingId() + ")"
        );
        return convertToDto(savedSetting);
    }

    @Override
    @Transactional
    public void deleteSetting(Integer settingId) {
        if (!systemSettingRepository.existsById(settingId)) {
            throw new RuntimeException("Setting not found");
        }
        systemSettingRepository.deleteById(settingId);
        auditLogService.log(
            "DELETE_SETTING",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Deleted setting with ID: " + settingId
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SystemSettingDto> getSettingById(Integer settingId) {
        return systemSettingRepository.findById(settingId)
            .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SystemSettingDto> getSettings(Pageable pageable) {
        Page<SystemSetting> settingsPage = systemSettingRepository.findAll(pageable);
        List<SystemSettingDto> dtos = settingsPage.getContent().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, settingsPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SystemSettingDto> searchSettings(String searchTerm, Pageable pageable) {
        List<SystemSetting> settings = systemSettingRepository.searchSettings(searchTerm);
        List<SystemSettingDto> dtos = settings.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());

        // Simple pagination for search results
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dtos.size());
        List<SystemSettingDto> pageContent = dtos.subList(start, end);

        return new PageImpl<>(pageContent, pageable, dtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SystemSettingDto> advancedSearch(String category, String key, String description, Boolean isEncrypted, Pageable pageable) {
        List<SystemSetting> settings = systemSettingRepository.advancedSearch(category, key, description, isEncrypted);
        List<SystemSettingDto> dtos = settings.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());

        // Simple pagination for search results
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dtos.size());
        List<SystemSettingDto> pageContent = dtos.subList(start, end);

        return new PageImpl<>(pageContent, pageable, dtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAvailableCategories() {
        return systemSettingRepository.findAllCategories();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> getSettingValue(String category, String key) {
        Optional<SystemSetting> setting = systemSettingRepository.findByCategoryAndKey(category, key);
        if (setting.isPresent()) {
            // TODO: Decrypt value if encrypted before returning
            return Optional.of(setting.get().getValue());
        }
        return Optional.empty();
    }

    public boolean settingExists(String category, String key) {
        return systemSettingRepository.existsByCategoryAndKey(category, key);
    }

    private SystemSettingDto convertToDto(SystemSetting setting) {
        // TODO: Decrypt value if encrypted before returning
        String displayValue = setting.getIsEncrypted() ? "***ENCRYPTED***" : setting.getValue();

        return SystemSettingDto.builder()
            .settingId(setting.getSettingId())
            .category(setting.getCategory())
            .key(setting.getKey())
            .value(displayValue)
            .isEncrypted(setting.getIsEncrypted())
            .description(setting.getDescription())
            .createdAt(setting.getCreatedAt())
            .updatedAt(setting.getUpdatedAt())
            .build();
    }
}
