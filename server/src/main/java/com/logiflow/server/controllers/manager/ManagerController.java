package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.ManagerDtos.*;
import com.logiflow.server.services.manager.ManagerService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    private final ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    // DASHBOARD
    // GET /api/manager/dashboard/overview
    @GetMapping("/dashboard/overview")
    public ResponseEntity<ManagerOverviewDto> getDashboardOverview(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return ResponseEntity.ok(managerService.getDashboardOverview(startDate, endDate));
    }

    // OPERATIONS
    // GET /api/manager/operations/performance
    @GetMapping("/operations/performance")
    public ResponseEntity<PerformanceSummaryDto> getOperationsPerformance(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return ResponseEntity.ok(managerService.getOperationsPerformance(startDate, endDate));
    }

    // GET /api/manager/operations/drivers/performance
    @GetMapping("/operations/drivers/performance")
    public ResponseEntity<List<DriverPerformanceDto>> getDriverPerformance(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return ResponseEntity.ok(managerService.getDriverPerformance(startDate, endDate));
    }

    // GET /api/manager/operations/fleet/status
    @GetMapping("/operations/fleet/status")
    public ResponseEntity<FleetStatusDto> getFleetStatus() {
        return ResponseEntity.ok(managerService.getFleetStatus());
    }

    // COMPLIANCE
    // GET /api/manager/compliance/check
    @GetMapping("/compliance/check")
    public ResponseEntity<ComplianceCheckResultDto> checkCompliance() {
        return ResponseEntity.ok(managerService.checkCompliance());
    }

    // ANALYTICS
    // GET /api/manager/analytics/route-summary
    @GetMapping("/analytics/route-summary")
    public ResponseEntity<RouteSummaryOverviewDto> getRouteSummary(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return ResponseEntity.ok(managerService.getRouteSummary(startDate, endDate));
    }

    // ALERTS
    // GET /api/manager/alerts
    @GetMapping("/alerts")
    public ResponseEntity<List<AlertDto>> getAlerts() {
        return ResponseEntity.ok(managerService.getAlerts());
    }

    // AUDIT
    // GET /api/manager/audit/activities
    @GetMapping("/audit/activities")
    public ResponseEntity<List<ManagerActivityLogDto>> getActivities() {
        return ResponseEntity.ok(managerService.getManagerActivities());
    }

    // REPORTS
    // GET /api/manager/reports/deliveries?format=csv|pdf|json
    @GetMapping("/reports/deliveries")
    public ResponseEntity<DeliveryReportDto> getDeliveriesReport(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            @RequestParam(defaultValue = "json") String format
    ) {
        // hiện tại chỉ trả JSON, format để sẵn để sau này mở rộng
        return ResponseEntity.ok(managerService.getDeliveriesReport(startDate, endDate));
    }
}
