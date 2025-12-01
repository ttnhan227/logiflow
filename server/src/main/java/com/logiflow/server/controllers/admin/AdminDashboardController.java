package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.dashboard.AdminDashboardDto;
import com.logiflow.server.services.admin.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping
    public ResponseEntity<AdminDashboardDto> getDashboardData() {
        return ResponseEntity.ok(adminDashboardService.getDashboardData());
    }
}
