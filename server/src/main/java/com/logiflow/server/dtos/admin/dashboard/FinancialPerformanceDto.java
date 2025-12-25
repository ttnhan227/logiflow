package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO for financial performance panel
 */
@Data
@Builder
@AllArgsConstructor
public class FinancialPerformanceDto {
    // Today's performance
    private final BigDecimal totalRevenue;
    private final BigDecimal averageRevenuePerTrip;
    private final Integer completedTrips;

    // Cost breakdown
    private final Double fuelCostPercentage;
    private final Double driverPayPercentage;
    private final Double otherCostsPercentage;

    // Profitability
    private final Double grossMargin;
    private final BigDecimal revenuePerVehicle;

    // Static factory method
    public static FinancialPerformanceDto of(
            BigDecimal totalRevenue,
            BigDecimal averageRevenuePerTrip,
            Integer completedTrips,
            Double fuelCostPercentage,
            Double driverPayPercentage,
            Double otherCostsPercentage,
            Double grossMargin,
            BigDecimal revenuePerVehicle) {
        return FinancialPerformanceDto.builder()
            .totalRevenue(totalRevenue)
            .averageRevenuePerTrip(averageRevenuePerTrip)
            .completedTrips(completedTrips)
            .fuelCostPercentage(fuelCostPercentage)
            .driverPayPercentage(driverPayPercentage)
            .otherCostsPercentage(otherCostsPercentage)
            .grossMargin(grossMargin)
            .revenuePerVehicle(revenuePerVehicle)
            .build();
    }
}
