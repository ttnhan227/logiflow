package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.reports.*;
import com.logiflow.server.services.admin.AdminReportsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller for admin reports and analytics endpoints
 */
@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportsController {

    private final AdminReportsService adminReportsService;

    public AdminReportsController(AdminReportsService adminReportsService) {
        this.adminReportsService = adminReportsService;
    }

    /**
     * Get performance report with historical analytics
     * @param startDate Start date for the report (format: yyyy-MM-dd)
     * @param endDate End date for the report (format: yyyy-MM-dd)
     */
    @GetMapping("/performance")
    public ResponseEntity<PerformanceReportDto> getPerformanceReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(adminReportsService.getPerformanceReport(startDate, endDate));
    }

    /**
     * Get cost analysis report
     * @param startDate Start date for the report
     * @param endDate End date for the report
     */
    @GetMapping("/cost-analysis")
    public ResponseEntity<CostAnalysisDto> getCostAnalysis(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(adminReportsService.getCostAnalysis(startDate, endDate));
    }

    /**
     * Get compliance monitoring report
     * @param startDate Start date for the report
     * @param endDate End date for the report
     */
    @GetMapping("/compliance")
    public ResponseEntity<ComplianceReportDto> getComplianceReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(adminReportsService.getComplianceReport(startDate, endDate));
    }

    /**
     * Get driver performance rankings
     * @param startDate Start date for the report
     * @param endDate End date for the report
     */
    @GetMapping("/driver-performance")
    public ResponseEntity<List<DriverPerformanceDto>> getDriverPerformance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(adminReportsService.getDriverPerformance(startDate, endDate));
    }
}
