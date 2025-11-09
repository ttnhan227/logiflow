package com.logiflow.server.repositories.manager.analytics;

import com.logiflow.server.models.Route;
import com.logiflow.server.models.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RouteAnalyticsRepository extends JpaRepository<Route, Integer> {

    @Query("SELECT COUNT(DISTINCT t.route.routeId) FROM Trip t WHERE t.route IS NOT NULL")
    long countDistinctRoutesUsed();

    @Query("SELECT AVG(r.distanceKm) FROM Route r WHERE r.distanceKm IS NOT NULL")
    Double avgDistanceKm();

    @Query("SELECT AVG(r.estimatedDurationHours) FROM Route r WHERE r.estimatedDurationHours IS NOT NULL")
    Double avgPlannedHours();
}
