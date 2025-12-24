package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * DTO for real-time operations monitor
 */
@Data
@Builder
@AllArgsConstructor
public class ActiveOperationsDto {
    // Active trips
    private final List<ActiveTripDto> activeTrips;

    // Pending assignments
    private final Integer pendingAssignments;
    private final Integer urgentAssignments;

    // Static factory method
    public static ActiveOperationsDto of(
            List<ActiveTripDto> activeTrips,
            Integer pendingAssignments,
            Integer urgentAssignments) {
        return ActiveOperationsDto.builder()
            .activeTrips(activeTrips)
            .pendingAssignments(pendingAssignments)
            .urgentAssignments(urgentAssignments)
            .build();
    }
}
