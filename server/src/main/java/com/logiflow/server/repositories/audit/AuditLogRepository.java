package com.logiflow.server.repositories.audit;

import com.logiflow.server.models.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("SELECT a FROM AuditLog a WHERE (:username IS NULL OR a.username = :username) " +
           "AND (:role IS NULL OR a.role = :role) " +
           "AND (:action IS NULL OR a.action = :action) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> searchLogsBase(@Param("username") String username,
                                  @Param("role") String role,
                                  @Param("action") String action);
}
