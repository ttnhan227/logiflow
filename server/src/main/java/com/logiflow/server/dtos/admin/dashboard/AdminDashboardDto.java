package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * DTO for comprehensive admin dashboard data.
 */
@Data
@Builder
@AllArgsConstructor
public class AdminDashboardDto {
    // Core Statistics
    private final UserStatsDto userStats;
    private final List<RecentActivityDto> recentActivities;

    // Enhanced Dashboard Sections
    private final OperationsOverviewDto operationsOverview;
    private final FleetLifecycleDto fleetLifecycle;
    private final ComplianceStatusDto complianceStatus;
    private final FinancialPerformanceDto financialPerformance;
    private final ActiveOperationsDto activeOperations;
    private final SystemHealthDto systemHealth;

    // Static factory method for better readability
    public static AdminDashboardDto of(
            UserStatsDto userStats,
            List<RecentActivityDto> recentActivities,
            OperationsOverviewDto operationsOverview,
            FleetLifecycleDto fleetLifecycle,
            ComplianceStatusDto complianceStatus,
            FinancialPerformanceDto financialPerformance,
            ActiveOperationsDto activeOperations,
            SystemHealthDto systemHealth) {
        return AdminDashboardDto.builder()
            .userStats(userStats)
            .recentActivities(recentActivities)
            .operationsOverview(operationsOverview)
            .fleetLifecycle(fleetLifecycle)
            .complianceStatus(complianceStatus)
            .financialPerformance(financialPerformance)
            .activeOperations(activeOperations)
            .systemHealth(systemHealth)
            .build();
    }
}
