package com.logiflow.server.services.payment;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentService {
    /**
     * Send payment request email to customer with PayPal link
     */
    void sendPaymentRequest(Integer orderId);

    /**
     * Process PayPal payment capture and send confirmation
     */
    void processPaymentCapture(String paypalOrderId, Integer orderId);

    /**
     * Get payment status from PayPal
     */
    Map<String, Object> getPaymentStatus(String paypalOrderId);

    /**
     * Create PayPal payment order (for frontend integration)
     */
    Map<String, Object> createPayPalOrder(BigDecimal amount, String description);

    /**
     * Create PayPal payment order with order tracking (for frontend integration)
     */
    Map<String, Object> createPayPalOrder(BigDecimal amount, String description, Integer orderId);

    /**
     * Send payment reminder for overdue payments
     */
    void sendPaymentReminder(Integer orderId);

    /**
     * Find order ID by PayPal order ID
     */
    Integer findOrderIdByPaypalOrderId(String paypalOrderId);
}
