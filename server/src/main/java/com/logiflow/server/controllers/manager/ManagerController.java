package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.ManagerDtos;
import com.logiflow.server.services.manager.ManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final ManagerService managerService;

    // API 1: Driver performance
//    @GetMapping("/operations/drivers/performance")
//    public List<ManagerDtos.DriverPerformanceDto> getDriverPerformance(
//            @RequestParam(required = false)
//            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
//            LocalDate startDate,
//
//            @RequestParam(required = false)
//            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
//            LocalDate endDate
//    ) {
//        return managerService.getDriverPerformance(startDate, endDate);
//    }

    // API 2: Overall operations performance
    @GetMapping("/operations/performance")
    public ManagerDtos.OperationsPerformanceDto getOperationsPerformance(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return managerService.getOperationsPerformance(startDate, endDate);
    }

    // API 3: Fleet status
    @GetMapping("/fleet/status")
    public ManagerDtos.FleetStatusDto getFleetStatus() {
        return managerService.getFleetStatus();
    }

    // API 4: Delivery report
    @GetMapping("/reports/deliveries")
    public List<ManagerDtos.DeliveryReportItemDto> getDeliveriesReport(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return managerService.getDeliveriesReport(startDate, endDate);
    }

    // API 5: Issue reports
    @GetMapping("/reports/issues")
    public List<ManagerDtos.IssueReportItemDto> getIssueReports(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return managerService.getIssueReports(startDate, endDate);
    }

    // API 6: Compliance check
    @GetMapping("/compliance/check")
    public ManagerDtos.ComplianceCheckDto getComplianceCheck(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return managerService.getComplianceCheck(startDate, endDate);
    }

    // API 7: Route analytics / summary
    @GetMapping("/analytics/route-summary")
    public List<ManagerDtos.RouteSummaryItemDto> getRouteSummary(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return managerService.getRouteSummary(startDate, endDate);
    }

    // API 8: Alerts
    @GetMapping("/alerts")
    public List<ManagerDtos.AlertDto> getAlerts(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return managerService.getAlerts(startDate, endDate);
    }

    // API 9: Manager activities / audit log
    @GetMapping("/audit/activities")
    public List<ManagerDtos.ManagerActivityDto> getManagerActivities(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return managerService.getManagerActivities(startDate, endDate);
    }


}
