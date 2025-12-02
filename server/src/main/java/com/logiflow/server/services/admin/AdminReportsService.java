package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.reports.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for generating admin reports and analytics
 */
public interface AdminReportsService {
    
    /**
     * Get performance report with historical analytics
     */
    PerformanceReportDto getPerformanceReport(LocalDate startDate, LocalDate endDate);
    
    /**
     * Get cost analysis report
     */
    CostAnalysisDto getCostAnalysis(LocalDate startDate, LocalDate endDate);
    
    /**
     * Get compliance monitoring report
     */
    ComplianceReportDto getComplianceReport(LocalDate startDate, LocalDate endDate);
    
    /**
     * Get driver performance rankings
     */
    List<DriverPerformanceDto> getDriverPerformance(LocalDate startDate, LocalDate endDate);
}
