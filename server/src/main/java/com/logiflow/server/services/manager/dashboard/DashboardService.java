package com.logiflow.server.services.manager.dashboard;

import com.logiflow.server.dtos.manager.dashboard.ManagerOverviewDto;

public interface DashboardService {
    ManagerOverviewDto getOverview();
}
