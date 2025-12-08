package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * DTO for shipment statistics in the admin dashboard.
 * Provides data for charts showing delivery status distribution.
 */
@Data
@Builder
@AllArgsConstructor
public class ShipmentStatisticsDto {
    private final int scheduled;      // Not yet started
    private final int inProgress;     // Currently in transit
    private final int completed;      // Successfully delivered
    private final int cancelled;      // Cancelled trips

    // Factory method for better readability
    public static ShipmentStatisticsDto of(
            int scheduled,
            int inProgress,
            int completed,
            int cancelled) {
        return ShipmentStatisticsDto.builder()
                .scheduled(scheduled)
                .inProgress(inProgress)
                .completed(completed)
                .cancelled(cancelled)
                .build();
    }
}
