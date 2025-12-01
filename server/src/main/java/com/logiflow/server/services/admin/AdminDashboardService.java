package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.dashboard.AdminDashboardDto;
import com.logiflow.server.dtos.admin.dashboard.ActiveDriverLocationDto;
import java.util.List;

public interface AdminDashboardService {
    AdminDashboardDto getDashboardData();
    List<ActiveDriverLocationDto> getActiveDriverLocations();
}
