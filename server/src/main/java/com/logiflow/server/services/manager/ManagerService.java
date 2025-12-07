package com.logiflow.server.services.manager;

import com.logiflow.server.dtos.manager.ManagerDtos.*;

import java.time.LocalDate;
import java.util.List;

public interface ManagerService {

    // DASHBOARD
    ManagerOverviewDto getDashboardOverview(LocalDate startDate, LocalDate endDate);

    // OPERATIONS
    PerformanceSummaryDto getOperationsPerformance(LocalDate startDate, LocalDate endDate);
    List<DriverPerformanceDto> getDriverPerformance(LocalDate startDate, LocalDate endDate);
    FleetStatusDto getFleetStatus();

    // COMPLIANCE
    ComplianceCheckResultDto checkCompliance();

    // ANALYTICS
    RouteSummaryOverviewDto getRouteSummary(LocalDate startDate, LocalDate endDate);

    // ALERTS
    List<AlertDto> getAlerts();

    // AUDIT
    List<ManagerActivityLogDto> getManagerActivities();

    // REPORTS
    DeliveryReportDto getDeliveriesReport(LocalDate startDate, LocalDate endDate);
}
