package com.logiflow.server.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO for admin dashboard overview data.
 */
@Data
@AllArgsConstructor
public class DashboardOverviewDto {
    private int totalUsers;
    private int activeDispatchers;
    private int activeDrivers;
    private int activeManagers;
    private String systemUptime;
    private int activeAlerts;
    private String systemVersion;

} 