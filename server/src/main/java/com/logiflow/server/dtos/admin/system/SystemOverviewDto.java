package com.logiflow.server.dtos.admin.system;

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
public class SystemOverviewDto {
    // System Information
    private final String systemUptime;
    private final int activeAlerts;
    private final String systemVersion;
    private final SystemHealthDto systemHealth;
    
    // User Statistics
    private final UserStatsDto userStats;
    
    // Fleet Overview
    private final FleetOverviewDto fleetOverview;
    
    // Recent Activities
    private final List<RecentActivityDto> recentActivities;

    // Add a static factory method for better readability
    public static SystemOverviewDto of(
            String systemUptime,
            int activeAlerts,
            String systemVersion,
            UserStatsDto userStats,
            List<RecentActivityDto> recentActivities,
            SystemHealthDto systemHealth,
            FleetOverviewDto fleetOverview) {
        return SystemOverviewDto.builder()
            .systemUptime(systemUptime)
            .activeAlerts(activeAlerts)
            .systemVersion(systemVersion)
            .userStats(userStats)
            .recentActivities(recentActivities)
            .systemHealth(systemHealth)
            .fleetOverview(fleetOverview)
            .build();
    }
}