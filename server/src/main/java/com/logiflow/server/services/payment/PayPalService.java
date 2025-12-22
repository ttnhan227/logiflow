package com.logiflow.server.services.payment;

import java.math.BigDecimal;
import java.util.Map;

public interface PayPalService {
    /**
     * Create PayPal payment order
     */
    Map<String, Object> createPaymentOrder(BigDecimal amount, String currency, String description);

    /**
     * Capture payment for an approved order
     */
    Map<String, Object> capturePayment(String orderId);

    /**
     * Get payment details
     */
    Map<String, Object> getPaymentDetails(String orderId);

    /**
     * Generate PayPal payment link for customer
     */
    String generatePaymentLink(BigDecimal amount, String currency, String description);

    /**
     * Extract transaction ID from captured payment response
     */
    String extractTransactionId(Map<String, Object> captureResponse);
}
