package com.logiflow.server.repositories.trip;

import java.time.LocalDate;

/**
 * Daily counts of trips grouped by scheduledDeparture date.
 */
public interface DailyTripStatusCounts {
    LocalDate getDate();

    Integer getTotalTrips();
    Integer getScheduledTrips();
    Integer getInProgressTrips();
    Integer getDelayedStatusTrips();
    Integer getCancelledTrips();
    Integer getCompletedTrips();
}
