package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.DashboardOverviewDto;
import com.logiflow.server.services.admin.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

    private final DashboardService dashboardService;

    public AdminDashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard/overview")
    public ResponseEntity<DashboardOverviewDto> getDashboardOverview() {
        return ResponseEntity.ok(dashboardService.getDashboardOverview());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<String> getDashboard() {
        return ResponseEntity.ok("Admin dashboard - Global system overview");
    }

    @GetMapping("/users")
    public ResponseEntity<String> manageUsers() {
        return ResponseEntity.ok("Admin user management - Create, edit, deactivate accounts");
    }

    @GetMapping("/config")
    public ResponseEntity<String> systemConfig() {
        return ResponseEntity.ok("Admin system configuration - Settings, policies, integration");
    }

    @GetMapping("/reports")
    public ResponseEntity<String> systemReports() {
        return ResponseEntity.ok("Admin system reports - Performance, compliance, usage metrics");
    }

    @GetMapping("/logs")
    public ResponseEntity<String> activityLogs() {
        return ResponseEntity.ok("Admin activity logs - Login attempts, account actions");
    }
}