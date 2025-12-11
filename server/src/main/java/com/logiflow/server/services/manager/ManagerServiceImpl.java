package com.logiflow.server.services.manager;

import com.logiflow.server.dtos.manager.ManagerDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ManagerServiceImpl implements ManagerService {

    // API 1: DRIVER PERFORMANCE
    @Override
    public List<ManagerDtos.DriverPerformanceDto> getDriverPerformance(LocalDate startDate,
                                                                       LocalDate endDate) {
        // Hiện tại chưa lọc theo ngày, dùng data mẫu.
        return buildFakeDriverPerformance();
    }

    // API 2: OPERATIONS PERFORMANCE
    @Override
    public ManagerDtos.OperationsPerformanceDto getOperationsPerformance(LocalDate startDate,
                                                                         LocalDate endDate) {

        List<ManagerDtos.DriverPerformanceDto> drivers = buildFakeDriverPerformance();

        int totalTrips = drivers.stream()
                .mapToInt(d -> safeInt(d.getTotalTrips()))
                .sum();

        int completedTrips = drivers.stream()
                .mapToInt(d -> safeInt(d.getCompletedTrips()))
                .sum();

        int cancelledTrips = drivers.stream()
                .mapToInt(d -> safeInt(d.getCancelledTrips()))
                .sum();

        int delayedTrips = drivers.stream()
                .mapToInt(d -> safeInt(d.getDelayedTrips()))
                .sum();

        double totalDelayMinutes = drivers.stream()
                .mapToDouble(d -> {
                    Integer cnt = d.getDelayedTrips();
                    Double avgDelay = d.getAverageDelayMinutes();
                    if (cnt == null || avgDelay == null) {
                        return 0.0;
                    }
                    return cnt * avgDelay;
                })
                .sum();

        double totalDistanceKm = drivers.stream()
                .mapToDouble(d -> d.getTotalDistanceKm() != null ? d.getTotalDistanceKm() : 0.0)
                .sum();

        double onTimeRatePercent =
                totalTrips == 0 ? 0.0 : (completedTrips * 100.0) / totalTrips;

        double averageDelayMinutes =
                delayedTrips == 0 ? 0.0 : totalDelayMinutes / delayedTrips;

        double averageDistancePerTripKm =
                totalTrips == 0 ? 0.0 : totalDistanceKm / totalTrips;

        return ManagerDtos.OperationsPerformanceDto.builder()
                .totalTrips(totalTrips)
                .completedTrips(completedTrips)
                .cancelledTrips(cancelledTrips)
                .delayedTrips(delayedTrips)
                .onTimeRatePercent(onTimeRatePercent)
                .averageDelayMinutes(averageDelayMinutes)
                .totalDistanceKm(totalDistanceKm)
                .averageDistancePerTripKm(averageDistancePerTripKm)
                .build();
    }

    // API 3: FLEET STATUS

    @Override
    public ManagerDtos.FleetStatusDto getFleetStatus() {
        // Data mẫu – sau này thay bằng query DB
        return ManagerDtos.FleetStatusDto.builder()
                .totalVehicles(20)
                .activeVehicles(12)
                .idleVehicles(5)
                .inMaintenanceVehicles(2)
                .unavailableVehicles(1)
                .averageUtilizationPercent(68.5)
                .build();
    }

    // HELPER: fake data dùng chung

    private List<ManagerDtos.DriverPerformanceDto> buildFakeDriverPerformance() {
        List<ManagerDtos.DriverPerformanceDto> list = new ArrayList<>();

        list.add(ManagerDtos.DriverPerformanceDto.builder()
                .driverId("D001")
                .driverName("John Doe")
                .totalTrips(10)
                .completedTrips(8)
                .cancelledTrips(2)
                .delayedTrips(1)
                .onTimeRatePercent(80.0)
                .averageDelayMinutes(5.0)
                .totalDistanceKm(1200.0)
                .build()
        );

        list.add(ManagerDtos.DriverPerformanceDto.builder()
                .driverId("D002")
                .driverName("Jane Smith")
                .totalTrips(12)
                .completedTrips(12)
                .cancelledTrips(0)
                .delayedTrips(0)
                .onTimeRatePercent(100.0)
                .averageDelayMinutes(0.0)
                .totalDistanceKm(1500.0)
                .build()
        );

        return list;
    }

    // API 4: DELIVERY REPORT
    @Override
    public List<ManagerDtos.DeliveryReportItemDto> getDeliveriesReport(LocalDate startDate,
                                                                       LocalDate endDate) {
        // Hiện tại chưa lọc theo ngày, dùng data mẫu.
        // Sau này khi có repo + data thật thì sẽ query theo startDate/endDate.

        List<ManagerDtos.DeliveryReportItemDto> report = new ArrayList<>();

        report.add(ManagerDtos.DeliveryReportItemDto.builder()
                .date("2025-12-09")
                .totalTrips(7)
                .completedTrips(6)
                .cancelledTrips(1)
                .delayedTrips(1)
                .onTimeRatePercent(85.0)
                .averageDelayMinutes(4.0)
                .totalDistanceKm(900.0)
                .build());

        report.add(ManagerDtos.DeliveryReportItemDto.builder()
                .date("2025-12-10")
                .totalTrips(8)
                .completedTrips(8)
                .cancelledTrips(0)
                .delayedTrips(0)
                .onTimeRatePercent(100.0)
                .averageDelayMinutes(0.0)
                .totalDistanceKm(1000.0)
                .build());

        report.add(ManagerDtos.DeliveryReportItemDto.builder()
                .date("2025-12-11")
                .totalTrips(7)
                .completedTrips(6)
                .cancelledTrips(1)
                .delayedTrips(0)
                .onTimeRatePercent(85.7)
                .averageDelayMinutes(3.0)
                .totalDistanceKm(800.0)
                .build());

        return report;
    }

    // API 5: Compliance / Issue Reports
    @Override
    public List<ManagerDtos.IssueReportItemDto> getIssueReports(LocalDate startDate,
                                                                LocalDate endDate) {

        List<ManagerDtos.IssueReportItemDto> list = new ArrayList<>();

        list.add(ManagerDtos.IssueReportItemDto.builder()
                .tripId("T001")
                .driverId("D001")
                .driverName("John Doe")
                .vehicleId("V01")
                .date("2025-12-09")
                .issueType("Delayed")
                .description("Arrived 15 minutes late due to traffic.")
                .delayMinutes(15.0)
                .build());

        list.add(ManagerDtos.IssueReportItemDto.builder()
                .tripId("T004")
                .driverId("D002")
                .driverName("Jane Smith")
                .vehicleId("V03")
                .date("2025-12-10")
                .issueType("Cancelled")
                .description("Customer cancelled order.")
                .delayMinutes(0.0)
                .build());

        list.add(ManagerDtos.IssueReportItemDto.builder()
                .tripId("T009")
                .driverId("D003")
                .driverName("Adam Lee")
                .vehicleId("V02")
                .date("2025-12-11")
                .issueType("VehicleFailure")
                .description("Engine overheating, required towing.")
                .delayMinutes(null)
                .build());

        return list;
    }

    // API 6: COMPLIANCE CHECK
    @Override
    public ManagerDtos.ComplianceCheckDto getComplianceCheck(LocalDate startDate,
                                                             LocalDate endDate) {
        // Hiện tại mock data, sau này sẽ tính từ trip + issue thực tế
        // Có thể chỉnh lại cho khớp số liệu OperationsPerformance nếu muốn

        return ManagerDtos.ComplianceCheckDto.builder()
                .totalTripsChecked(22)
                .compliantTrips(18)
                .tripsWithViolations(4)

                .totalViolations(6)
                .speedingViolations(2)
                .routeDeviationViolations(2)
                .lateDeliveryViolations(2)

                .driversWithViolations(3)
                .complianceRatePercent(81.8)   // 18 / 22 * 100 (xấp xỉ)
                .build();
    }

    // ===================== API 7: ROUTE ANALYTICS / SUMMARY =====================

    @Override
    public List<ManagerDtos.RouteSummaryItemDto> getRouteSummary(LocalDate startDate,
                                                                 LocalDate endDate) {
        List<ManagerDtos.RouteSummaryItemDto> list = new ArrayList<>();

        list.add(ManagerDtos.RouteSummaryItemDto.builder()
                .routeId("R001")
                .origin("Warehouse A")
                .destination("City Center")
                .totalTrips(12)
                .totalDistanceKm(850.0)
                .averageDistanceKm(70.8)
                .averageDurationMinutes(55.0)
                .onTimeRatePercent(92.0)
                .optimizationSuggestion("Giữ tuyến, hiệu suất tốt.")
                .build());

        list.add(ManagerDtos.RouteSummaryItemDto.builder()
                .routeId("R002")
                .origin("Warehouse A")
                .destination("Industrial Park")
                .totalTrips(8)
                .totalDistanceKm(600.0)
                .averageDistanceKm(75.0)
                .averageDurationMinutes(65.0)
                .onTimeRatePercent(80.0)
                .optimizationSuggestion("Xem lại giờ xuất phát, hay trễ giờ cao điểm.")
                .build());

        list.add(ManagerDtos.RouteSummaryItemDto.builder()
                .routeId("R003")
                .origin("Warehouse B")
                .destination("Port")
                .totalTrips(5)
                .totalDistanceKm(500.0)
                .averageDistanceKm(100.0)
                .averageDurationMinutes(90.0)
                .onTimeRatePercent(70.0)
                .optimizationSuggestion("Cần tối ưu: chia nhỏ chuyến hoặc điều chỉnh lộ trình.")
                .build());

        return list;
    }

    // API 8: ALERTS

    @Override
    public List<ManagerDtos.AlertDto> getAlerts(LocalDate startDate,
                                                LocalDate endDate) {
        List<ManagerDtos.AlertDto> alerts = new ArrayList<>();

        alerts.add(ManagerDtos.AlertDto.builder()
                .alertId("A001")
                .type("VEHICLE_MAINTENANCE")
                .severity("HIGH")
                .title("Vehicle V01 due for maintenance")
                .message("Vehicle V01 has reached 9,500 km since last service. Schedule maintenance soon.")
                .relatedDriverId("D001")
                .relatedDriverName("John Doe")
                .relatedVehicleId("V01")
                .createdAt("2025-12-09T09:30:00")
                .acknowledged(Boolean.FALSE)
                .build());

        alerts.add(ManagerDtos.AlertDto.builder()
                .alertId("A002")
                .type("DRIVER_BEHAVIOR")
                .severity("MEDIUM")
                .title("Driver Jane Smith has 2 recent violations")
                .message("2 late deliveries in the last 7 days. Consider coaching session.")
                .relatedDriverId("D002")
                .relatedDriverName("Jane Smith")
                .relatedVehicleId("V02")
                .createdAt("2025-12-10T14:15:00")
                .acknowledged(Boolean.FALSE)
                .build());

        alerts.add(ManagerDtos.AlertDto.builder()
                .alertId("A003")
                .type("DELAY_RISK")
                .severity("CRITICAL")
                .title("Trips on route R003 have high delay risk")
                .message("On-time rate below 75% for the last week. Review route planning and departure times.")
                .relatedDriverId(null)
                .relatedDriverName(null)
                .relatedVehicleId(null)
                .createdAt("2025-12-11T08:00:00")
                .acknowledged(Boolean.TRUE)
                .build());

        return alerts;
    }

    // ===================== API 9: MANAGER ACTIVITIES / AUDIT =====================

    @Override
    public List<ManagerDtos.ManagerActivityDto> getManagerActivities(LocalDate startDate,
                                                                     LocalDate endDate) {
        List<ManagerDtos.ManagerActivityDto> list = new ArrayList<>();

        list.add(ManagerDtos.ManagerActivityDto.builder()
                .activityId("M001")
                .username("sarah.manager")
                .action("VIEW_DRIVER_PERFORMANCE")
                .description("Viewed driver performance report for D001 and D002.")
                .entityType("DRIVER")
                .entityId("D001,D002")
                .timestamp("2025-12-09T09:15:00")
                .ipAddress("192.168.1.10")
                .build());

        list.add(ManagerDtos.ManagerActivityDto.builder()
                .activityId("M002")
                .username("sarah.manager")
                .action("VIEW_FLEET_STATUS")
                .description("Checked fleet status overview.")
                .entityType("FLEET")
                .entityId(null)
                .timestamp("2025-12-10T10:30:00")
                .ipAddress("192.168.1.10")
                .build());

        list.add(ManagerDtos.ManagerActivityDto.builder()
                .activityId("M003")
                .username("sarah.manager")
                .action("VIEW_ALERTS")
                .description("Reviewed system alerts for vehicles and drivers.")
                .entityType("ALERT")
                .entityId(null)
                .timestamp("2025-12-11T08:45:00")
                .ipAddress("192.168.1.10")
                .build());

        return list;
    }


    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }
}
