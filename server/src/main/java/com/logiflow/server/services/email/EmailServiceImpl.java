package com.logiflow.server.services.email;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.web.util.HtmlUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send simple text email
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        message.setFrom("LogiFlow <" + fromEmail + ">");

        mailSender.send(message);
    }

    /**
     * Send HTML email
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        helper.setFrom("LogiFlow <" + fromEmail + ">");

        mailSender.send(message);
    }

    /**
     * Send payment confirmation email
     */
    public void sendPaymentConfirmationEmail(String to, String customerName,
            Integer orderId, BigDecimal amount, String transactionId) {
        try {
            String subject = "Payment Confirmation - Order #" + orderId;
            String htmlContent = buildPaymentConfirmationEmail(customerName, orderId, amount, transactionId);
            sendHtmlEmail(to, subject, htmlContent);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send payment confirmation email", e);
        }
    }

    /**
     * Send payment request email with PayPal link
     */
    public void sendPaymentRequestEmail(String to, String customerName,
            Integer orderId, BigDecimal amount, String paypalPaymentLink) {
        try {
            String subject = "Payment Request - Order #" + orderId;
            String htmlContent = buildPaymentRequestEmail(customerName, orderId, amount, paypalPaymentLink);
            sendHtmlEmail(to, subject, htmlContent);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send payment request email", e);
        }
    }

    private String buildPaymentConfirmationEmail(String customerName, Integer orderId,
            BigDecimal amount, String transactionId) {
        // Escape HTML content to prevent XSS
        String escapedCustomerName = HtmlUtils.htmlEscape(customerName != null ? customerName : "Valued Customer");
        String escapedTransactionId = HtmlUtils.htmlEscape(transactionId != null ? transactionId : "N/A");

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<title>Payment Confirmation</title>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }" +
                ".container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }" +
                ".header { text-align: center; margin-bottom: 30px; }" +
                ".logo { font-size: 24px; font-weight: bold; color: #2c3e50; }" +
                ".payment-info { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }" +
                ".amount { font-size: 24px; font-weight: bold; color: #27ae60; }" +
                ".footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 12px; }" +
                ".button { display: inline-block; padding: 12px 24px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<div class='logo'>LogiFlow</div>" +
                "<h2>Payment Confirmation</h2>" +
                "</div>" +
                "<p>Dear " + escapedCustomerName + ",</p>" +
                "<p>We're pleased to confirm that your payment has been successfully processed.</p>" +
                "<div class='payment-info'>" +
                "<h3>Payment Details</h3>" +
                "<p><strong>Order ID:</strong> #" + orderId + "</p>" +
                "<p><strong>Amount Paid:</strong> <span class='amount'>$" + amount + "</span></p>" +
                "<p><strong>Transaction ID:</strong> " + escapedTransactionId + "</p>" +
                "<p><strong>Date:</strong> " + LocalDate.now() + "</p>" +
                "</div>" +
                "<p>Thank you for choosing LogiFlow for your logistics needs. Your order is now being processed and will be delivered according to the scheduled timeline.</p>" +
                "<p>If you have any questions about this payment or your order, please don't hesitate to contact our support team.</p>" +
                "<div class='footer'>" +
                "<p>This email was sent by LogiFlow Logistics Management System</p>" +
                "<p>© 2024 LogiFlow. All rights reserved.</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    private String buildPaymentRequestEmail(String customerName, Integer orderId,
            BigDecimal amount, String paypalPaymentLink) {
        // Escape HTML content to prevent XSS
        String escapedCustomerName = HtmlUtils.htmlEscape(customerName != null ? customerName : "Valued Customer");

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<title>Payment Request</title>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }" +
                ".container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }" +
                ".header { text-align: center; margin-bottom: 30px; }" +
                ".logo { font-size: 24px; font-weight: bold; color: #2c3e50; }" +
                ".payment-info { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }" +
                ".amount { font-size: 24px; font-weight: bold; color: #e74c3c; }" +
                ".footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 12px; }" +
                ".button { display: inline-block; padding: 12px 24px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }" +
                ".button:hover { background-color: #219a52; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<div class='logo'>LogiFlow</div>" +
                "<h2>Payment Request</h2>" +
                "</div>" +
                "<p>Dear " + escapedCustomerName + ",</p>" +
                "<p>Thank you for choosing LogiFlow! Your order is ready, and we're requesting payment to proceed with the delivery.</p>" +
                "<div class='payment-info'>" +
                "<h3>Payment Details</h3>" +
                "<p><strong>Order ID:</strong> #" + orderId + "</p>" +
                "<p><strong>Amount Due:</strong> <span class='amount'>$" + amount + "</span></p>" +
                "<p><strong>Due Date:</strong> " + LocalDate.now().plusDays(3) + "</p>" +
                "</div>" +
                "<p>To complete your payment securely, please click the button below:</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='" + paypalPaymentLink + "' class='button'>Pay Now with PayPal</a>" +
                "</div>" +
                "<p>This payment link will expire in 24 hours for security reasons. If you need assistance or prefer alternative payment methods, please contact our support team.</p>" +
                "<p>Once your payment is confirmed, we'll immediately proceed with processing and delivering your order according to the scheduled timeline.</p>" +
                "<div class='footer'>" +
                "<p>This email was sent by LogiFlow Logistics Management System</p>" +
                "<p>© 2024 LogiFlow. All rights reserved.</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Send test email for SMTP configuration testing
     */
    public void sendTestEmail(String to, String subject, String message) {
        try {
            sendSimpleEmail(to, subject, message);
            logger.info("Test email sent successfully to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send test email to {}: {}", to, e.getMessage());
            throw new RuntimeException("SMTP configuration test failed: " + e.getMessage(), e);
        }
    }
}
