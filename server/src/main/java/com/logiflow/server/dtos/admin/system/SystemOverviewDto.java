package com.logiflow.server.dtos.admin.system;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * DTO for system overview data - focused on system health and configuration.
 */
@Data
@Builder
@AllArgsConstructor
public class SystemOverviewDto {
    // System Information
    private final String systemUptime;
    private final int activeAlerts;
    private final String systemVersion;
    private final SystemHealthDto systemHealth;

    // Static factory method for better readability
    public static SystemOverviewDto of(
            String systemUptime,
            int activeAlerts,
            String systemVersion,
            SystemHealthDto systemHealth) {
        return SystemOverviewDto.builder()
            .systemUptime(systemUptime)
            .activeAlerts(activeAlerts)
            .systemVersion(systemVersion)
            .systemHealth(systemHealth)
            .build();
    }
}