package com.logiflow.server.services.email;

import jakarta.mail.MessagingException;
import java.math.BigDecimal;

public interface EmailService {
    /**
     * Send simple text email
     */
    void sendSimpleEmail(String to, String subject, String text);

    /**
     * Send HTML email
     */
    void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException;

    /**
     * Send payment confirmation email
     */
    void sendPaymentConfirmationEmail(String to, String customerName,
            Integer orderId, BigDecimal amount, String transactionId);

    /**
     * Send payment request email with PayPal link
     */
    void sendPaymentRequestEmail(String to, String customerName,
            Integer orderId, BigDecimal amount, String paypalPaymentLink);

    /**
     * Send test email for SMTP configuration testing
     */
    void sendTestEmail(String to, String subject, String message);
}
