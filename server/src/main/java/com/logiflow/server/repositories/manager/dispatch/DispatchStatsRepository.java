package com.logiflow.server.repositories.manager.dispatch;

import com.logiflow.server.models.Trip;
import com.logiflow.server.models.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DispatchStatsRepository extends JpaRepository<Trip, Integer> {

    @Query("SELECT COUNT(t) FROM Trip t")
    long countAllTrips();

    @Query("SELECT COUNT(t) FROM Trip t WHERE t.status = 'assigned'")
    long countAssigned();

    @Query("SELECT COUNT(t) FROM Trip t WHERE t.status = 'in_progress'")
    long countInProgress();

    @Query("SELECT COUNT(t) FROM Trip t WHERE t.status = 'completed'")
    long countCompleted();

    // Số đơn chờ điều phối dùng Order (JPA method name ở OrderRepository có sẵn),
    // nếu muốn ở đây:
    interface PendingOrderCounter {
    }
}
