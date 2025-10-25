package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.dashboard.DashboardOverviewDto;
import com.logiflow.server.services.admin.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final DashboardService dashboardService;

    public AdminDashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewDto> getDashboardOverview() {
        return ResponseEntity.ok(dashboardService.getDashboardOverview());
    }
}
