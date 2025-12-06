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
    
    // Count trips by status for statistics
    long countByStatus(String status);
    
    @Query("SELECT DISTINCT t FROM Trip t LEFT JOIN FETCH t.vehicle LEFT JOIN FETCH t.route LEFT JOIN FETCH t.orders o LEFT JOIN FETCH o.createdBy WHERE t.tripId = :id")
    Optional<Trip> findByIdWithRelations(@Param("id") Integer id);

    // Lấy các trip của tài xế (lọc theo status nếu có)
    @Query("SELECT DISTINCT t FROM Trip t " +
           "LEFT JOIN FETCH t.vehicle " +
           "LEFT JOIN FETCH t.route " +
           "LEFT JOIN FETCH t.orders o " +
           "LEFT JOIN FETCH o.createdBy " +
           "WHERE t.tripId = :id")
    Optional<Trip> findByIdWithRelations(@Param("id") Integer id);

    @Query("SELECT DISTINCT t FROM Trip t LEFT JOIN FETCH t.vehicle LEFT JOIN FETCH t.route LEFT JOIN FETCH t.orders o LEFT JOIN FETCH o.createdBy")
    List<Trip> findAllWithRelations();

    @Query("SELECT DISTINCT t FROM Trip t LEFT JOIN FETCH t.vehicle LEFT JOIN FETCH t.route LEFT JOIN FETCH t.orders o LEFT JOIN FETCH o.createdBy WHERE LOWER(t.status) = LOWER(:status)")
    List<Trip> findByStatusWithRelations(@Param("status") String status);

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
    
    // Get completed trips with actual arrival times for delivery time analysis
    @Query("SELECT t FROM Trip t WHERE t.status = 'completed' " +
            "AND t.actualArrival IS NOT NULL " +
            "AND t.scheduledDeparture IS NOT NULL " +
            "AND t.actualArrival >= :fromDate " +
            "ORDER BY t.actualArrival DESC")
    List<Trip> findCompletedTripsForStats(@Param("fromDate") LocalDateTime fromDate);
    
    // Count trips by vehicle and status for admin vehicle management
    long countByVehicleAndStatusIn(com.logiflow.server.models.Vehicle vehicle, List<String> statuses);
    
    // Find trips by date range for reports
    List<Trip> findByScheduledDepartureBetween(LocalDateTime startDateTime, LocalDateTime endDateTime);
    
    // Find trips by status and date range
    List<Trip> findByStatusAndScheduledDepartureBetween(String status, LocalDateTime startDateTime, LocalDateTime endDateTime);
    
    // Find trips by driver and date range
    @Query("SELECT t FROM Trip t JOIN t.tripAssignments ta " +
            "WHERE ta.driver = :driver " +
            "AND t.scheduledDeparture BETWEEN :startDateTime AND :endDateTime " +
            "ORDER BY t.scheduledDeparture DESC")
    List<Trip> findByDriverAndScheduledDepartureBetween(
            @Param("driver") com.logiflow.server.models.Driver driver, 
            @Param("startDateTime") LocalDateTime startDateTime, 
            @Param("endDateTime") LocalDateTime endDateTime);
}
