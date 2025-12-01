package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.dashboard.AdminDashboardDto;
import com.logiflow.server.dtos.admin.dashboard.ActiveDriverLocationDto;
import com.logiflow.server.services.admin.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/active-drivers")
    public ResponseEntity<List<ActiveDriverLocationDto>> getActiveDriverLocations() {
        return ResponseEntity.ok(adminDashboardService.getActiveDriverLocations());
    }
}
