package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * DTO for compliance and safety status dashboard
 */
@Data
@Builder
@AllArgsConstructor
public class ComplianceStatusDto {
    // Driver compliance
    private final Integer compliantDrivers;
    private final Integer warningDrivers;
    private final Integer atRiskDrivers;
    private final Integer totalDrivers;

    // Safety scorecard
    private final Double averageDriverRating;
    private final Double onTimeDeliveryRate;
    private final Double customerSatisfaction;

    // Document status
    private final Integer validLicenses;
    private final Integer expiringLicenses; // within 30 days

    // Static factory method
    public static ComplianceStatusDto of(
            Integer compliantDrivers,
            Integer warningDrivers,
            Integer atRiskDrivers,
            Integer totalDrivers,
            Double averageDriverRating,
            Double onTimeDeliveryRate,
            Double customerSatisfaction,
            Integer validLicenses,
            Integer expiringLicenses) {
        return ComplianceStatusDto.builder()
            .compliantDrivers(compliantDrivers)
            .warningDrivers(warningDrivers)
            .atRiskDrivers(atRiskDrivers)
            .totalDrivers(totalDrivers)
            .averageDriverRating(averageDriverRating)
            .onTimeDeliveryRate(onTimeDeliveryRate)
            .customerSatisfaction(customerSatisfaction)
            .validLicenses(validLicenses)
            .expiringLicenses(expiringLicenses)
            .build();
    }
}
