package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * DTO for system health and activity feed
 */
@Data
@Builder
@AllArgsConstructor
public class SystemHealthDto {
    // Recent system activities
    private final List<SystemActivityDto> recentActivities;

    // Notification summary
    private final Integer criticalAlerts;
    private final Integer delayReports;
    private final Integer complianceWarnings;

    // Static factory method
    public static SystemHealthDto of(
            List<SystemActivityDto> recentActivities,
            Integer criticalAlerts,
            Integer delayReports,
            Integer complianceWarnings) {
        return SystemHealthDto.builder()
            .recentActivities(recentActivities)
            .criticalAlerts(criticalAlerts)
            .delayReports(delayReports)
            .complianceWarnings(complianceWarnings)
            .build();
    }
}
