package com.logiflow.server.dtos.manager.analytics;

public class RouteSummaryDto {
    private long totalRoutes;
    private double avgDistanceKm;
    private double avgPlannedHours;
    private String suggestion;

    public RouteSummaryDto() {
    }

    public RouteSummaryDto(long totalRoutes, double avgDistanceKm, double avgPlannedHours, String suggestion) {
        this.totalRoutes = totalRoutes;
        this.avgDistanceKm = avgDistanceKm;
        this.avgPlannedHours = avgPlannedHours;
        this.suggestion = suggestion;
    }

    public long getTotalRoutes() {
        return totalRoutes;
    }

    public void setTotalRoutes(long totalRoutes) {
        this.totalRoutes = totalRoutes;
    }

    public double getAvgDistanceKm() {
        return avgDistanceKm;
    }

    public void setAvgDistanceKm(double avgDistanceKm) {
        this.avgDistanceKm = avgDistanceKm;
    }

    public double getAvgPlannedHours() {
        return avgPlannedHours;
    }

    public void setAvgPlannedHours(double avgPlannedHours) {
        this.avgPlannedHours = avgPlannedHours;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(String suggestion) {
        this.suggestion = suggestion;
    }
}
