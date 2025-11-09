package com.logiflow.server.repositories.trip;

import com.logiflow.server.models.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Integer> {
    @Query("SELECT COUNT(DISTINCT ta.driver.driverId) FROM TripAssignment ta WHERE ta.status IN ('assigned', 'in_progress')")
    int countOnDutyDrivers();
    
    @Query("SELECT DISTINCT t FROM Trip t LEFT JOIN FETCH t.vehicle LEFT JOIN FETCH t.route LEFT JOIN FETCH t.orders o LEFT JOIN FETCH o.createdBy WHERE t.tripId = :id")
    Optional<Trip> findByIdWithRelations(@Param("id") Integer id);
}
