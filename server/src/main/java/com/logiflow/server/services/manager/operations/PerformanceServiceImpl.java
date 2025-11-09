package com.logiflow.server.services.manager.operations;

import com.logiflow.server.dtos.manager.operations.PerformanceStatsDto;
import com.logiflow.server.repositories.manager.operations.TripStatsRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
public class PerformanceServiceImpl implements PerformanceService {

    private final TripStatsRepository tripStatsRepository;

    public PerformanceServiceImpl(TripStatsRepository tripStatsRepository) {
        this.tripStatsRepository = tripStatsRepository;
    }

    private LocalDateTime startOf(LocalDate d) {
        return d == null ? null : d.atStartOfDay();
    }

    private LocalDateTime endOf(LocalDate d) {
        return d == null ? null : d.atTime(LocalTime.MAX);
    }

    @Override
    public PerformanceStatsDto getOpsPerformance(LocalDate start, LocalDate end) {
        LocalDate s = (start == null ? LocalDate.now().minusDays(7) : start);
        LocalDate e = (end == null ? LocalDate.now() : end);

        LocalDateTime from = startOf(s);
        LocalDateTime to = endOf(e);

        long total = tripStatsRepository.countByScheduledDepartureBetween(from, to);
        long ontime = tripStatsRepository.countOnTimeBetween(from, to);
        Double avgHours = tripStatsRepository.avgActualHours(from, to);

        double rate = total == 0 ? 0.0 : (ontime * 100.0 / total);
        double rateRounded = Math.round(rate * 10.0) / 10.0;
        Double avgRounded = (avgHours == null ? null : Math.round(avgHours * 100.0) / 100.0);

        return new PerformanceStatsDto(s, e, total, ontime, rateRounded, avgRounded);
    }
}
