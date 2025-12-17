package com.logiflow.server.repositories.trip;

import java.time.LocalDate;

/**
 * Aggregations for completed trips grouped by actualArrival date.
 * Delay minutes are computed in service layer (DB-agnostic) using scheduledArrival/actualArrival/slaExtensionMinutes.
 */
public interface DailyCompletedDelayAgg {
    LocalDate getDate();

    Integer getCompletedTripsWithActualArrival();
}
