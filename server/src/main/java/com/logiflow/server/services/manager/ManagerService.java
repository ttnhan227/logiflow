package com.logiflow.server.services.manager;

import com.logiflow.server.dtos.manager.ManagerDtos;

import java.time.LocalDate;
import java.util.List;

public interface ManagerService {

    // API 1: Driver performance
    List<ManagerDtos.DriverPerformanceDto> getDriverPerformance(
            LocalDate startDate,
            LocalDate endDate
    );

    // API 2: Overall operations performance
    ManagerDtos.OperationsPerformanceDto getOperationsPerformance(
            LocalDate startDate,
            LocalDate endDate
    );

    // API 3: Fleet status
    ManagerDtos.FleetStatusDto getFleetStatus();

    // API 4: Deliveries report (summary by day)
    List<ManagerDtos.DeliveryReportItemDto> getDeliveriesReport(
            LocalDate startDate,
            LocalDate endDate
    );

    // API 5: Compliance / Issues Report
    List<ManagerDtos.IssueReportItemDto> getIssueReports(
            LocalDate startDate,
            LocalDate endDate
    );

    // API 6: Compliance check
    ManagerDtos.ComplianceCheckDto getComplianceCheck(
            LocalDate startDate,
            LocalDate endDate
    );

    // API 7: Route analytics / summary
    List<ManagerDtos.RouteSummaryItemDto> getRouteSummary(
            LocalDate startDate,
            LocalDate endDate
    );

    // API 8: Alerts
    List<ManagerDtos.AlertDto> getAlerts(
            LocalDate startDate,
            LocalDate endDate
    );

    // API 9: Manager activities / audit log
    List<ManagerDtos.ManagerActivityDto> getManagerActivities(
            LocalDate startDate,
            LocalDate endDate
    );

}
