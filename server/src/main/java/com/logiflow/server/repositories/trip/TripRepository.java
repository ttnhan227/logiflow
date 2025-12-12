package com.logiflow.server.repositories.trip;

import com.logiflow.server.models.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Integer> {
    @Query("SELECT COUNT(DISTINCT ta.driver.driverId) FROM TripAssignment ta WHERE ta.status IN ('assigned', 'in_progress')")
    int countOnDutyDrivers();
    
    @Query("SELECT DISTINCT t FROM Trip t LEFT JOIN FETCH t.vehicle LEFT JOIN FETCH t.route LEFT JOIN FETCH t.orders o LEFT JOIN FETCH o.createdBy WHERE t.tripId = :id")
    Optional<Trip> findByIdWithRelations(@Param("id") Integer id);

    // Lấy các trip của tài xế (lọc theo status nếu có)
    @Query("SELECT t FROM Trip t JOIN t.tripAssignments ta " +
            "WHERE ta.driver.driverId = :driverId " +
            "AND (:status IS NULL OR t.status = :status) " +
            "ORDER BY t.scheduledDeparture DESC")
    List<Trip> findTripsByDriverAndStatus(@Param("driverId") Integer driverId, @Param("status") String status);

    // Lấy chi tiết một trip của tài xế
    @Query("SELECT t FROM Trip t JOIN t.tripAssignments ta " +
            "LEFT JOIN FETCH t.vehicle " +
            "LEFT JOIN FETCH t.route " +
            "LEFT JOIN FETCH t.orders " +
            "WHERE ta.driver.driverId = :driverId AND t.tripId = :tripId")
    Optional<Trip> findTripByDriverAndTripId(@Param("driverId") Integer driverId, @Param("tripId") Integer tripId);

    // Lấy lịch theo khoảng thời gian
    @Query("SELECT t FROM Trip t JOIN t.tripAssignments ta " +
            "WHERE ta.driver.driverId = :driverId " +
            "AND t.scheduledDeparture >= :from AND t.scheduledDeparture < :to " +
            "ORDER BY t.scheduledDeparture ASC")
    List<Trip> findTripsByDriverAndDateRange(@Param("driverId") Integer driverId,
                                             @Param("from") LocalDateTime from,
                                             @Param("to") LocalDateTime to);

    // Lấy trip theo khoảng time
    List<Trip> findByScheduledDepartureBetween(LocalDateTime from, LocalDateTime to);

    // startDate
    List<Trip> findByScheduledDepartureGreaterThanEqual(LocalDateTime from);

    // endDate
    List<Trip> findByScheduledDepartureLessThan(LocalDateTime to);

    // thống kê delivery theo ngày
    @Query("""
        SELECT 
            function('date', t.scheduledDeparture)        AS date,
            COUNT(t)                                      AS totalTrips,
            SUM(CASE WHEN lower(t.status) = 'completed' THEN 1 ELSE 0 END) AS completedTrips,
            SUM(CASE WHEN lower(t.status) = 'cancelled' THEN 1 ELSE 0 END) AS cancelledTrips,
            SUM(CASE WHEN lower(t.status) = 'delayed'   THEN 1 ELSE 0 END) AS delayedTrips,
            COALESCE(SUM(r.distanceKm), 0)               AS totalDistanceKm
        FROM Trip t
        LEFT JOIN t.route r
        WHERE (:from IS NULL OR t.scheduledDeparture >= :from)
          AND (:to   IS NULL OR t.scheduledDeparture <  :to)
        GROUP BY function('date', t.scheduledDeparture)
        ORDER BY function('date', t.scheduledDeparture)
        """)
    List<DailyDeliveryStats> findDailyDeliveryStats(
            @Param("from") LocalDateTime from,
            @Param("to")   LocalDateTime to
    );
}
