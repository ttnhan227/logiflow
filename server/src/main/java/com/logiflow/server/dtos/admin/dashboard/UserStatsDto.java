package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserStatsDto {
    // Overall stats
    private long totalUsers;
    private long newSignups;
    
    // Role-based stats
    private int activeDispatchers;
    private int activeDrivers;
    private int activeManagers;
}
