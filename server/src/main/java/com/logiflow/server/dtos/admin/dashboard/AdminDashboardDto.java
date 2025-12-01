package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * DTO for admin dashboard data.
 */
@Data
@Builder
@AllArgsConstructor
public class AdminDashboardDto {
    // User Statistics
    private final UserStatsDto userStats;
    
    // Fleet Overview
    private final FleetOverviewDto fleetOverview;
    
    // Recent Activities
    private final List<RecentActivityDto> recentActivities;

    // Static factory method for better readability
    public static AdminDashboardDto of(
            UserStatsDto userStats,
            List<RecentActivityDto> recentActivities,
            FleetOverviewDto fleetOverview) {
        return AdminDashboardDto.builder()
            .userStats(userStats)
            .recentActivities(recentActivities)
            .fleetOverview(fleetOverview)
            .build();
    }
}
