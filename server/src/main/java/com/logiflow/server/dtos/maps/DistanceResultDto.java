package com.logiflow.server.dtos.maps;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for distance calculation results.
 * Contains distance and duration between two points.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DistanceResultDto {
    private String distanceText; // e.g., "15.2 km"
    private Integer distanceMeters;
    private String durationText; // e.g., "25 min"
    private Integer durationSeconds;
}

