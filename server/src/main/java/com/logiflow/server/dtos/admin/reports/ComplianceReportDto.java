package com.logiflow.server.dtos.admin.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO for compliance monitoring report
 */
@Data
@Builder
@AllArgsConstructor
public class ComplianceReportDto {
    private LocalDate startDate;
    private LocalDate endDate;
    
    // License compliance
    private Integer totalDrivers;
    private Integer driversWithValidLicense;
    private Integer driversWithExpiredLicense;
    private Integer driversWithExpiringSoonLicense; // within 30 days
    
    // Vehicle compliance
    private Integer totalVehicles;
    private Integer vehiclesActive;
    private Integer vehiclesInactive;
    
    // Overall compliance rate
    private Double overallComplianceRate;
}
