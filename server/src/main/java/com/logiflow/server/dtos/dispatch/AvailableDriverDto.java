package com.logiflow.server.dtos.dispatch;

import com.logiflow.server.models.Driver;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AvailableDriverDto {
    private Integer driverId;
    private String fullName;
    private String phone;
    private String licenseType;
    private Integer yearsExperience;
    private Driver.HealthStatus healthStatus;
    private String status;
    private BigDecimal restRequiredHours;
    private LocalDateTime nextAvailableTime;
}
