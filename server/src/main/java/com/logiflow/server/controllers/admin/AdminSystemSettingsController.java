package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.system.SystemSettingDto;
import com.logiflow.server.dtos.admin.system.SystemOverviewDto;
import com.logiflow.server.services.admin.SystemOverviewService;
import com.logiflow.server.dtos.admin.system.SystemSettingCreationDto;
import com.logiflow.server.dtos.admin.system.SystemSettingUpdateDto;
import com.logiflow.server.services.admin.SystemSettingsService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/system-settings")
public class AdminSystemSettingsController {

    private final SystemSettingsService systemSettingsService;
    private final SystemOverviewService systemOverviewService;

    public AdminSystemSettingsController(SystemSettingsService systemSettingsService, SystemOverviewService systemOverviewService) {
        this.systemSettingsService = systemSettingsService;
        this.systemOverviewService = systemOverviewService;
    }

    @GetMapping("/overview")
    public ResponseEntity<SystemOverviewDto> getSystemOverview() {
        return ResponseEntity.ok(systemOverviewService.getSystemOverview());
    }

    @GetMapping
    public ResponseEntity<Page<SystemSettingDto>> getSettings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(systemSettingsService.getSettings(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SystemSettingDto> getSettingById(@PathVariable Integer id) {
        Optional<SystemSettingDto> setting = systemSettingsService.getSettingById(id);
        return setting.map(ResponseEntity::ok)
                      .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<Page<SystemSettingDto>> searchSettings(
            @RequestParam String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(systemSettingsService.searchSettings(term, pageable));
    }

    @GetMapping("/filters/categories")
    public ResponseEntity<List<String>> getAvailableCategories() {
        List<String> categories = systemSettingsService.getAvailableCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/filters/advanced")
    public ResponseEntity<Page<SystemSettingDto>> advancedSearch(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String key,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Boolean isEncrypted,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(systemSettingsService.advancedSearch(category, key, description, isEncrypted, pageable));
    }

    @PostMapping
    public ResponseEntity<SystemSettingDto> createSetting(@Valid @RequestBody SystemSettingCreationDto creationDto) {
        try {
            SystemSettingDto createdSetting = systemSettingsService.createSetting(creationDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdSetting);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping
    public ResponseEntity<SystemSettingDto> updateSetting(@Valid @RequestBody SystemSettingUpdateDto updateDto) {
        try {
            SystemSettingDto updatedSetting = systemSettingsService.updateSetting(updateDto);
            return ResponseEntity.ok(updatedSetting);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSetting(@PathVariable Integer id) {
        try {
            systemSettingsService.deleteSetting(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
