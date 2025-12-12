package com.logiflow.server.repositories.trip;

import java.time.LocalDate;

public interface DailyDeliveryStats {
    LocalDate getDate();

    Integer getTotalTrips();
    Integer getCompletedTrips();
    Integer getCancelledTrips();
    Integer getDelayedTrips();

    Double getTotalDistanceKm();
}
