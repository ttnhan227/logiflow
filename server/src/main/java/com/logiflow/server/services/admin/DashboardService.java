package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.dashboard.DashboardOverviewDto;

public interface DashboardService {
    DashboardOverviewDto getDashboardOverview();
}
