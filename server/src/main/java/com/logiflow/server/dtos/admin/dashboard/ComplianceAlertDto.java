package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for compliance alerts on the dashboard
 */
@Data
@Builder
@AllArgsConstructor
public class ComplianceAlertDto {
    private String alertType;      // REST_TIME_VIOLATION, MAINTENANCE_DUE, LICENSE_EXPIRING, etc.
    private String severity;       // CRITICAL, WARNING, INFO
    private String message;
    private String entityType;     // DRIVER, VEHICLE, etc.
    private Integer entityId;
    private String entityName;
    private LocalDateTime timestamp;

    public static ComplianceAlertDto of(String alertType, String severity, String message, 
                                       String entityType, Integer entityId, String entityName) {
        return ComplianceAlertDto.builder()
            .alertType(alertType)
            .severity(severity)
            .message(message)
            .entityType(entityType)
            .entityId(entityId)
            .entityName(entityName)
            .timestamp(LocalDateTime.now())
            .build();
    }
}
