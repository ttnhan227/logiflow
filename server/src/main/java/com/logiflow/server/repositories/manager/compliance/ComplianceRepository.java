//package com.logiflow.server.repositories.manager.compliance;
//
//import com.logiflow.server.models.DriverWorkLog;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//
//import java.time.LocalDateTime;
//import java.util.List;
//
//public interface ComplianceRepository extends JpaRepository<DriverWorkLog, Integer> {
//
//    @Query("""
//                SELECT l FROM DriverWorkLog l
//                WHERE l.endTime IS NOT NULL AND l.endTime > :since
//            """)
//    List<DriverWorkLog> findLogsEndedAfter(@Param("since") LocalDateTime since);
//
//    @Query("""
//                SELECT l FROM DriverWorkLog l
//                WHERE l.driver.driverId = :driverId
//                  AND l.endTime IS NOT NULL AND l.endTime > :since
//                ORDER BY l.endTime DESC
//            """)
//    List<DriverWorkLog> findDriverLogsAfter(@Param("driverId") Integer driverId,
//                                            @Param("since") LocalDateTime since);
//}
