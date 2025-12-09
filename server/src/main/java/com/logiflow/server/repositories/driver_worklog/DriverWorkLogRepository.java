package com.logiflow.server.repositories.driver_worklog;

import com.logiflow.server.models.DriverWorkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface DriverWorkLogRepository extends JpaRepository<DriverWorkLog, Integer> {

    @Query("SELECT COALESCE(SUM(dwl.hoursWorked), 0) FROM DriverWorkLog dwl WHERE dwl.driver.driverId = :driverId")
    BigDecimal sumHoursWorkedByDriverId(@Param("driverId") Integer driverId);

    @Query("SELECT MAX(dwl.nextAvailableTime) FROM DriverWorkLog dwl WHERE dwl.driver.driverId = :driverId")
    LocalDateTime findLatestNextAvailableTimeByDriverId(@Param("driverId") Integer driverId);

    Long countByDriver_DriverId(Integer driverId);
}
