package com.logiflow.server.services.manager.operations;

import com.logiflow.server.dtos.manager.operations.DriverPerformanceDto;

import java.util.List;

public interface DriverPerformanceService {
    List<DriverPerformanceDto> getDriversPerformance();
}
