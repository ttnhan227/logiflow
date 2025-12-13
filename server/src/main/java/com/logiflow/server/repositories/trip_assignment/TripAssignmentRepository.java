package com.logiflow.server.repositories.trip_assignment;

import com.logiflow.server.models.TripAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface TripAssignmentRepository extends JpaRepository<TripAssignment, Integer> {

    @Query("SELECT COUNT(ta) FROM TripAssignment ta WHERE ta.driver.driverId = :driverId")
    Long countByDriverId(@Param("driverId") Integer driverId);

    @Query("SELECT COUNT(ta) FROM TripAssignment ta WHERE ta.driver.driverId = :driverId AND ta.status = 'completed'")
    Long countCompletedByDriverId(@Param("driverId") Integer driverId);

    @Modifying
    @Transactional
    @Query("UPDATE TripAssignment ta SET ta.status = :status WHERE ta.driver.driverId = :driverId AND ta.trip.tripId = :tripId")
    int updateStatusByDriverAndTrip(@Param("driverId") Integer driverId, @Param("tripId") Integer tripId, @Param("status") String status);

    @Query("SELECT COUNT(ta) FROM TripAssignment ta WHERE ta.driver.driverId = :driverId AND ta.status IN ('assigned', 'accepted', 'in_progress')")
    Long countActiveAssignmentsByDriverId(@Param("driverId") Integer driverId);
}
