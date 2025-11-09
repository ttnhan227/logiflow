package com.logiflow.server.dtos.manager.operations;

import java.time.LocalDate;

public class PerformanceStatsDto {
    private LocalDate startDate;
    private LocalDate endDate;
    private long totalTrips;
    private long onTimeTrips;
    private double onTimeRate;     // %
    private Double avgActualHours; // giờ

    public PerformanceStatsDto() {
    }

    public PerformanceStatsDto(LocalDate startDate, LocalDate endDate, long totalTrips,
                               long onTimeTrips, double onTimeRate, Double avgActualHours) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalTrips = totalTrips;
        this.onTimeTrips = onTimeTrips;
        this.onTimeRate = onTimeRate;
        this.avgActualHours = avgActualHours;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public long getTotalTrips() {
        return totalTrips;
    }

    public void setTotalTrips(long totalTrips) {
        this.totalTrips = totalTrips;
    }

    public long getOnTimeTrips() {
        return onTimeTrips;
    }

    public void setOnTimeTrips(long onTimeTrips) {
        this.onTimeTrips = onTimeTrips;
    }

    public double getOnTimeRate() {
        return onTimeRate;
    }

    public void setOnTimeRate(double onTimeRate) {
        this.onTimeRate = onTimeRate;
    }

    public Double getAvgActualHours() {
        return avgActualHours;
    }

    public void setAvgActualHours(Double avgActualHours) {
        this.avgActualHours = avgActualHours;
    }
}
