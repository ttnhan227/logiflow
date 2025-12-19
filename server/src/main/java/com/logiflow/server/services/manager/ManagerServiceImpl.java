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
import com.logiflow.server.repositories.driver_worklog.DriverWorkLogRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import java.time.Duration;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class ManagerServiceImpl implements ManagerService {

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final AuditLogRepository auditLogRepository;
    private final DriverWorkLogRepository driverWorkLogRepository;

    // 1 DASHBOARD OVERVIEW
    @Override
    @Transactional(readOnly = true)
    public ManagerDtos.ManagerOverviewDto getDashboardOverview(
            LocalDate startDate,
            LocalDate endDate
    ) {
        // 1) Reuse existing services
        var performance = getOperationsPerformance(startDate, endDate);
        var fleet = getFleetStatus();
        var deliveries = getDeliveriesReport(startDate, endDate);
        var alerts = getAlerts(startDate, endDate);

        // 2) Tính deliveries summary
        int totalTrips = 0;
        int completedTrips = 0;
        int cancelledTrips = 0;
        int delayedTrips = 0;

        for (var d : deliveries) {
            totalTrips += d.getTotalTrips();
            completedTrips += d.getCompletedTrips();
            cancelledTrips += d.getCancelledTrips();
            delayedTrips += d.getDelayedTrips();
        }

        var deliveriesSummary =
                ManagerDtos.DeliveriesSummaryDto.builder()
                        .totalTrips(totalTrips)
                        .completedTrips(completedTrips)
                        .cancelledTrips(cancelledTrips)
                        .delayedTrips(delayedTrips)
                        .build();

        // 3) KPI overview
        var kpi =
                ManagerDtos.OverviewKpiDto.builder()
                        .totalTrips(performance.getTotalTrips())
                        .completedTrips(performance.getCompletedTrips())
                        .delayedTrips(performance.getDelayedTrips())
                        .onTimeRatePercent(performance.getOnTimeRatePercent())
                        .fleetUtilizationPercent(
                                fleet.getAverageUtilizationPercent() != null
                                        ? fleet.getAverageUtilizationPercent()
                                        : 0.0
                        )
                        .build();

        // 4) Lấy 5 alert mới nhất
        List<ManagerDtos.AlertDto> topAlerts =
                alerts.stream().limit(5).toList();

        // 5) Build overview DTO
        return ManagerDtos.ManagerOverviewDto.builder()
                .kpi(kpi)
                .fleet(fleet)
                .deliveriesSummary(deliveriesSummary)
                .topAlerts(topAlerts)
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    // API 2: OPERATIONS PERFORMANCE
    @Override
    public ManagerDtos.OperationsPerformanceDto getOperationsPerformance(
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        java.time.LocalDateTime from = startDate.atStartOfDay();
        java.time.LocalDateTime to = endDate.plusDays(1).atStartOfDay(); // inclusive end-day

        List<Trip> trips = tripRepository.findByScheduledDepartureBetweenWithAssignments(from, to);

        int totalTrips = trips.size();
        int completedTrips = 0;
        int cancelledTrips = 0;

        int delayedTrips = 0;
        int eligibleCompletedTrips = 0;
        int delayedCompletedTrips = 0;
        int delayedInProgressTrips = 0;
        int onTimeCompletedTrips = 0;

        double totalDistanceKm = 0.0;
        double totalDelayMinutes = 0.0;

        double totalCargoWeightKg = 0.0;
        double totalVehicleCapacityKg = 0.0;
        double totalUtilizationPercent = 0.0;
        int utilizationTripCount = 0;
        int overCapacityTrips = 0;

        for (Trip trip : trips) {
            String status = trip.getStatus();

            boolean isCancelled = status != null && status.equalsIgnoreCase("cancelled");
            boolean isCompleted = status != null && status.equalsIgnoreCase("completed");

            if (isCompleted) {
                completedTrips = completedTrips + 1;
            } else if (isCancelled) {
                cancelledTrips = cancelledTrips + 1;
            }

            Route route = trip.getRoute();
            if (route != null && route.getDistanceKm() != null) {
                totalDistanceKm = totalDistanceKm + route.getDistanceKm().doubleValue();
            }

            // Delay + On-time: không tính cho cancelled
            if (!isCancelled) {
                boolean delayed = isTripDelayed(trip);

                if (delayed) {
                    delayedTrips = delayedTrips + 1;
                    totalDelayMinutes = totalDelayMinutes + calculateDelayMinutes(trip);

                    if (isCompleted) {
                        delayedCompletedTrips = delayedCompletedTrips + 1;
                    } else {
                        delayedInProgressTrips = delayedInProgressTrips + 1;
                    }
                }

                if (isCompleted && trip.getScheduledArrival() != null && trip.getActualArrival() != null) {
                    eligibleCompletedTrips = eligibleCompletedTrips + 1;
                    if (!delayed) {
                        onTimeCompletedTrips = onTimeCompletedTrips + 1;
                    }
                }
            }

            // Tonnage utilization (kg): sum(order.weightKg) vs vehicle.capacity
            Vehicle vehicle = trip.getVehicle();
            Integer capacityKg = (vehicle != null) ? vehicle.getCapacity() : null;

            if (capacityKg != null && capacityKg > 0 && trip.getOrders() != null && !trip.getOrders().isEmpty()) {
                double tripWeightKg = 0.0;

                for (com.logiflow.server.models.Order o : trip.getOrders()) {
                    if (o != null && o.getWeightKg() != null) {
                        tripWeightKg = tripWeightKg + o.getWeightKg().doubleValue();
                    }
                }

                totalCargoWeightKg = totalCargoWeightKg + tripWeightKg;
                totalVehicleCapacityKg = totalVehicleCapacityKg + capacityKg;

                double utilizationPercent = (tripWeightKg * 100.0) / capacityKg;
                totalUtilizationPercent = totalUtilizationPercent + utilizationPercent;
                utilizationTripCount = utilizationTripCount + 1;

                if (tripWeightKg > capacityKg) {
                    overCapacityTrips = overCapacityTrips + 1;
                }
            }
        }

        double onTimeRatePercent =
                (eligibleCompletedTrips == 0) ? 0.0 : (onTimeCompletedTrips * 100.0) / eligibleCompletedTrips;

        double averageDistancePerTripKm =
                (totalTrips == 0) ? 0.0 : totalDistanceKm / totalTrips;

        double averageDelayMinutes =
                (delayedTrips == 0) ? 0.0 : totalDelayMinutes / delayedTrips;

        double averageTonnageUtilizationPercent =
                (utilizationTripCount == 0) ? 0.0 : totalUtilizationPercent / utilizationTripCount;

        return ManagerDtos.OperationsPerformanceDto.builder()
                .totalTrips(totalTrips)
                .completedTrips(completedTrips)
                .cancelledTrips(cancelledTrips)
                .delayedTrips(delayedTrips)
                .onTimeRatePercent(onTimeRatePercent)
                .averageDelayMinutes(averageDelayMinutes)
                .totalDistanceKm(totalDistanceKm)
                .averageDistancePerTripKm(averageDistancePerTripKm)
                .totalCargoWeightKg(totalCargoWeightKg)
                .totalVehicleCapacityKg(totalVehicleCapacityKg)
                .averageTonnageUtilizationPercent(averageTonnageUtilizationPercent)
                .overCapacityTrips(overCapacityTrips)
                .delayedCompletedTrips(delayedCompletedTrips)
                .delayedInProgressTrips(delayedInProgressTrips)
                .eligibleCompletedTrips(eligibleCompletedTrips)
                .build();
    }

    // dùng chung cho API2 / API4 / API7
    private double sumTripCargoWeightKg(Trip trip) {
        if (trip == null) return 0.0;

        double total = 0.0;

        if (trip.getOrders() != null) {
            for (com.logiflow.server.models.Order o : trip.getOrders()) {
                if (o != null && o.getWeightKg() != null) {
                    total += o.getWeightKg().doubleValue();
                }
            }
        }

        return total;
    }

    // API 3: FLEET STATUS
    @Override
    @Transactional(readOnly = true)
    public ManagerDtos.FleetStatusDto getFleetStatus() {

        List<Vehicle> vehicles = vehicleRepository.findAll();
        int totalVehicles = vehicles.size();

        // Lấy tất cả trip có vehicle gắn vào
        List<Trip> trips = tripRepository.findAll();

        // Map vehicleId -> có trip đang chạy hay không
        Set<String> activeVehicleIds = new HashSet<>();

        for (Trip trip : trips) {
            if (trip == null) continue;
            Vehicle v = trip.getVehicle();
            if (v == null || v.getVehicleId() == null) continue;

            // Định nghĩa DUY NHẤT cho "xe đang chạy"
            if (trip.getActualDeparture() != null && trip.getActualArrival() == null) {
                activeVehicleIds.add(String.valueOf(v.getVehicleId()));
            }
        }

        int active = 0;
        int idle = 0;
        int maintenance = 0;
        int unavailable = 0;

        for (Vehicle vehicle : vehicles) {
            String physicalStatus = normalize(vehicle.getStatus());
            if (isMaintenance(physicalStatus)) {
                maintenance++;
                continue;
            }

            if (isUnavailable(physicalStatus)) {
                unavailable++;
                continue;
            }

            // 2️ Chỉ xe "khỏe" mới xét active/idle
            String vid = String.valueOf(vehicle.getVehicleId());
            if (activeVehicleIds.contains(vid)) {
                active++;
            } else {
                idle++;
            }
        }

        double utilizationPercent =
                totalVehicles == 0 ? 0.0 : (active * 100.0) / totalVehicles;

        return ManagerDtos.FleetStatusDto.builder()
                .totalVehicles(totalVehicles)
                .activeVehicles(active)
                .idleVehicles(idle)
                .inMaintenanceVehicles(maintenance)
                .unavailableVehicles(unavailable)
                .averageUtilizationPercent(utilizationPercent)
                .build();
    }

    private String normalize(String s) {
        return s == null ? null : s.trim().toLowerCase();
    }

    private boolean isMaintenance(String status) {
        if (status == null) return false;
        return status.contains("maintenance")
                || status.contains("repair");
    }

    private boolean isUnavailable(String status) {
        if (status == null) return false;
        return status.contains("unavailable")
                || status.contains("inactive")
                || status.contains("broken");
    }

    // API 4: DELIVERY REPORT
    @Override
    @Transactional(readOnly = true)
    public List<ManagerDtos.DeliveryReportItemDto> getDeliveriesReport(
            LocalDate startDate,
            LocalDate endDate
    ) {
        LocalDate effectiveStartDate =
                (startDate != null) ? startDate : LocalDate.now().minusDays(6);

        LocalDate effectiveEndDate =
                (endDate != null) ? endDate : LocalDate.now();

        LocalDateTime from = effectiveStartDate.atStartOfDay();
        LocalDateTime to = effectiveEndDate.plusDays(1).atStartOfDay();

        List<Trip> trips = tripRepository.findByScheduledDepartureBetween(from, to);

        Map<LocalDate, List<Trip>> byDate = new LinkedHashMap<>();
        for (Trip t : trips) {
            if (t == null || t.getScheduledDeparture() == null) {
                continue;
            }
            LocalDate d = t.getScheduledDeparture().toLocalDate();
            byDate.computeIfAbsent(d, k -> new ArrayList<>()).add(t);
        }

        List<ManagerDtos.DeliveryReportItemDto> result = new ArrayList<>();

        for (var entry : byDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<Trip> dayTrips = entry.getValue();

            int totalTrips = dayTrips.size();
            int completedTrips = 0;
            int cancelledTrips = 0;
            int delayedTrips = 0;

            int eligibleCompletedTrips = 0;
            int onTimeCompletedTrips = 0;

            double totalDistanceKm = 0.0;
            double totalCargoWeightKg = 0.0;

            int delayedCountForAvg = 0;
            double delayedMinutesSum = 0.0;

            for (Trip trip : dayTrips) {
                String status = trip.getStatus();
                boolean isCancelled = status != null && status.equalsIgnoreCase("cancelled");
                boolean isCompleted = status != null && status.equalsIgnoreCase("completed");

                if (isCompleted) {
                    completedTrips = completedTrips + 1;
                } else if (isCancelled) {
                    cancelledTrips = cancelledTrips + 1;
                }

                Route route = trip.getRoute();
                if (route != null && route.getDistanceKm() != null) {
                    totalDistanceKm = totalDistanceKm + route.getDistanceKm().doubleValue();
                }

                if (!isCancelled) {
                    totalCargoWeightKg = totalCargoWeightKg + sumTripCargoWeightKg(trip);
                    boolean delayed = isTripDelayed(trip);
                    if (delayed) {
                        delayedTrips = delayedTrips + 1;

                        double mins = calculateDelayMinutes(trip);
                        if (mins > 0) {
                            delayedMinutesSum = delayedMinutesSum + mins;
                            delayedCountForAvg = delayedCountForAvg + 1;
                        }
                    }

                    if (isCompleted && trip.getScheduledArrival() != null && trip.getActualArrival() != null) {
                        eligibleCompletedTrips = eligibleCompletedTrips + 1;
                        if (!delayed) {
                            onTimeCompletedTrips = onTimeCompletedTrips + 1;
                        }
                    }
                }
            }

            double onTimeRatePercent =
                    (eligibleCompletedTrips == 0) ? 0.0 : (onTimeCompletedTrips * 100.0) / eligibleCompletedTrips;

            double averageDelayMinutes =
                    (delayedCountForAvg == 0) ? 0.0 : delayedMinutesSum / delayedCountForAvg;

            result.add(
                    ManagerDtos.DeliveryReportItemDto.builder()
                            .date(date.toString())
                            .totalTrips(totalTrips)
                            .completedTrips(completedTrips)
                            .cancelledTrips(cancelledTrips)
                            .delayedTrips(delayedTrips)
                            .onTimeRatePercent(onTimeRatePercent)
                            .averageDelayMinutes(averageDelayMinutes)
                            .totalDistanceKm(totalDistanceKm)
                            .totalCargoWeightKg(totalCargoWeightKg)
                            .build()
            );
        }

        return result;
    }

    // API 5: ISSUE REPORT
    @Override
    @Transactional(readOnly = true)
    public ManagerDtos.IssuesReportResponseDto getIssueReports(LocalDate startDate, LocalDate endDate) {

        LocalDate s = (startDate != null) ? startDate : LocalDate.now().minusDays(6);
        LocalDate e = (endDate != null) ? endDate : LocalDate.now();

        LocalDateTime from = s.atStartOfDay();
        LocalDateTime to = e.plusDays(1).atStartOfDay();

        // List<Trip> trips = tripRepository.findByScheduledDepartureBetweenWithAssignments(from, to);
        List<Trip> trips = tripRepository.findByScheduledDepartureBetween(from, to);

        List<ManagerDtos.IssueReportItemDto> items = new ArrayList<>();

        for (Trip t : trips) {
            if (t == null) continue;

            String status = t.getStatus() != null ? t.getStatus().trim().toLowerCase() : "";

            boolean isCancelled = "cancelled".equals(status) || "canceled".equals(status);

            // Delayed theo rule thật (đồng bộ API2/API4), không dựa status="delayed"
            boolean isDelayed = !isCancelled && isTripDelayed(t);

            if (!isDelayed && !isCancelled) continue;

            String driverId = null;
            String driverName = null;

            if (t.getTripAssignments() != null && !t.getTripAssignments().isEmpty()) {
                var opt = t.getTripAssignments().stream()
                        .filter(ta -> ta.getDriver() != null)
                        .findFirst();
                if (opt.isPresent()) {
                    var d = opt.get().getDriver();
                    driverId = (d.getDriverId() != null) ? String.valueOf(d.getDriverId()) : null;
                    driverName = (d.getUser() != null) ? d.getUser().getFullName() : null;
                }
            }

            String vehicleId = (t.getVehicle() != null && t.getVehicle().getVehicleId() != null)
                    ? String.valueOf(t.getVehicle().getVehicleId())
                    : null;

            String date = (t.getScheduledDeparture() != null)
                    ? t.getScheduledDeparture().toLocalDate().toString()
                    : s.toString();

            Double delayMinutes = null;
            if (isDelayed) {
                double mins = calculateDelayMinutes(t);
                delayMinutes = mins <= 0 ? 0.0 : mins;
            }

            String issueType = isCancelled ? "Cancelled" : "Delayed";
            String description = isCancelled ? "Trip cancelled" : "Trip delayed";

            items.add(ManagerDtos.IssueReportItemDto.builder()
                    .tripId(t.getTripId() != null ? String.valueOf(t.getTripId()) : null)
                    .driverId(driverId)
                    .driverName(driverName)
                    .vehicleId(vehicleId)
                    .date(date)
                    .issueType(issueType)
                    .description(description)
                    .delayMinutes(delayMinutes)
                    .build());
        }

        int delayed = (int) items.stream().filter(x -> "Delayed".equalsIgnoreCase(x.getIssueType())).count();
        int cancelled = (int) items.stream().filter(x -> "Cancelled".equalsIgnoreCase(x.getIssueType())).count();

        // Module 3: chưa có bảng chi phí, technical/highSeverity giữ 0
        ManagerDtos.IssuesSummaryDto summary = ManagerDtos.IssuesSummaryDto.builder()
                .totalIssues(items.size())
                .delayedIssues(delayed)
                .cancelledIssues(cancelled)
                .technicalIssues(0)
                .highSeverity(0)
                .build();

        return ManagerDtos.IssuesReportResponseDto.builder()
                .summary(summary)
                .items(items)
                .build();
    }

    // API 6: COMPLIANCE CHECK
    @Override
    @Transactional(readOnly = true)
    public ManagerDtos.ComplianceCheckResponseDto getComplianceCheck(LocalDate startDate, LocalDate endDate) {

        LocalDate s = (startDate != null) ? startDate : LocalDate.now().minusDays(6);
        LocalDate e = (endDate != null) ? endDate : LocalDate.now();

        LocalDateTime from = s.atStartOfDay();
        LocalDateTime to = e.plusDays(1).atStartOfDay();

        List<Trip> trips = tripRepository.findByScheduledDepartureBetween(from, to);

        List<ManagerDtos.ComplianceViolationDto> items = new ArrayList<>();

        int high = 0;
        int medium = 0;
        int low = 0;

        // cảnh báo sắp hết hạn bằng số ngày
        final int licenseExpiringDays = 30;
        LocalDate licenseThreshold = LocalDate.now().plusDays(licenseExpiringDays);

        for (Trip t : trips) {
            if (t == null) continue;

            List<TripAssignment> assigns = t.getTripAssignments();
            if (assigns == null || assigns.isEmpty()) continue;

            for (TripAssignment ta : assigns) {
                if (ta == null || ta.getDriver() == null) continue;

                Driver d = ta.getDriver();
                Integer driverIdInt = d.getDriverId();
                Integer tripIdInt = t.getTripId();

                String tripId = (tripIdInt != null) ? String.valueOf(tripIdInt) : null;
                String driverId = (driverIdInt != null) ? String.valueOf(driverIdInt) : null;
                String driverName = (d.getUser() != null) ? d.getUser().getFullName() : null;

                String date =
                        (t.getScheduledDeparture() != null)
                                ? t.getScheduledDeparture().toLocalDate().toString()
                                : s.toString();

                // RULE A: LICENSE_EXPIRING (MEDIUM)
                try {
                    LocalDate licenseExpiryDate = d.getLicenseExpiryDate();
                    if (licenseExpiryDate != null && !licenseExpiryDate.isAfter(licenseThreshold)) {
                        items.add(
                                ManagerDtos.ComplianceViolationDto.builder()
                                        .date(date)
                                        .tripId(tripId)
                                        .ruleCode("LICENSE_EXPIRING")
                                        .severity("MEDIUM")
                                        .description("Driver license is expiring soon")
                                        .value((double) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), licenseExpiryDate))
                                        .driverId(driverId)
                                        .driverName(driverName)
                                        .build()
                        );
                        medium++;
                    }
                } catch (Exception ignored) {
                }

                // RULE B: MISSING_WORKLOG (HIGH)
                boolean hasWorkLog = false;
                if (tripIdInt != null && driverIdInt != null) {
                    hasWorkLog = driverWorkLogRepository.existsByTrip_TripIdAndDriver_DriverId(tripIdInt, driverIdInt);
                }

                if (!hasWorkLog) {
                    items.add(
                            ManagerDtos.ComplianceViolationDto.builder()
                                    .date(date)
                                    .tripId(tripId)
                                    .ruleCode("MISSING_WORKLOG")
                                    .severity("HIGH")
                                    .description("Trip has assignment but missing driver work log")
                                    .value(null)
                                    .driverId(driverId)
                                    .driverName(driverName)
                                    .build()
                    );
                    high++;
                    continue; // không có log thì khỏi check rest-time
                }

                // RULE C: REST_TIME_VIOLATION (HIGH/MEDIUM)
                // restTakenHours = nextAvailableTime - endTime, so với restHoursRequired
                if (tripIdInt != null && driverIdInt != null) {
                    List<com.logiflow.server.models.DriverWorkLog> logs =
                            driverWorkLogRepository.findByTrip_TripIdAndDriver_DriverId(tripIdInt, driverIdInt);

                    for (var log : logs) {
                        if (log == null) continue;

                        var endTimeLog = log.getEndTime();
                        var nextAvailable = log.getNextAvailableTime();
                        var restRequired = log.getRestHoursRequired();

                        if (endTimeLog == null || nextAvailable == null || restRequired == null) continue;

                        double restTakenHours =
                                java.time.Duration.between(endTimeLog, nextAvailable).toMinutes() / 60.0;

                        double requiredHours = restRequired.doubleValue();

                        if (restTakenHours + 1e-9 < requiredHours) {
                            items.add(
                                    ManagerDtos.ComplianceViolationDto.builder()
                                            .date(date)
                                            .tripId(tripId)
                                            .ruleCode("REST_TIME_VIOLATION")
                                            .severity("HIGH")
                                            .description("Driver rest time is below required hours")
                                            .value(requiredHours - restTakenHours)
                                            .driverId(driverId)
                                            .driverName(driverName)
                                            .build()
                            );
                            high++;
                            break;
                        }
                    }
                }
            }
        }

        ManagerDtos.ComplianceSummaryDto summary = ManagerDtos.ComplianceSummaryDto.builder()
                .totalViolations(items.size())
                .highRiskCount(high)
                .mediumRiskCount(medium)
                .lowRiskCount(low)
                .build();

        return ManagerDtos.ComplianceCheckResponseDto.builder()
                .summary(summary)
                .items(items)
                .build();
    }

    // API 7: ROUTE ANALYTICS / SUMMARY
    @Override
    @Transactional(readOnly = true)
    public List<ManagerDtos.RouteSummaryItemDto> getRouteSummary(LocalDate startDate, LocalDate endDate) {

        LocalDateTime from = (startDate != null) ? startDate.atStartOfDay() : null;
        LocalDateTime to = (endDate != null) ? endDate.plusDays(1).atStartOfDay() : null;

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

        class RouteAgg {
            String routeCode;
            String origin;
            String destination;

            int totalTrips;

            double totalDistanceKm;
            double totalDurationMinutes;

            int completedTrips;
            int cancelledTrips;

            int delayedTrips;

            int eligibleCompletedTrips;
            int onTimeCompletedTrips;

            double delayedMinutesSum;
            int delayedMinutesCount;

            double totalCargoWeightKg;
        }

        java.util.Map<Integer, RouteAgg> map = new java.util.LinkedHashMap<>();

        for (Trip trip : trips) {
            if (trip == null) continue;

            Route route = trip.getRoute();
            if (route == null || route.getRouteId() == null) continue;

            Integer key = route.getRouteId();

            RouteAgg agg = map.computeIfAbsent(key, id -> {
                RouteAgg a = new RouteAgg();
                a.routeCode = "R-" + id;
                a.origin = route.getOriginAddress();
                a.destination = route.getDestinationAddress();
                a.totalCargoWeightKg = 0.0;
                return a;
            });

            agg.totalTrips = agg.totalTrips + 1;

            if (route.getDistanceKm() != null) {
                agg.totalDistanceKm = agg.totalDistanceKm + route.getDistanceKm().doubleValue();
            }

            if (route.getEstimatedDurationHours() != null) {
                double hours = route.getEstimatedDurationHours().doubleValue();
                agg.totalDurationMinutes = agg.totalDurationMinutes + (hours * 60.0);
            }

            String status = trip.getStatus() != null ? trip.getStatus().trim().toLowerCase() : "";
            boolean isCancelled = "cancelled".equals(status) || "canceled".equals(status);
            boolean isCompleted = "completed".equals(status);

            if (isCancelled) {
                agg.cancelledTrips = agg.cancelledTrips + 1;
                continue; // cancelled: không tính cargo/delay/on-time
            }

            agg.totalCargoWeightKg += sumTripCargoWeightKg(trip);

            if (isCompleted) {
                agg.completedTrips = agg.completedTrips + 1;

                if (trip.getScheduledArrival() != null && trip.getActualArrival() != null) {
                    agg.eligibleCompletedTrips = agg.eligibleCompletedTrips + 1;
                    if (!isTripDelayed(trip)) {
                        agg.onTimeCompletedTrips = agg.onTimeCompletedTrips + 1;
                    }
                }
            }

            if (isTripDelayed(trip)) {
                agg.delayedTrips = agg.delayedTrips + 1;

                double mins = calculateDelayMinutes(trip);
                if (mins > 0) {
                    agg.delayedMinutesSum = agg.delayedMinutesSum + mins;
                    agg.delayedMinutesCount = agg.delayedMinutesCount + 1;
                }
            }
        }

        java.util.List<ManagerDtos.RouteSummaryItemDto> result = new java.util.ArrayList<>();

        for (RouteAgg a : map.values()) {
            int total = a.totalTrips;

            double avgDistanceKm = (total == 0) ? 0.0 : a.totalDistanceKm / total;
            double avgDurationMinutes = (total == 0) ? 0.0 : a.totalDurationMinutes / total;

            double onTimeRatePercent =
                    (a.eligibleCompletedTrips == 0) ? 0.0 : (a.onTimeCompletedTrips * 100.0) / a.eligibleCompletedTrips;

            double avgDelayMinutes =
                    (a.delayedMinutesCount == 0) ? 0.0 : a.delayedMinutesSum / a.delayedMinutesCount;

            String suggestion = "No major issues detected on this route.";

            if (total >= 3 && a.delayedTrips == total) {
                suggestion =
                        "All trips delayed (" + a.delayedTrips + "/" + total + "). Review route timing or traffic conditions.";
            } else if (avgDelayMinutes >= 10 && a.delayedTrips >= 2) {
                suggestion =
                        "Avg delay " + String.format("%.1f", avgDelayMinutes) +
                                " min on " + a.delayedTrips +
                                " trips. Suggest adding buffer time or adjusting departure.";
            } else if (a.cancelledTrips > 0) {
                suggestion =
                        "Has cancelled trips. Review dispatcher assignment or backup planning.";
            } else if (total > 0) {
                double avgCargoPerTripKg = a.totalCargoWeightKg / total;
                if (avgCargoPerTripKg >= 800) {
                    suggestion =
                            "High cargo per trip (~" + String.format("%.0f", avgCargoPerTripKg) +
                                    " kg). Verify vehicle capacity allocation.";
                }
            }

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
                            .delayedTrips(a.delayedTrips)
                            .cancelledTrips(a.cancelledTrips)
                            .averageDelayMinutes(avgDelayMinutes)
                            .totalCargoWeightKg(a.totalCargoWeightKg)
                            .optimizationSuggestion(suggestion)
                            .build()
            );
        }

        result.sort((r1, r2) -> Integer.compare(r2.getTotalTrips(), r1.getTotalTrips()));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ManagerDtos.RecommendationDto> getRecommendations(LocalDate startDate, LocalDate endDate) {

        LocalDate s = (startDate != null) ? startDate : LocalDate.now().minusDays(6);
        LocalDate e = (endDate != null) ? endDate : LocalDate.now();

        // lấy dữ liệu thật từ các API đã chuẩn hoá
        var perf = getOperationsPerformance(s, e);          // API2
        var fleet = getFleetStatus();                       // API3
        var compliance = getComplianceCheck(s, e);          // API6
        var routes = getRouteSummary(s, e);                 // API7
        var alerts = getAlerts(s, e);                       // API8

        List<ManagerDtos.RecommendationDto> recs = new ArrayList<>();

        // 1) ROUTE_DELAY (HIGH) - top route delay
        if (routes != null && !routes.isEmpty()) {
            var topDelay = routes.stream()
                    .filter(r -> r != null)
                    .filter(r -> (r.getTotalTrips() != null && r.getTotalTrips() >= 3))
                    .filter(r -> (r.getAverageDelayMinutes() != null && r.getAverageDelayMinutes() >= 10))
                    .sorted((a, b) -> Double.compare(
                            (b.getAverageDelayMinutes() != null ? b.getAverageDelayMinutes() : 0.0),
                            (a.getAverageDelayMinutes() != null ? a.getAverageDelayMinutes() : 0.0)
                    ))
                    .findFirst()
                    .orElse(null);

            if (topDelay != null) {
                recs.add(
                        ManagerDtos.RecommendationDto.builder()
                                .code("ROUTE_DELAY")
                                .severity("HIGH")
                                .message("Review route timing or add buffer time for the most delayed route.")
                                .evidence(
                                        "Route " + safeStr(topDelay.getRouteId()) +
                                                " avg delay " + fmt1(topDelay.getAverageDelayMinutes()) + " min, delayed " +
                                                safeInt(topDelay.getDelayedTrips()) + "/" + safeInt(topDelay.getTotalTrips())
                                )
                                .build()
                );
            }
        }

        // 2) OVER_CAPACITY (HIGH)
        if (perf != null && perf.getOverCapacityTrips() != null && perf.getOverCapacityTrips() > 0) {
            recs.add(
                    ManagerDtos.RecommendationDto.builder()
                            .code("OVER_CAPACITY")
                            .severity("HIGH")
                            .message("Enforce capacity check before trip assignment and review vehicle allocation.")
                            .evidence(perf.getOverCapacityTrips() + " trips exceeded vehicle capacity.")
                            .build()
            );
        }

        // 3) MAINTENANCE_LOAD (MEDIUM/HIGH)
        if (fleet != null && fleet.getTotalVehicles() != null && fleet.getTotalVehicles() > 0) {
            int total = fleet.getTotalVehicles();
            int maint = safeInt(fleet.getInMaintenanceVehicles());
            int unavail = safeInt(fleet.getUnavailableVehicles());
            int bad = maint + unavail;

            double rate = (total == 0) ? 0.0 : (bad * 100.0) / total;
            if (rate >= 20.0) {
                recs.add(
                        ManagerDtos.RecommendationDto.builder()
                                .code("MAINTENANCE")
                                .severity(rate >= 30.0 ? "HIGH" : "MEDIUM")
                                .message("Review maintenance schedule and ensure backup vehicle availability.")
                                .evidence(bad + "/" + total + " vehicles unavailable (maintenance+unavailable).")
                                .build()
                );
            }
        }

        // 4) COMPLIANCE (HIGH/MEDIUM)
        if (compliance != null && compliance.getSummary() != null) {
            var sum = compliance.getSummary();
            int high = safeInt(sum.getHighRiskCount());
            int med = safeInt(sum.getMediumRiskCount());
            int total = safeInt(sum.getTotalViolations());

            if (high > 0 || med > 0) {
                recs.add(
                        ManagerDtos.RecommendationDto.builder()
                                .code("COMPLIANCE")
                                .severity(high > 0 ? "HIGH" : "MEDIUM")
                                .message("Enforce compliance process: work log discipline and rest-time rules.")
                                .evidence(total + " violations (" + high + " high-risk, " + med + " medium-risk).")
                                .build()
                );
            }
        }

        // 5) DATA_DISCIPLINE (MEDIUM) - missing actual time
        if (alerts != null && !alerts.isEmpty()) {
            long missingActual = alerts.stream()
                    .filter(a -> a != null && "MISSING_ACTUAL_TIME".equalsIgnoreCase(a.getType()))
                    .count();

            if (missingActual > 0) {
                recs.add(
                        ManagerDtos.RecommendationDto.builder()
                                .code("DATA_DISCIPLINE")
                                .severity(missingActual >= 5 ? "MEDIUM" : "LOW")
                                .message("Enforce actual time capture (departure/arrival) for completed trips.")
                                .evidence(missingActual + " trips missing actual time in selected range.")
                                .build()
                );
            }
        }

        // sort theo severity: HIGH, MEDIUM, LOW
        recs.sort((a, b) -> Integer.compare(sevScore(b.getSeverity()), sevScore(a.getSeverity())));
        return recs;
    }

    private int sevScore(String s) {
        if (s == null) return 0;
        String x = s.trim().toUpperCase();
        if ("HIGH".equals(x) || "CRITICAL".equals(x)) return 3;
        if ("MEDIUM".equals(x)) return 2;
        if ("LOW".equals(x)) return 1;
        return 0;
    }

    private String safeStr(String v) {
        return (v == null) ? "-" : v;
    }

    private String fmt1(Double v) {
        if (v == null) return "0.0";
        return String.format("%.1f", v);
    }

    // API 8: ALERTS
    @Override
    @Transactional(readOnly = true)
    public List<ManagerDtos.AlertDto> getAlerts(LocalDate startDate, LocalDate endDate) {

        LocalDate effectiveStart = (startDate != null)
                ? startDate
                : LocalDate.now().minusDays(7);

        LocalDate effectiveEnd = (endDate != null)
                ? endDate
                : LocalDate.now();

        LocalDateTime from = effectiveStart.atStartOfDay();
        LocalDateTime to = effectiveEnd.plusDays(1).atStartOfDay();

        List<ManagerDtos.AlertDto> alerts = new ArrayList<>();
        int seq = 1;

        // TRIP ALERTS
        List<Trip> trips = tripRepository.findByScheduledDepartureBetween(from, to);

        for (Trip trip : trips) {
            if (trip == null) continue;

            String tripId = String.valueOf(trip.getTripId());
            String vehicleId = safeTripVehicleId(trip);
            String driverId = getRelatedDriverId(trip);

            // A) Missing actual time
            if (trip.getScheduledDeparture() != null &&
                    (trip.getActualDeparture() == null || trip.getActualArrival() == null)) {

                String createdAt =
                        trip.getScheduledDeparture() != null
                                ? trip.getScheduledDeparture().toString()
                                : (trip.getScheduledArrival() != null
                                ? trip.getScheduledArrival().toString()
                                : LocalDateTime.now().toString());

                alerts.add(ManagerDtos.AlertDto.builder()
                        .alertId("A" + String.format("%03d", seq++))
                        .type("MISSING_ACTUAL_TIME")
                        .severity("LOW")
                        .title("Missing actual trip time")
                        .message("Trip is missing actual departure or arrival time.")
                        .relatedTripId(tripId)
                        .relatedVehicleId(vehicleId)
                        .relatedDriverId(driverId)
                        .relatedDriverName(getRelatedDriverName(trip))
                        .createdAt(createdAt)
                        .acknowledged(false)
                        .build()
                );
            }

            // B) Delay risk
            if (isTripDelayed(trip)) {
                double delayMinutes = calculateDelayMinutes(trip);
                if (delayMinutes > 15) {

                    String severity = delayMinutes >= 60 ? "CRITICAL" : "HIGH";
                    String createdAt =
                            trip.getActualArrival() != null
                                    ? trip.getActualArrival().toString()
                                    : (trip.getScheduledArrival() != null
                                    ? trip.getScheduledArrival().toString()
                                    : LocalDateTime.now().toString());

                    alerts.add(ManagerDtos.AlertDto.builder()
                            .alertId("A" + String.format("%03d", seq++))
                            .type("DELAY_RISK")
                            .severity(severity)
                            .title("Trip delayed")
                            .message("Trip delayed by " + (int) delayMinutes + " minutes.")
                            .relatedTripId(tripId)
                            .relatedVehicleId(vehicleId)
                            .relatedDriverId(driverId)
                            .relatedDriverName(getRelatedDriverName(trip))
                            .createdAt(createdAt)
                            .acknowledged(false)
                            .build()
                    );
                }
            }
        }

        // VEHICLE MAINTENANCE ALERTS
        List<Vehicle> vehicles = vehicleRepository.findAll();

        for (Vehicle v : vehicles) {
            String st = normalize(v.getStatus());
            if (isMaintenance(st) || isUnavailable(st)) {

                alerts.add(ManagerDtos.AlertDto.builder()
                        .alertId("A" + String.format("%03d", seq++))
                        .type("VEHICLE_MAINTENANCE")
                        .severity("MEDIUM")
                        .title("Vehicle not available")
                        .message("Vehicle is under maintenance or unavailable.")
                        .relatedVehicleId(String.valueOf(v.getVehicleId()))
                        .createdAt(LocalDateTime.now().toString())
                        .acknowledged(false)
                        .build()
                );
            }
        }

        return alerts;
    }

    private String getRelatedDriverId(Trip trip) {
        try {
            if (trip == null) return null;
            List<TripAssignment> assigns = trip.getTripAssignments();
            if (assigns == null || assigns.isEmpty()) return null;

            TripAssignment a = assigns.get(0);
            if (a == null || a.getDriver() == null || a.getDriver().getDriverId() == null) return null;

            return String.valueOf(a.getDriver().getDriverId());
        } catch (Exception ignored) {
            return null;
        }
    }

    private String getRelatedDriverName(Trip trip) {
        try {
            if (trip == null) return null;
            List<TripAssignment> assigns = trip.getTripAssignments();
            if (assigns == null || assigns.isEmpty()) return null;

            Driver d = assigns.get(0).getDriver();
            if (d == null || d.getUser() == null) return null;

            return d.getUser().getFullName();
        } catch (Exception ignored) {
            return null;
        }
    }

    // helpers
    private String safeVehicleId(Vehicle v) {
        try {
            if (v == null) return null;
            if (v.getVehicleId() != null) return String.valueOf(v.getVehicleId());
        } catch (Exception ignored) {
        }
        return null;
    }

    private String safeTripVehicleId(Trip t) {
        try {
            if (t == null || t.getVehicle() == null) return null;
            Vehicle v = t.getVehicle();
            if (v.getVehicleId() != null) return String.valueOf(v.getVehicleId());
        } catch (Exception ignored) {
        }
        return null;
    }

    private String safeRouteName(Trip t) {
        try {
            Route r = t.getRoute();
            if (r == null) return null;
            // tùy model: có thể là getRouteName()
            if (r.getRouteName() != null) return r.getRouteName();
        } catch (Exception ignored) {
        }
        return null;
    }

    // API 9: MANAGER ACTIVITIES / AUDIT
    @Override
    @Transactional(readOnly = true)
    public List<ManagerDtos.ManagerActivityDto> getManagerActivities(
            LocalDate startDate,
            LocalDate endDate
    ) {

        LocalDateTime from = (startDate != null) ? startDate.atStartOfDay() : null;
        LocalDateTime to = (endDate != null) ? endDate.plusDays(1).atStartOfDay() : null;

        // Lấy tất cả log role MANAGER (đúng module Evaluate dispatcher)
        List<AuditLog> logs = auditLogRepository.searchLogsBase(null, "MANAGER", null);

        Stream<AuditLog> stream = logs.stream();

        if (from != null) {
            stream = stream.filter(l ->
                    l.getTimestamp() != null && !l.getTimestamp().isBefore(from)
            ); // >= from
        }

        if (to != null) {
            stream = stream.filter(l ->
                    l.getTimestamp() != null && l.getTimestamp().isBefore(to)
            ); // < to
        }

        return stream
                .map(a -> ManagerDtos.ManagerActivityDto.builder()
                        .activityId("LOG-" + a.getId())
                        .username(a.getUsername())
                        .action(a.getAction())
                        .description(a.getDetails())
                        .entityType(null)
                        .entityId(null)
                        .timestamp(a.getTimestamp() != null ? a.getTimestamp().toString() : null)
                        .ipAddress(null)
                        .build()
                )
                .toList();

    }

    // Helper resolveUsername
    private String resolveUsername(AuditLog a) {
        if (a == null) {
            return null;
        }

        return a.getUsername();
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
