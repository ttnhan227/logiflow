package com.logiflow.server.services.manager;

import com.logiflow.server.dtos.manager.ManagerDtos;
import com.logiflow.server.models.AuditLog;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Route;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.TripAssignment;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.audit.AuditLogRepository;
import com.logiflow.server.repositories.trip.DailyDeliveryStats;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ManagerServiceImpl implements ManagerService {

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final AuditLogRepository auditLogRepository;
    // API 1: DRIVER PERFORMANCE
    @Override
    @Transactional(readOnly = true)
    public List<ManagerDtos.DriverPerformanceDto> getDriverPerformance(LocalDate startDate,
                                                                       LocalDate endDate) {
        // Quy đổi LocalDate -> LocalDateTime để so sánh với scheduledDeparture
        var from = (startDate != null) ? startDate.atStartOfDay() : null;
        // dùng < to (ngày +1)
        var to = (endDate != null) ? endDate.plusDays(1).atStartOfDay() : null;

        // 1) Lấy trips từ repository, đã lọc theo ngày ngay từ DB
        List<Trip> trips;
        if (from != null && to != null) {
            trips = tripRepository.findByScheduledDepartureBetween(from, to);
        } else if (from != null) {
            trips = tripRepository.findByScheduledDepartureGreaterThanEqual(from);
        } else if (to != null) {
            trips = tripRepository.findByScheduledDepartureLessThan(to);
        } else {
            trips = tripRepository.findAll();
        }

        // 2) Gom số liệu theo driverId (làm ở service)
        java.util.Map<Integer, DriverAgg> map = new java.util.LinkedHashMap<>();

        for (Trip trip : trips) {
            boolean completed = "completed".equalsIgnoreCase(trip.getStatus());

            double distanceKm = 0.0;
            Route route = trip.getRoute();
            if (route != null && route.getDistanceKm() != null) {
                distanceKm = route.getDistanceKm().doubleValue();
            }

            if (trip.getTripAssignments() == null) {
                continue;
            }

            for (TripAssignment ta : trip.getTripAssignments()) {
                Driver driver = ta.getDriver();
                if (driver == null || driver.getDriverId() == null) {
                    continue;
                }

                Integer driverKey = driver.getDriverId();

                DriverAgg agg = map.computeIfAbsent(driverKey, id -> {
                    DriverAgg a = new DriverAgg();
                    a.driverId = "DRV-" + id;               // hiển thị đẹp
                    a.driverName = driver.getFullName();
                    return a;
                });

                // tổng chuyến
                agg.totalTrips = agg.totalTrips + 1;

                // chuyến hoàn thành
                if (completed) {
                    agg.completedTrips = agg.completedTrips + 1;
                }

                // chuyến bị “cancel” theo TripAssignment.status (ví dụ DECLINED)
                String st = ta.getStatus();
                if (st != null && st.equalsIgnoreCase("declined")) {
                    agg.cancelledTrips = agg.cancelledTrips + 1;
                }

                // delayedTrips + averageDelayMinutes chưa có logic chuẩn,
                // tạm để 0, nếu có cột delayMinutes sẽ cộng thêm ở đây.

                agg.totalDistanceKm = agg.totalDistanceKm + distanceKm;
            }
        }

        // 3) Chuyển sang DTO trả ra API
        java.util.List<ManagerDtos.DriverPerformanceDto> result = new java.util.ArrayList<>();

        for (DriverAgg a : map.values()) {
            int total = a.totalTrips;
            double onTimeRate = total == 0 ? 0.0 : (a.completedTrips * 100.0) / total;

            result.add(
                    ManagerDtos.DriverPerformanceDto.builder()
                            .driverId(a.driverId)
                            .driverName(a.driverName)
                            .totalTrips(a.totalTrips)
                            .completedTrips(a.completedTrips)
                            .cancelledTrips(a.cancelledTrips)
                            .delayedTrips(a.delayedTrips)          // hiện đang = 0
                            .onTimeRatePercent(onTimeRate)
                            .averageDelayMinutes(0.0)              // chưa tính chi tiết
                            .totalDistanceKm(a.totalDistanceKm)
                            .build()
            );
        }

        return result;
    }

    // Struct gom số liệu tạm trong service,
    private static class DriverAgg {
        String driverId;
        String driverName;
        int totalTrips;
        int completedTrips;
        int cancelledTrips;
        int delayedTrips;
        double totalDistanceKm;
    }

    // API 2: OPERATIONS PERFORMANCE
    @Override
    @Transactional(readOnly = true)
    public ManagerDtos.OperationsPerformanceDto getOperationsPerformance(LocalDate startDate,
                                                                         LocalDate endDate) {
        // 1) Chuyển LocalDate -> LocalDateTime
        var from = (startDate != null) ? startDate.atStartOfDay() : null;
        var to = (endDate != null) ? endDate.plusDays(1).atStartOfDay() : null;

        // 2) Lấy trips từ DB qua TripRepository (đã lọc theo ngày)
        java.util.List<Trip> trips;
        if (from != null && to != null) {
            trips = tripRepository.findByScheduledDepartureBetween(from, to);
        } else if (from != null) {
            trips = tripRepository.findByScheduledDepartureGreaterThanEqual(from);
        } else if (to != null) {
            trips = tripRepository.findByScheduledDepartureLessThan(to);
        } else {
            trips = tripRepository.findAll();
        }

        // 3) Tính toán tổng quan
        int totalTrips = trips.size();
        int completedTrips = 0;
        int cancelledTrips = 0;
        int delayedTrips = 0;

        double totalDistanceKm = 0.0;
        double totalDelayMinutes = 0.0;   // hiện tại chưa có field delayMinutes, nên sẽ vẫn = 0

        for (Trip trip : trips) {
            String status = trip.getStatus();

            if (status != null) {
                if (status.equalsIgnoreCase("completed")) {
                    completedTrips = completedTrips + 1;
                } else if (status.equalsIgnoreCase("cancelled")) {
                    cancelledTrips = cancelledTrips + 1;
                } else if (status.equalsIgnoreCase("delayed")) {
                    delayedTrips = delayedTrips + 1;
                }
            }

            Route route = trip.getRoute();
            if (route != null && route.getDistanceKm() != null) {
                totalDistanceKm = totalDistanceKm + route.getDistanceKm().doubleValue();
            }

            // Nếu sau này Trip có field delayMinutes: cộng vào totalDelayMinutes ở đây
            // totalDelayMinutes += trip.getDelayMinutes().doubleValue();
        }

        double onTimeRatePercent =
                (totalTrips == 0) ? 0.0 : (completedTrips * 100.0) / totalTrips;

        double averageDistancePerTripKm =
                (totalTrips == 0) ? 0.0 : totalDistanceKm / totalTrips;

        double averageDelayMinutes =
                (delayedTrips == 0) ? 0.0 : totalDelayMinutes / delayedTrips;

        return ManagerDtos.OperationsPerformanceDto.builder()
                .totalTrips(totalTrips)
                .completedTrips(completedTrips)
                .cancelledTrips(cancelledTrips)
                .delayedTrips(delayedTrips)
                .onTimeRatePercent(onTimeRatePercent)
                .averageDelayMinutes(averageDelayMinutes)   // hiện giờ sẽ là 0.0
                .totalDistanceKm(totalDistanceKm)
                .averageDistancePerTripKm(averageDistancePerTripKm)
                .build();
    }

    // API 3: FLEET STATUS
    @Override
    @Transactional(readOnly = true)
    public ManagerDtos.FleetStatusDto getFleetStatus() {

        java.util.List<Vehicle> vehicles = vehicleRepository.findAll();

        int totalVehicles = vehicles.size();
        int active = 0;
        int idle = 0;
        int inMaintenance = 0;
        int unavailable = 0;

        for (Vehicle v : vehicles) {
            String status = v.getStatus();
            if (status == null) {
                continue;
            }

            if (status.equalsIgnoreCase("ACTIVE")) {
                active = active + 1;
            } else if (status.equalsIgnoreCase("IDLE")) {
                idle = idle + 1;
            } else if (status.equalsIgnoreCase("MAINTENANCE")
                    || status.equalsIgnoreCase("IN_MAINTENANCE")) {
                inMaintenance = inMaintenance + 1;
            } else if (status.equalsIgnoreCase("UNAVAILABLE")) {
                unavailable = unavailable + 1;
            }
        }

        // tạm thời định nghĩa utilization = tỉ lệ xe active
        double averageUtilizationPercent =
                (totalVehicles == 0) ? 0.0 : (active * 100.0) / totalVehicles;

        return ManagerDtos.FleetStatusDto.builder()
                .totalVehicles(totalVehicles)
                .activeVehicles(active)
                .idleVehicles(idle)
                .inMaintenanceVehicles(inMaintenance)
                .unavailableVehicles(unavailable)
                .averageUtilizationPercent(averageUtilizationPercent)
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
    @Transactional(readOnly = true)
    public List<ManagerDtos.DeliveryReportItemDto> getDeliveriesReport(LocalDate startDate,
                                                                       LocalDate endDate) {

        // 1) Chuyển LocalDate -> LocalDateTime giống các API 1,2
        var from = (startDate != null) ? startDate.atStartOfDay() : null;
        var to   = (endDate != null) ? endDate.plusDays(1).atStartOfDay() : null;

        // 2) Gọi repo lấy thống kê theo ngày
        List<DailyDeliveryStats> stats = tripRepository.findDailyDeliveryStats(from, to);

        // 3) Map sang DTO trả về
        List<ManagerDtos.DeliveryReportItemDto> result = new ArrayList<>();

        for (DailyDeliveryStats s : stats) {
            int totalTrips      = s.getTotalTrips() != null ? s.getTotalTrips() : 0;
            int completedTrips  = s.getCompletedTrips() != null ? s.getCompletedTrips() : 0;
            int cancelledTrips  = s.getCancelledTrips() != null ? s.getCancelledTrips() : 0;
            int delayedTrips    = s.getDelayedTrips() != null ? s.getDelayedTrips() : 0;
            double totalDistance  = s.getTotalDistanceKm() != null ? s.getTotalDistanceKm() : 0.0;

            double onTimeRate =
                    (totalTrips == 0) ? 0.0 : (completedTrips * 100.0) / totalTrips;

            // hiện chưa có cột delayMinutes thực tế → để 0.0
            double averageDelayMinutes = 0.0;

            result.add(
                    ManagerDtos.DeliveryReportItemDto.builder()
                            .date(s.getDate().toString())          // yyyy-MM-dd
                            .totalTrips((int) totalTrips)
                            .completedTrips((int) completedTrips)
                            .cancelledTrips((int) cancelledTrips)
                            .delayedTrips((int) delayedTrips)
                            .onTimeRatePercent(onTimeRate)
                            .averageDelayMinutes(averageDelayMinutes)
                            .totalDistanceKm(totalDistance)
                            .build()
            );
        }

        return result;
    }

    // API 5: ISSUE REPORT
    // API 5: ISSUE REPORT (MOCK)
    @Override
    @Transactional(readOnly = true)
    public List<ManagerDtos.IssueReportItemDto> getIssueReports(
            LocalDate startDate,
            LocalDate endDate
    ) {

        List<ManagerDtos.IssueReportItemDto> list = new ArrayList<>();

        list.add(
                ManagerDtos.IssueReportItemDto.builder()
                        .tripId("T001")
                        .driverId("DRV-1")
                        .driverName("John Doe")
                        .vehicleId("51A-12345")
                        .date("2025-12-09")
                        .issueType("DELAYED")
                        .description("Arrived 15 minutes late due to traffic.")
                        .delayMinutes(15.0)
                        .build()
        );

        list.add(
                ManagerDtos.IssueReportItemDto.builder()
                        .tripId("T002")
                        .driverId("DRV-2")
                        .driverName("Jane Smith")
                        .vehicleId("51B-67890")
                        .date("2025-12-10")
                        .issueType("CANCELLED")
                        .description("Customer cancelled before departure.")
                        .delayMinutes(0.0)
                        .build()
        );

        list.add(
                ManagerDtos.IssueReportItemDto.builder()
                        .tripId("T003")
                        .driverId("DRV-3")
                        .driverName("Adam Lee")
                        .vehicleId("51C-22222")
                        .date("2025-12-11")
                        .issueType("VEHICLE_FAILURE")
                        .description("Engine overheating, required towing.")
                        .delayMinutes(null)
                        .build()
        );

        return list;
    }

    // API 6: COMPLIANCE CHECK
    @Override
    @Transactional(readOnly = true)
    public ManagerDtos.ComplianceCheckDto getComplianceCheck(LocalDate startDate,
                                                             LocalDate endDate) {
        // 1) Convert LocalDate -> LocalDateTime
        var from = (startDate != null) ? startDate.atStartOfDay() : null;
        var to = (endDate != null) ? endDate.plusDays(1).atStartOfDay() : null;

        // 2) Lấy trips theo khoảng ngày qua TripRepository
        java.util.List<Trip> trips;
        if (from != null && to != null) {
            trips = tripRepository.findByScheduledDepartureBetween(from, to);
        } else if (from != null) {
            trips = tripRepository.findByScheduledDepartureGreaterThanEqual(from);
        } else if (to != null) {
            trips = tripRepository.findByScheduledDepartureLessThan(to);
        } else {
            trips = tripRepository.findAll();
        }

        int totalTripsChecked = trips.size();
        int compliantTrips = 0;

        int totalViolations = 0;
        int speedingViolations = 0;          // chưa có dữ liệu thật
        int routeDeviationViolations = 0;    // tạm map từ cancelled
        int lateDeliveryViolations = 0;      // tạm map từ delayed

        for (Trip trip : trips) {
            String status = trip.getStatus();
            if (status == null) {
                continue;
            }

            if (status.equalsIgnoreCase("COMPLETED")) {
                // coi như compliant
                compliantTrips = compliantTrips + 1;
            } else if (status.equalsIgnoreCase("DELAYED")) {
                lateDeliveryViolations = lateDeliveryViolations + 1;
                totalViolations = totalViolations + 1;
            } else if (status.equalsIgnoreCase("CANCELLED")) {
                routeDeviationViolations = routeDeviationViolations + 1;
                totalViolations = totalViolations + 1;
            }
            // nếu sau này có thêm status khác (FAILED, BREAKDOWN...) thì cộng ở đây
        }

        int tripsWithViolations = totalTripsChecked - compliantTrips;
        if (tripsWithViolations < 0) {
            tripsWithViolations = 0;
        }

        double complianceRatePercent =
                (totalTripsChecked == 0)
                        ? 0.0
                        : (compliantTrips * 100.0) / totalTripsChecked;

        // hiện tại chưa tính được số driver vi phạm, để 0
        int driversWithViolations = 0;

        return ManagerDtos.ComplianceCheckDto.builder()
                .totalTripsChecked(totalTripsChecked)
                .compliantTrips(compliantTrips)
                .tripsWithViolations(tripsWithViolations)

                .totalViolations(totalViolations)
                .speedingViolations(speedingViolations)
                .routeDeviationViolations(routeDeviationViolations)
                .lateDeliveryViolations(lateDeliveryViolations)

                .driversWithViolations(driversWithViolations)
                .complianceRatePercent(complianceRatePercent)
                .build();
    }

    // API 7: ROUTE ANALYTICS / SUMMARY
    @Override
    @Transactional(readOnly = true)
    public List<ManagerDtos.RouteSummaryItemDto> getRouteSummary(LocalDate startDate,
                                                                 LocalDate endDate) {

        // 1) Chuyển LocalDate -> LocalDateTime giống các API 1,2
        var from = (startDate != null) ? startDate.atStartOfDay() : null;
        var to   = (endDate != null) ? endDate.plusDays(1).atStartOfDay() : null;

        // 2) Lấy trips theo khoảng ngày
        List<Trip> trips;
        if (from != null && to != null) {
            trips = tripRepository.findByScheduledDepartureBetween(from, to);
        } else if (from != null) {
            trips = tripRepository.findByScheduledDepartureGreaterThanEqual(from);
        } else if (to != null) {
            trips = tripRepository.findByScheduledDepartureLessThan(to);
        } else {
            trips = tripRepository.findAll();
        }

        // 3) Gom số liệu theo routeId
        class RouteAgg {
            String routeCode;
            String origin;
            String destination;

            int totalTrips;
            double totalDistanceKm;
            double totalDurationMinutes;
            int completedTrips;
        }

        java.util.Map<Integer, RouteAgg> map = new java.util.LinkedHashMap<>();

        for (Trip trip : trips) {
            Route route = trip.getRoute();
            if (route == null || route.getRouteId() == null) {
                continue;
            }

            Integer key = route.getRouteId();

            RouteAgg agg = map.computeIfAbsent(key, id -> {
                RouteAgg a = new RouteAgg();
                a.routeCode = "R-" + id;
                a.origin = route.getOriginAddress();
                a.destination = route.getDestinationAddress();
                return a;
            });

            agg.totalTrips = agg.totalTrips + 1;

            // distanceKm từ route (BigDecimal) -> double
            if (route.getDistanceKm() != null) {
                agg.totalDistanceKm = agg.totalDistanceKm + route.getDistanceKm().doubleValue();
            }

            // estimated_duration_hours (nếu có) -> phút
            if (route.getEstimatedDurationHours() != null) {
                double hours = route.getEstimatedDurationHours().doubleValue();
                agg.totalDurationMinutes = agg.totalDurationMinutes + (hours * 60.0);
            }

            // coi trip "completed" là on-time
            String status = trip.getStatus();
            if (status != null && status.equalsIgnoreCase("completed")) {
                agg.completedTrips = agg.completedTrips + 1;
            }
        }

        // 4) Chuyển sang DTO
        java.util.List<ManagerDtos.RouteSummaryItemDto> result = new java.util.ArrayList<>();

        for (RouteAgg a : map.values()) {
            int total = a.totalTrips;

            double avgDistanceKm =
                    (total == 0) ? 0.0 : a.totalDistanceKm / total;

            double avgDurationMinutes =
                    (total == 0) ? 0.0 : a.totalDurationMinutes / total;

            double onTimeRatePercent =
                    (total == 0) ? 0.0 : (a.completedTrips * 100.0) / total;

            // Tạm thời không sinh gợi ý tối ưu, để null hoặc chuỗi rỗng
            String suggestion = "";

            result.add(
                    ManagerDtos.RouteSummaryItemDto.builder()
                            .routeId(a.routeCode)
                            .origin(a.origin)
                            .destination(a.destination)
                            .totalTrips(a.totalTrips)
                            .totalDistanceKm(a.totalDistanceKm)
                            .averageDistanceKm(avgDistanceKm)
                            .averageDurationMinutes(avgDurationMinutes)
                            .onTimeRatePercent(onTimeRatePercent)
                            .optimizationSuggestion(suggestion)
                            .build()
            );
        }

        // Nếu muốn hiển thị tuyến nhiều chuyến nhất trước:
        result.sort((r1, r2) -> Integer.compare(r2.getTotalTrips(), r1.getTotalTrips()));

        return result;
    }

    // API 8: ALERTS
    @Override
    @Transactional(readOnly = true)
    public List<ManagerDtos.AlertDto> getAlerts(LocalDate startDate,
                                                LocalDate endDate) {

        var from = (startDate != null) ? startDate.atStartOfDay() : null;
        var to   = (endDate != null)   ? endDate.plusDays(1).atStartOfDay() : null;

        // Lấy trips trong khoảng thời gian (tương tự các API khác)
        List<Trip> trips;
        if (from != null && to != null) {
            trips = tripRepository.findByScheduledDepartureBetween(from, to);
        } else if (from != null) {
            trips = tripRepository.findByScheduledDepartureGreaterThanEqual(from);
        } else if (to != null) {
            trips = tripRepository.findByScheduledDepartureLessThan(to);
        } else {
            trips = tripRepository.findAll();
        }

        List<ManagerDtos.AlertDto> alerts = new ArrayList<>();

        // 1) ALERT BẢO TRÌ / TÌNH TRẠNG XE

        List<Vehicle> vehicles = vehicleRepository.findAll();
        int seq = 1; // để tạo alertId đơn giản A001, A002, ...

        for (Vehicle v : vehicles) {
            String status = v.getStatus();
            if (status == null) continue;

            String plate = v.getLicensePlate();
            String vehicleIdStr = v.getVehicleId() != null
                    ? "V" + v.getVehicleId()
                    : null;

            if (status.equalsIgnoreCase("MAINTENANCE")
                    || status.equalsIgnoreCase("IN_MAINTENANCE")) {

                alerts.add(ManagerDtos.AlertDto.builder()
                        .alertId(String.format("A%03d", seq++))
                        .type("VEHICLE_MAINTENANCE")
                        .severity("HIGH")
                        .title("Vehicle in maintenance")
                        .message("Vehicle " + plate + " is currently in maintenance.")
                        .relatedDriverId(null)
                        .relatedDriverName(null)
                        .relatedVehicleId(vehicleIdStr)
                        .createdAt(LocalDateTime.now().toString())
                        .acknowledged(Boolean.FALSE)
                        .build());

            } else if (status.equalsIgnoreCase("UNAVAILABLE")) {

                alerts.add(ManagerDtos.AlertDto.builder()
                        .alertId(String.format("A%03d", seq++))
                        .type("VEHICLE_MAINTENANCE")
                        .severity("MEDIUM")
                        .title("Vehicle unavailable")
                        .message("Vehicle " + plate + " is marked as unavailable.")
                        .relatedDriverId(null)
                        .relatedDriverName(null)
                        .relatedVehicleId(vehicleIdStr)
                        .createdAt(LocalDateTime.now().toString())
                        .acknowledged(Boolean.FALSE)
                        .build());
            }
        }

        // 2) ALERT HÀNH VI TÀI XẾ (DELAY / CANCEL)
        // Gom thống kê theo driver
        class DriverIssueAgg {
            String driverCode;
            String driverName;
            int cancelledTrips;
            int delayedTrips;
        }

        Map<Integer, DriverIssueAgg> driverMap = new LinkedHashMap<>();

        for (Trip trip : trips) {
            String tripStatus = trip.getStatus();
            boolean isCancelled = "cancelled".equalsIgnoreCase(tripStatus);
            boolean isDelayed   = "delayed".equalsIgnoreCase(tripStatus);

            if (!isCancelled && !isDelayed) continue;
            if (trip.getTripAssignments() == null) continue;

            for (TripAssignment ta : trip.getTripAssignments()) {
                Driver d = ta.getDriver();
                if (d == null || d.getDriverId() == null) continue;

                Integer driverKey = d.getDriverId();

                DriverIssueAgg agg = driverMap.computeIfAbsent(driverKey, id -> {
                    DriverIssueAgg a = new DriverIssueAgg();
                    a.driverCode = "DRV-" + id;
                    a.driverName = d.getFullName();
                    return a;
                });

                if (isCancelled) {
                    agg.cancelledTrips = agg.cancelledTrips + 1;
                }
                if (isDelayed) {
                    agg.delayedTrips = agg.delayedTrips + 1;
                }
            }
        }

        for (DriverIssueAgg agg : driverMap.values()) {
            int totalIssues = agg.cancelledTrips + agg.delayedTrips;
            if (totalIssues >= 2) {
                String msg = String.format(
                        "%s has %d problematic trips (cancelled: %d, delayed: %d) in the selected period.",
                        agg.driverName,
                        totalIssues,
                        agg.cancelledTrips,
                        agg.delayedTrips
                );

                alerts.add(ManagerDtos.AlertDto.builder()
                        .alertId(String.format("A%03d", seq++))
                        .type("DRIVER_BEHAVIOR")
                        .severity("MEDIUM")
                        .title("Driver has multiple issues")
                        .message(msg)
                        .relatedDriverId(agg.driverCode)
                        .relatedDriverName(agg.driverName)
                        .relatedVehicleId(null)
                        .createdAt(LocalDateTime.now().toString())
                        .acknowledged(Boolean.FALSE)
                        .build());
            }
        }

        // 3) ALERT RỦI RO TUYẾN ĐƯỜNG (DELAY_RISK)
        class RouteAgg {
            String routeCode;
            String origin;
            String destination;
            int totalTrips;
            int completedTrips;
        }

        Map<Integer, RouteAgg> routeMap = new LinkedHashMap<>();

        for (Trip trip : trips) {
            Route route = trip.getRoute();
            if (route == null || route.getRouteId() == null) continue;

            Integer routeKey = route.getRouteId();

            RouteAgg agg = routeMap.computeIfAbsent(routeKey, id -> {
                RouteAgg a = new RouteAgg();
                a.routeCode   = "R-" + id;
                a.origin      = route.getOriginAddress();
                a.destination = route.getDestinationAddress();
                return a;
            });

            agg.totalTrips = agg.totalTrips + 1;
            if ("completed".equalsIgnoreCase(trip.getStatus())) {
                agg.completedTrips = agg.completedTrips + 1;
            }
        }

        for (RouteAgg agg : routeMap.values()) {
            if (agg.totalTrips == 0) continue;

            double onTimeRate = (agg.completedTrips * 100.0) / agg.totalTrips;
            if (onTimeRate < 75.0) {
                String msg = String.format(
                        "Route %s (%s → %s) has low on-time rate: %.1f%%.",
                        agg.routeCode,
                        agg.origin,
                        agg.destination,
                        onTimeRate
                );

                alerts.add(ManagerDtos.AlertDto.builder()
                        .alertId(String.format("A%03d", seq++))
                        .type("DELAY_RISK")
                        .severity("CRITICAL")
                        .title("Route has high delay risk")
                        .message(msg)
                        .relatedDriverId(null)
                        .relatedDriverName(null)
                        .relatedVehicleId(null)
                        .createdAt(LocalDateTime.now().toString())
                        .acknowledged(Boolean.FALSE)
                        .build());
            }
        }

        return alerts;
    }

    // API 9: MANAGER ACTIVITIES / AUDIT
    @Override
    @Transactional(readOnly = true)
    public List<ManagerDtos.ManagerActivityDto> getManagerActivities(LocalDate startDate,
                                                                     LocalDate endDate) {

        LocalDateTime from = (startDate != null) ? startDate.atStartOfDay() : null;
        LocalDateTime to   = (endDate != null)   ? endDate.plusDays(1).atStartOfDay() : null;

        // Lấy tất cả log role MANAGER, sort DESC theo timestamp (đã định nghĩa trong repo)
        List<AuditLog> logs = auditLogRepository.searchLogsBase(null, "MANAGER", null);

        Stream<AuditLog> stream = logs.stream();

        if (from != null) {
            stream = stream.filter(l -> !l.getTimestamp().isBefore(from));   // >= from
        }
        if (to != null) {
            stream = stream.filter(l -> l.getTimestamp().isBefore(to));       // < to
        }

        return stream
                .map(log -> ManagerDtos.ManagerActivityDto.builder()
                        .activityId("LOG-" + log.getId())
                        .username(log.getUsername())
                        .action(log.getAction())
                        .description(log.getDetails())
                        .entityType(null)                              // hiện chưa có, để null
                        .entityId(null)
                        .timestamp(log.getTimestamp().toString())
                        .ipAddress(null)                               // chưa lưu IP trong AuditLog
                        .build()
                )
                .toList();
    }

    // trip bị trễ nếu actual > scheduled (đi hoặc đến)
    private boolean isTripDelayed(Trip trip) {
        var scheduledDep = trip.getScheduledDeparture();
        var actualDep = trip.getActualDeparture();
        if (scheduledDep != null && actualDep != null && actualDep.isAfter(scheduledDep)) {
            return true;
        }

        var scheduledArr = trip.getScheduledArrival();
        var actualArr = trip.getActualArrival();
        return scheduledArr != null && actualArr != null && actualArr.isAfter(scheduledArr);
    }

    // tính số phút trễ (ưu tiên giờ đến, nếu không có thì dùng giờ đi)
    private double calculateDelayMinutes(Trip trip) {
        var scheduledArr = trip.getScheduledArrival();
        var actualArr = trip.getActualArrival();
        if (scheduledArr != null && actualArr != null && actualArr.isAfter(scheduledArr)) {
            return (double) java.time.Duration.between(scheduledArr, actualArr).toMinutes();
        }

        var scheduledDep = trip.getScheduledDeparture();
        var actualDep = trip.getActualDeparture();
        if (scheduledDep != null && actualDep != null && actualDep.isAfter(scheduledDep)) {
            return (double) java.time.Duration.between(scheduledDep, actualDep).toMinutes();
        }

        return 0.0;
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }
}
