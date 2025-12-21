package com.logiflow.server.dtos.admin.trip;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverSummaryDto {
    private Integer driverId;
    private String fullName;
    private String licenseType;
    private String phone;
    private BigDecimal currentLat;
    private BigDecimal currentLng;
    // Add more fields as needed

    public static DriverSummaryDto fromDriver(com.logiflow.server.models.Driver driver, java.util.List<String> flags) {
        if (driver == null) return null;
        return new DriverSummaryDto(
            driver.getDriverId(),
            driver.getUser().getFullName(),
            driver.getLicenseType(),
            driver.getUser().getPhone(),
            driver.getCurrentLocationLat(),
            driver.getCurrentLocationLng()
        );
    }
}
