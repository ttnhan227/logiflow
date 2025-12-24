package com.logiflow.server.repositories.payment;

import com.logiflow.server.models.Order;
import com.logiflow.server.models.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /**
     * Find payments by order
     */
    List<Payment> findByOrder(Order order);

    /**
     * Find payment by order and PayPal order ID
     */
    Optional<Payment> findByOrderAndPaypalOrderId(Order order, String paypalOrderId);

    /**
     * Find payment by PayPal order ID
     */
    Optional<Payment> findByPaypalOrderId(String paypalOrderId);

    /**
     * Find successful payments for an order
     */
    List<Payment> findByOrderAndPaymentStatus(Order order, Payment.PaymentStatus status);

    /**
     * Get total paid amount for an order
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order = :order AND p.paymentStatus = 'PAID'")
    BigDecimal getTotalPaidAmountForOrder(@Param("order") Order order);

    /**
     * Find payments within date range
     */
    List<Payment> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Find failed payments for retry
     */
    List<Payment> findByPaymentStatusAndCreatedAtBefore(Payment.PaymentStatus status, LocalDateTime before);

    /**
     * Calculate total revenue in date range
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentStatus = 'PAID' AND p.createdAt >= :startDate AND p.createdAt < :endDate")
    BigDecimal getTotalRevenueInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Calculate total revenue for completed trips in date range
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p JOIN p.order o JOIN o.trip t WHERE p.paymentStatus = 'PAID' AND t.status = 'completed' AND p.createdAt >= :startDate AND p.createdAt < :endDate")
    BigDecimal getRevenueFromCompletedTrips(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
