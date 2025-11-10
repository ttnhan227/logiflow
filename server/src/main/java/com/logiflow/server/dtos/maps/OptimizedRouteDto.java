package com.logiflow.server.dtos.maps;

import java.util.List;
import java.util.Map;

/**
 * DTO for returning an optimized route.
 * Contains the total distance, duration, the optimized order of waypoints, and the route geometry.
 */
public class OptimizedRouteDto {

    private String totalDistance;
    private Integer distanceMeters;
    private String totalDuration;
    private Integer durationSeconds;
    private List<Map<String, Object>> waypoints; // The optimized waypoint order and info from OSRM
    private List<List<Double>> geometry;

    public OptimizedRouteDto(String totalDistance, Integer distanceMeters, String totalDuration, Integer durationSeconds, List<Map<String, Object>> waypoints, List<List<Double>> geometry) {
        this.totalDistance = totalDistance;
        this.distanceMeters = distanceMeters;
        this.totalDuration = totalDuration;
        this.durationSeconds = durationSeconds;
        this.waypoints = waypoints;
        this.geometry = geometry;
    }

    public String getTotalDistance() {
        return totalDistance;
    }

    public void setTotalDistance(String totalDistance) {
        this.totalDistance = totalDistance;
    }

    public Integer getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Integer distanceMeters) {
        this.distanceMeters = distanceMeters;
    }

    public String getTotalDuration() {
        return totalDuration;
    }

    public void setTotalDuration(String totalDuration) {
        this.totalDuration = totalDuration;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public List<Map<String, Object>> getWaypoints() {
        return waypoints;
    }

    public void setWaypoints(List<Map<String, Object>> waypoints) {
        this.waypoints = waypoints;
    }

    public List<List<Double>> getGeometry() {
        return geometry;
    }

    public void setGeometry(List<List<Double>> geometry) {
        this.geometry = geometry;
    }
}
