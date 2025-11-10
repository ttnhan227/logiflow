package com.logiflow.server.dtos.maps;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for routing/directions results.
 * Contains distance, duration, and route geometry for map visualization.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DirectionsResultDto {
    private String totalDistance; // e.g., "15.2 km"
    private Integer distanceMeters;
    private String totalDuration; // e.g., "25 min"
    private Integer durationSeconds;
    private List<List<Double>> geometry; // Route coordinates for drawing on map
    private Map<String, Object> routeData; // Full route data for compatibility
}

