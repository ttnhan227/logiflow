package com.logiflow.server.repositories.vehicle;

import com.logiflow.server.models.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
    long countByStatus(String status);
    List<Vehicle> findByStatus(String status);

    /**
     * Count vehicles by age groups for fleet lifecycle analysis
     */
    @Query("SELECT " +
           "SUM(CASE WHEN v.createdAt IS NOT NULL AND (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM v.createdAt)) < 2 THEN 1 ELSE 0 END) as age_0_2, " +
           "SUM(CASE WHEN v.createdAt IS NOT NULL AND (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM v.createdAt)) BETWEEN 2 AND 3 THEN 1 ELSE 0 END) as age_2_4, " +
           "SUM(CASE WHEN v.createdAt IS NOT NULL AND (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM v.createdAt)) >= 4 THEN 1 ELSE 0 END) as age_4_plus " +
           "FROM Vehicle v")
    Object[] countVehiclesByAgeGroups();

    /**
     * Count vehicles by type for fleet lifecycle analysis
     */
    @Query("SELECT COALESCE(v.vehicleType, 'Unknown') as vehicleType, COUNT(v) as count " +
           "FROM Vehicle v " +
           "GROUP BY v.vehicleType")
    List<Object[]> countVehiclesByType();
}
