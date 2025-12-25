package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO for hero operations overview section
 */
@Data
@Builder
@AllArgsConstructor
public class OperationsOverviewDto {
    // Key performance indicators
    private final Double difotRate; // Delivery In Full On Time rate (%)
    private final Double fleetUtilization; // Fleet utilization rate (%)
    private final BigDecimal todayRevenue; // Today's revenue
    private final Integer activeTrips; // Number of active trips

    // Map data
    private final Integer activeDrivers;
    private final Integer activePorts;
    private final Integer activeWarehouses;

    // Static factory method
    public static OperationsOverviewDto of(
            Double difotRate,
            Double fleetUtilization,
            BigDecimal todayRevenue,
            Integer activeTrips,
            Integer activeDrivers,
            Integer activePorts,
            Integer activeWarehouses) {
        return OperationsOverviewDto.builder()
            .difotRate(difotRate)
            .fleetUtilization(fleetUtilization)
            .todayRevenue(todayRevenue)
            .activeTrips(activeTrips)
            .activeDrivers(activeDrivers)
            .activePorts(activePorts)
            .activeWarehouses(activeWarehouses)
            .build();
    }
}
