package com.logiflow.server.dtos.admin.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for cost analysis and operational expenses
 */
@Data
@Builder
@AllArgsConstructor
public class CostAnalysisDto {
    private LocalDate startDate;
    private LocalDate endDate;
    
    // Revenue
    private BigDecimal totalRevenue;
    
    // Operational metrics
    private Long totalTrips;
    private Double averageCostPerTrip;
    
    // Vehicle costs
    private Integer totalVehicles;
    private Integer activeVehicles;
    private Double vehicleUtilizationRate;
    
    // Vehicle breakdown by type
    private List<VehicleTypeCostDto> vehicleTypeCosts;
}
