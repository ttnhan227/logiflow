package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.dashboard.ManagerOverviewDto;
import com.logiflow.server.services.manager.dashboard.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Qualifier;
@RestController
@RequestMapping("/api/manager/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(@Qualifier("managerDashboardService") DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    // 1) Tổng quan hoạt động + thông báo quan trọng
    @GetMapping("/overview")
    public ResponseEntity<ManagerOverviewDto> overview() {
        return ResponseEntity.ok(dashboardService.getOverview());
    }
}
