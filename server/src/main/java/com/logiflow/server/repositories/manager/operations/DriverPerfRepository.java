package com.logiflow.server.repositories.manager.operations;

import com.logiflow.server.models.TripAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DriverPerfRepository extends JpaRepository<TripAssignment, Integer> {

    @Query("SELECT COUNT(ta) FROM TripAssignment ta WHERE ta.driver.driverId = :driverId")
    long countAssignments(@Param("driverId") Integer driverId);

    @Query("SELECT COUNT(ta) FROM TripAssignment ta WHERE ta.driver.driverId = :driverId AND ta.status = 'completed'")
    long countCompleted(@Param("driverId") Integer driverId);
}
