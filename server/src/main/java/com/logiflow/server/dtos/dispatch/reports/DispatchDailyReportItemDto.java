package com.logiflow.server.dtos.dispatch.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchDailyReportItemDto {
    private String date; // yyyy-MM-dd

    // All trips counts (bucketed by scheduledDeparture date)
    private int totalTrips;
    private int scheduledTrips;
    private int inProgressTrips;
    private int delayedStatusTrips;
    private int cancelledTrips;
    private int completedTrips;

    // Completed-trip delay metrics (bucketed by actualArrival date)
    private int completedTripsWithActualArrival;
    private int onTimeTrips;
    private int lateTrips;
    private double onTimeRatePercent;

    private double totalDelayMinutes;
    private double avgDelayMinutes;
    private double maxDelayMinutes;

    private List<TopDelayReasonDto> topDelayReasons;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopDelayReasonDto {
        private String reason;
        private long count;
    }
}
