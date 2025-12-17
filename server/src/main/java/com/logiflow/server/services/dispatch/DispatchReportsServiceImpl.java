package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.reports.DispatchDailyReportItemDto;
import com.logiflow.server.models.Trip;
import com.logiflow.server.repositories.trip.DailyTripStatusCounts;
import com.logiflow.server.repositories.trip.TripRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DispatchReportsServiceImpl implements DispatchReportsService {

    private final TripRepository tripRepository;

    public DispatchReportsServiceImpl(TripRepository tripRepository) {
        this.tripRepository = tripRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DispatchDailyReportItemDto> getDailyReport(LocalDate startDate, LocalDate endDate) {
        LocalDate effectiveEnd = (endDate != null) ? endDate : LocalDate.now();
        LocalDate effectiveStart = (startDate != null) ? startDate : effectiveEnd.minusDays(30);

        // range is [from, to) and never null
        LocalDateTime from = effectiveStart.atStartOfDay();
        LocalDateTime to = effectiveEnd.plusDays(1).atStartOfDay();

        // A) Status counts bucketed by scheduledDeparture date
        List<DailyTripStatusCounts> statusCounts = tripRepository.findDailyTripStatusCounts(from, to);
        Map<LocalDate, DailyTripStatusCounts> statusByDate = statusCounts.stream()
                .collect(Collectors.toMap(DailyTripStatusCounts::getDate, Function.identity(), (a, b) -> a));

        // B) Completed trip delay analytics bucketed by actualArrival date
        List<Trip> completedTrips = tripRepository.findCompletedTripsByActualArrivalRange(from, to);

        Map<LocalDate, List<Trip>> completedByActualArrivalDate = completedTrips.stream()
                .filter(t -> t.getActualArrival() != null)
                .collect(Collectors.groupingBy(t -> t.getActualArrival().toLocalDate()));

        // Merge keys: we want a continuous list of days across range so UI charts don’t have gaps.
        Set<LocalDate> allDates = new HashSet<>();
        allDates.addAll(statusByDate.keySet());
        allDates.addAll(completedByActualArrivalDate.keySet());

        // Ensure full range dates included
        for (LocalDate d = effectiveStart; !d.isAfter(effectiveEnd); d = d.plusDays(1)) {
            allDates.add(d);
        }

        List<LocalDate> sortedDates = allDates.stream().sorted().toList();

        List<DispatchDailyReportItemDto> result = new ArrayList<>();
        for (LocalDate date : sortedDates) {
            DailyTripStatusCounts sc = statusByDate.get(date);
            List<Trip> completedForDay = completedByActualArrivalDate.getOrDefault(date, List.of());

            // Compute delay metrics for completed trips only
            List<Double> delayMinutesList = completedForDay.stream()
                    .map(this::computeDelayMinutes)
                    .filter(Objects::nonNull)
                    .map(Double::valueOf)
                    .toList();

            int completedWithActualArrival = completedForDay.size();
            int lateTrips = (int) delayMinutesList.stream().filter(m -> m > 0).count();
            int onTimeTrips = completedWithActualArrival - lateTrips;

            double totalDelayMinutes = delayMinutesList.stream().mapToDouble(Double::doubleValue).sum();
            double avgDelayMinutes = completedWithActualArrival == 0 ? 0.0 : (totalDelayMinutes / completedWithActualArrival);
            double maxDelayMinutes = delayMinutesList.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
            double onTimeRatePercent = completedWithActualArrival == 0 ? 0.0 : (onTimeTrips * 100.0 / completedWithActualArrival);

            // Delay reasons (supporting info): only count reasons for late trips
            Map<String, Long> reasonCounts = new HashMap<>();
            for (Trip t : completedForDay) {
                Integer dm = computeDelayMinutes(t);
                if (dm == null || dm <= 0) continue;
                String reason = (t.getDelayReason() == null || t.getDelayReason().isBlank()) ? "(No reason provided)" : t.getDelayReason().trim();
                reasonCounts.put(reason, reasonCounts.getOrDefault(reason, 0L) + 1L);
            }

            List<DispatchDailyReportItemDto.TopDelayReasonDto> topReasons = reasonCounts.entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(5)
                    .map(e -> DispatchDailyReportItemDto.TopDelayReasonDto.builder()
                            .reason(e.getKey())
                            .count(e.getValue())
                            .build())
                    .toList();

            DispatchDailyReportItemDto dto = DispatchDailyReportItemDto.builder()
                    .date(date.toString())

                    // status counts
                    .totalTrips(getInt(sc != null ? sc.getTotalTrips() : null))
                    .scheduledTrips(getInt(sc != null ? sc.getScheduledTrips() : null))
                    .inProgressTrips(getInt(sc != null ? sc.getInProgressTrips() : null))
                    .delayedStatusTrips(getInt(sc != null ? sc.getDelayedStatusTrips() : null))
                    .cancelledTrips(getInt(sc != null ? sc.getCancelledTrips() : null))
                    .completedTrips(getInt(sc != null ? sc.getCompletedTrips() : null))

                    // completed delay analytics
                    .completedTripsWithActualArrival(completedWithActualArrival)
                    .onTimeTrips(onTimeTrips)
                    .lateTrips(lateTrips)
                    .onTimeRatePercent(Math.round(onTimeRatePercent * 10.0) / 10.0)
                    .totalDelayMinutes(Math.round(totalDelayMinutes * 10.0) / 10.0)
                    .avgDelayMinutes(Math.round(avgDelayMinutes * 10.0) / 10.0)
                    .maxDelayMinutes(Math.round(maxDelayMinutes * 10.0) / 10.0)
                    .topDelayReasons(topReasons)
                    .build();

            result.add(dto);
        }

        return result;
    }

    private int getInt(Integer v) {
        return v == null ? 0 : v;
    }

    /**
     * delayMinutes = max(0, minutesBetween(scheduledArrival, actualArrival) - slaExtensionMinutes)
     */
    private Integer computeDelayMinutes(Trip t) {
        if (t == null || t.getScheduledArrival() == null || t.getActualArrival() == null) return null;
        long minutesBetween = Duration.between(t.getScheduledArrival(), t.getActualArrival()).toMinutes();
        int slaExt = (t.getSlaExtensionMinutes() != null) ? t.getSlaExtensionMinutes() : 0;
        long raw = minutesBetween - slaExt;
        return (int) Math.max(0, raw);
    }
}
