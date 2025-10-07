package com.logiflow.server.repositories.driver_worklog;

import com.logiflow.server.models.DriverWorkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverWorkLogRepository extends JpaRepository<DriverWorkLog, Integer> {
}
