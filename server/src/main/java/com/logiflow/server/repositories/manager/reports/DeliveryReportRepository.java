package com.logiflow.server.repositories.manager.reports;

import com.logiflow.server.models.Order;
import com.logiflow.server.models.Order.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DeliveryReportRepository extends JpaRepository<Order, Integer> {

    @Query("""
        SELECT o FROM Order o
        WHERE (:from IS NULL OR o.createdAt >= :from)
          AND (:to   IS NULL OR o.createdAt <  :to)
          AND (:status IS NULL OR o.orderStatus = :status)
        ORDER BY o.createdAt DESC
    """)
    List<Order> findForReport(@Param("from") LocalDateTime from,
                              @Param("to") LocalDateTime to,
                              @Param("status") OrderStatus status);

    long countByOrderStatus(OrderStatus status);
}
