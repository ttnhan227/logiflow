package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * DTO for system activity feed items
 */
@Data
@Builder
@AllArgsConstructor
public class SystemActivityDto {
    private final String activity;
    private final String timestamp; // e.g., "2 min ago"
    private final String type; // "user_login", "trip_assigned", "settings_updated", "delay_reported"

    // Static factory method
    public static SystemActivityDto of(String activity, String timestamp, String type) {
        return SystemActivityDto.builder()
            .activity(activity)
            .timestamp(timestamp)
            .type(type)
            .build();
    }
}
