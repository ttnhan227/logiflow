//package com.logiflow.server.repositories.manager.operations;
//
//import com.logiflow.server.models.Trip;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//
//import java.time.LocalDateTime;
//
//public interface TripStatsRepository extends JpaRepository<Trip, Integer> {
//
//    long countByScheduledDepartureBetween(LocalDateTime from, LocalDateTime to);
//
//    @Query("SELECT COUNT(t) FROM Trip t WHERE t.status IN ('in_progress','assigned')")
//    long countActive();
//
//    @Query("""
//                SELECT COUNT(t) FROM Trip t
//                WHERE t.actualArrival IS NOT NULL
//                  AND t.scheduledArrival IS NOT NULL
//                  AND t.actualArrival <= t.scheduledArrival
//                  AND t.scheduledDeparture >= :from AND t.scheduledDeparture < :to
//            """)
//    long countOnTimeBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
//
//    // Trung bình số giờ thực tế của chuyến (actualArrival - actualDeparture), dùng cú pháp Postgres
//    @Query(value = """
//                SELECT AVG(EXTRACT(EPOCH FROM (t.actual_arrival - t.actual_departure))/3600.0)
//                FROM trips t
//                WHERE t.actual_arrival IS NOT NULL AND t.actual_departure IS NOT NULL
//                  AND (:from IS NULL OR t.actual_departure >= :from)
//                  AND (:to   IS NULL OR t.actual_departure <  :to)
//            """, nativeQuery = true)
//    Double avgActualHours(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
//}
