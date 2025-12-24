package com.logiflow.server.repositories.order;

import com.logiflow.server.models.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    @Query("SELECT COUNT(o) FROM Order o WHERE o.trip.tripId IN (SELECT t.tripId FROM Trip t JOIN t.tripAssignments ta WHERE ta.driver.driverId = :driverId)")
    int countByDriverTrips(@Param("driverId") Integer driverId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus = :status")
    int countByOrderStatus(@Param("status") Order.OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus = :orderStatus AND o.paymentStatus = :paymentStatus")
    int countByOrderStatusAndPaymentStatus(@Param("orderStatus") Order.OrderStatus orderStatus, @Param("paymentStatus") Order.PaymentStatus paymentStatus);
    
    @Query("SELECT COALESCE(SUM(o.shippingFee), 0) FROM Order o WHERE o.orderStatus = :status")
    java.math.BigDecimal sumShippingFeeByStatus(@Param("status") Order.OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.shippingFee), 0) FROM Order o WHERE o.orderStatus = :status AND o.createdAt >= :startDate AND o.createdAt < :endDate")
    java.math.BigDecimal sumShippingFeeByStatusAndDateRange(@Param("status") Order.OrderStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT o FROM Order o WHERE o.orderStatus = :status AND o.createdAt >= :startDate AND o.createdAt < :endDate")
    List<Order> findByOrderStatusAndDateRange(@Param("status") Order.OrderStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Find by status only
    @Query("SELECT o FROM Order o " +
           "LEFT JOIN FETCH o.trip t " +
           "LEFT JOIN FETCH o.customer c " +
           "LEFT JOIN FETCH o.createdBy " +
           "LEFT JOIN FETCH t.vehicle " +
           "LEFT JOIN FETCH t.tripAssignments ta " +
           "LEFT JOIN FETCH ta.driver " +
           "WHERE o.orderStatus = :status")
    Page<Order> findByOrderStatus(@Param("status") Order.OrderStatus orderStatus, Pageable pageable);

    // Find by date only
    @Query("SELECT o FROM Order o " +
           "LEFT JOIN FETCH o.trip t " +
           "LEFT JOIN FETCH o.customer c " +
           "LEFT JOIN FETCH o.createdBy " +
           "LEFT JOIN FETCH t.vehicle " +
           "LEFT JOIN FETCH t.tripAssignments ta " +
           "LEFT JOIN FETCH ta.driver " +
           "WHERE o.createdAt >= :startDate AND o.createdAt < :endDate")
    Page<Order> findByCreatedAtDate(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);

    // Find by status and date
    @Query("SELECT o FROM Order o " +
           "LEFT JOIN FETCH o.trip t " +
           "LEFT JOIN FETCH o.customer c " +
           "LEFT JOIN FETCH o.createdBy " +
           "LEFT JOIN FETCH t.vehicle " +
           "LEFT JOIN FETCH t.tripAssignments ta " +
           "LEFT JOIN FETCH ta.driver " +
           "WHERE o.orderStatus = :status AND o.createdAt >= :startDate AND o.createdAt < :endDate")
    Page<Order> findByOrderStatusAndCreatedAtDate(@Param("status") Order.OrderStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);

    // Find by status without relations (for admin payment review to avoid collection fetch warnings)
    @Query("SELECT o FROM Order o WHERE o.orderStatus = :status")
    Page<Order> findByOrderStatusWithoutRelations(@Param("status") Order.OrderStatus orderStatus, Pageable pageable);

    // Find by status and date without relations
    @Query("SELECT o FROM Order o WHERE o.orderStatus = :status AND o.createdAt >= :startDate AND o.createdAt < :endDate")
    Page<Order> findByOrderStatusAndCreatedAtDateWithoutRelations(@Param("status") Order.OrderStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);

    @Query("SELECT o FROM Order o " +
           "LEFT JOIN FETCH o.trip t " +
           "LEFT JOIN FETCH o.customer c " +
           "LEFT JOIN FETCH o.createdBy " +
           "LEFT JOIN FETCH t.vehicle " +
           "LEFT JOIN FETCH t.tripAssignments ta " +
           "LEFT JOIN FETCH ta.driver")
    Page<Order> findAllWithRelations(Pageable pageable);

    // Find by ID with relations
    @Query("SELECT o FROM Order o " +
           "LEFT JOIN FETCH o.trip t " +
           "LEFT JOIN FETCH o.customer c " +
           "LEFT JOIN FETCH o.createdBy " +
           "LEFT JOIN FETCH t.vehicle " +
           "LEFT JOIN FETCH t.tripAssignments ta " +
           "LEFT JOIN FETCH ta.driver " +
           "WHERE o.orderId = :id")
    Optional<Order> findByIdWithRelations(@Param("id") Integer id);

    // Find by order IDs with relations (for trip creation)
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.trip LEFT JOIN FETCH o.createdBy WHERE o.orderId IN :orderIds")
    List<Order> findByIdsWithRelations(@Param("orderIds") List<Integer> orderIds);

    // Customer-specific queries
    @Query("SELECT o FROM Order o WHERE o.customer.userId = :customerId ORDER BY o.createdAt DESC")
    List<Order> findByCustomerId(@Param("customerId") Integer customerId);

    @Query("SELECT o FROM Order o WHERE o.customer.userId = :customerId AND o.orderId = :orderId")
    Optional<Order> findByCustomerIdAndOrderId(@Param("customerId") Integer customerId, @Param("orderId") Integer orderId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.customer.userId = :customerId")
    int countByCustomerId(@Param("customerId") Integer customerId);
}
