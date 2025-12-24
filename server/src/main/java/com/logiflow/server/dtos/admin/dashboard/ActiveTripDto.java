package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * DTO for active trip information
 */
@Data
@Builder
@AllArgsConstructor
public class ActiveTripDto {
    private final String tripId;
    private final String driverName;
    private final String route;
    private final String status; // "in_progress", "delayed", "overdue"
    private final String eta; // Estimated time of arrival
    private final String delayReason; // Optional delay reason

    // Static factory method
    public static ActiveTripDto of(
            String tripId,
            String driverName,
            String route,
            String status,
            String eta,
            String delayReason) {
        return ActiveTripDto.builder()
            .tripId(tripId)
            .driverName(driverName)
            .route(route)
            .status(status)
            .eta(eta)
            .delayReason(delayReason)
            .build();
    }
}
