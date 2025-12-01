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

    // Shipment Statistics
    private final ShipmentStatisticsDto shipmentStatistics;

    // Delivery Time Statistics
    private final List<DeliveryTimeStatsDto> deliveryTimeStats;

    // Static factory method for better readability
    public static AdminDashboardDto of(
            UserStatsDto userStats,
            List<RecentActivityDto> recentActivities,
            FleetOverviewDto fleetOverview,
            ShipmentStatisticsDto shipmentStatistics,
            List<DeliveryTimeStatsDto> deliveryTimeStats) {
        return AdminDashboardDto.builder()
            .userStats(userStats)
            .recentActivities(recentActivities)
            .fleetOverview(fleetOverview)
            .shipmentStatistics(shipmentStatistics)
            .deliveryTimeStats(deliveryTimeStats)
            .build();
    }
}
