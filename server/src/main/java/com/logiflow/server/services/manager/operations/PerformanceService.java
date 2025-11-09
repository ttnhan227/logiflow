package com.logiflow.server.services.manager.operations;

import com.logiflow.server.dtos.manager.operations.PerformanceStatsDto;

import java.time.LocalDate;

public interface PerformanceService {
    PerformanceStatsDto getOpsPerformance(LocalDate start, LocalDate end);
}
