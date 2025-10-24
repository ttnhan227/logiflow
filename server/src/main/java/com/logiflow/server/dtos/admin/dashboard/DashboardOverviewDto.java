package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * DTO for admin dashboard overview data.
 */
@Data
@Builder
@AllArgsConstructor
public class DashboardOverviewDto {
    // System Information
    private final String systemUptime;
    private final int activeAlerts;
    private final String systemVersion;
    private final SystemHealthDto systemHealth;
    
    // User Statistics
    private final UserStatsDto userStats;
    
    // Recent Activities
    private final List<RecentActivityDto> recentActivities;

    // Add a static factory method for better readability
    public static DashboardOverviewDto of(
            String systemUptime,
            int activeAlerts,
            String systemVersion,
            UserStatsDto userStats,
            List<RecentActivityDto> recentActivities,
            SystemHealthDto systemHealth) {
        
        return DashboardOverviewDto.builder()
            .systemUptime(systemUptime)
            .activeAlerts(activeAlerts)
            .systemVersion(systemVersion)
            .userStats(userStats)
            .recentActivities(recentActivities)
            .systemHealth(systemHealth)
            .build();
    }
}