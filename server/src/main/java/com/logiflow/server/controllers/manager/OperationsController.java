package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.operations.DriverPerformanceDto;
import com.logiflow.server.dtos.manager.operations.PerformanceStatsDto;
import com.logiflow.server.services.manager.operations.DriverPerformanceService;
import com.logiflow.server.services.manager.operations.PerformanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager/operations")
public class OperationsController {

    private final PerformanceService performanceService;
    private final DriverPerformanceService driverPerformanceService;

    public OperationsController(PerformanceService performanceService,
                                DriverPerformanceService driverPerformanceService) {
        this.performanceService = performanceService;
        this.driverPerformanceService = driverPerformanceService;
    }

    // 2) Thống kê hiệu suất giao hàng (lọc theo ngày)
    @GetMapping("/performance")
    public ResponseEntity<PerformanceStatsDto> performance(
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(performanceService.getOpsPerformance(startDate, endDate));
    }

    // 3) Đánh giá hiệu suất tài xế
    @GetMapping("/drivers/performance")
    public ResponseEntity<List<DriverPerformanceDto>> driversPerformance() {
        return ResponseEntity.ok(driverPerformanceService.getDriversPerformance());
    }
}
