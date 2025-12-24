package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.reports.*;
import com.logiflow.server.services.admin.AdminReportsService;
import com.logiflow.server.services.admin.AdminReportPdfService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    private final AdminReportPdfService adminReportPdfService;

    public AdminReportsController(AdminReportsService adminReportsService,
                                 AdminReportPdfService adminReportPdfService) {
        this.adminReportsService = adminReportsService;
        this.adminReportPdfService = adminReportPdfService;
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

    /**
     * Download comprehensive business intelligence report as PDF
     * @param startDate Start date for the report
     * @param endDate End date for the report
     */
    @GetMapping("/comprehensive/pdf")
    public ResponseEntity<byte[]> downloadComprehensiveReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        byte[] pdf = adminReportPdfService.generateComprehensiveReport(startDate, endDate);
        String filename = "logiflow_business_intelligence_report_" + startDate + "_to_" + endDate + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
