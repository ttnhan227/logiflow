package com.logiflow.server.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "system_settings", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"category", "key"})
})
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "setting_id")
    private Integer settingId;

    @Column(name = "category", length = 50, nullable = false)
    private String category; // e.g., "integration", "security", "notifications"

    @Column(name = "key", length = 100, nullable = false)
    private String key; // e.g., "google_maps_api_key"

    @Column(name = "value", columnDefinition = "TEXT")
    private String value; // Store settings value

    @Column(name = "is_encrypted", nullable = false)
    private Boolean isEncrypted = false;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
