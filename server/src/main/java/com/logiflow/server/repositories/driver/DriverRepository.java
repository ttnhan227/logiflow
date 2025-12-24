package com.logiflow.server.repositories.driver;

import com.logiflow.server.models.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Integer> {

    @Query("SELECT d FROM Driver d LEFT JOIN FETCH d.user WHERE d.user.userId = :userId")
    Optional<Driver> findByUserId(@Param("userId") Integer userId);

    @Query("SELECT d FROM Driver d WHERE LOWER(d.status) = 'available' AND d.healthStatus = com.logiflow.server.models.Driver.HealthStatus.FIT")
    List<Driver> findAvailableDrivers();

    List<Driver> findByStatus(String status);

    @Query("SELECT DISTINCT d FROM Driver d JOIN FETCH d.user ORDER BY d.driverId")
    List<Driver> findAllDriversWithUser();

    /**
     * Calculate average driver rating
     */
    @Query("SELECT AVG(d.rating) FROM Driver d WHERE d.rating IS NOT NULL")
    Double getAverageDriverRating();

    /**
     * Count drivers with valid licenses (not expired)
     */
    @Query("SELECT COUNT(d) FROM Driver d WHERE d.licenseExpiryDate > CURRENT_DATE")
    long countDriversWithValidLicenses();

    /**
     * Count drivers with licenses expiring within next 30 days
     */
    @Query(value = "SELECT COUNT(*) FROM drivers WHERE license_expiry > CURRENT_DATE AND license_expiry <= CURRENT_DATE + INTERVAL '30 days'", nativeQuery = true)
    long countDriversWithExpiringLicenses();

    /**
     * Count drivers with compliance issues (based on health status and license validity)
     */
    @Query("SELECT COUNT(d) FROM Driver d WHERE d.healthStatus != 'FIT' OR d.licenseExpiryDate <= CURRENT_DATE")
    long countDriversWithComplianceIssues();

    /**
     * Count drivers with recent violations (simplified - would need violation tracking table)
     */
    @Query("SELECT COUNT(d) FROM Driver d WHERE d.rating < 3.0")
    long countDriversWithLowRating();
}
