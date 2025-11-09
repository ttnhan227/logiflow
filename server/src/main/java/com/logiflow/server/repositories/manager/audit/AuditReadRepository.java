package com.logiflow.server.repositories.manager.audit;

import com.logiflow.server.models.Order;
import com.logiflow.server.models.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AuditReadRepository extends JpaRepository<Order, Integer> {

    // Recent active users (cần field lastLogin trong User)
    interface UserAuditView {}

    @Query("SELECT u FROM User u WHERE u.lastLogin IS NOT NULL ORDER BY u.lastLogin DESC")
    List<User> findRecentActiveUsers(Pageable pageable);

    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(Pageable pageable);
}
