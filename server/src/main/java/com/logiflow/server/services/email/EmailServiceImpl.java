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
import java.util.Map;
import org.springframework.web.util.HtmlUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

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
            Integer orderId, BigDecimal amount, String transactionId, Map<String, Object> orderDetails) {
        try {
            String subject = "Payment Confirmation & Receipt - Order #" + orderId;
            String htmlContent = buildPaymentConfirmationEmail(customerName, orderId, amount, transactionId, orderDetails);
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
            BigDecimal amount, String transactionId, Map<String, Object> orderDetails) {
        // Escape HTML content to prevent XSS
        String escapedCustomerName = HtmlUtils.htmlEscape(customerName != null ? customerName : "Valued Customer");
        String escapedTransactionId = HtmlUtils.htmlEscape(transactionId != null ? transactionId : "N/A");

        // Extract order details with safe fallbacks
        String pickupAddress = HtmlUtils.htmlEscape(orderDetails.getOrDefault("pickupAddress", "N/A").toString());
        String deliveryAddress = HtmlUtils.htmlEscape(orderDetails.getOrDefault("deliveryAddress", "N/A").toString());
        String packageDetails = orderDetails.containsKey("packageDetails") && orderDetails.get("packageDetails") != null
            ? HtmlUtils.htmlEscape(orderDetails.get("packageDetails").toString()) : "N/A";
        String weightInfo = orderDetails.containsKey("weightTons") && orderDetails.get("weightTons") != null
            ? orderDetails.get("weightTons").toString() + " tons" : "N/A";
        String driverName = orderDetails.containsKey("driverName") && orderDetails.get("driverName") != null
            ? HtmlUtils.htmlEscape(orderDetails.get("driverName").toString()) : null;
        String vehiclePlate = orderDetails.containsKey("vehiclePlate") && orderDetails.get("vehiclePlate") != null
            ? HtmlUtils.htmlEscape(orderDetails.get("vehiclePlate").toString()) : null;

        // Format VND amount with USD equivalent for display
        String vndAmount = String.format("%,.0f", amount);
        BigDecimal usdAmount = amount.divide(new BigDecimal("23000"), 2, java.math.RoundingMode.HALF_UP);
        String usdFormatted = String.format("%.2f", usdAmount);

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<title>Payment Confirmation & Receipt</title>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }" +
                ".container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }" +
                ".header { text-align: center; margin-bottom: 30px; }" +
                ".logo { font-size: 24px; font-weight: bold; color: #2c3e50; }" +
                ".receipt-header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }" +
                ".section { margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }" +
                ".section-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 15px; }" +
                ".info-row { margin: 8px 0; }" +
                ".label { font-weight: bold; color: #555; }" +
                ".value { color: #333; }" +
                ".amount-highlight { font-size: 20px; font-weight: bold; color: #27ae60; }" +
                ".success-badge { background-color: #d4edda; color: #155724; padding: 8px 12px; border-radius: 20px; display: inline-block; margin: 10px 0; }" +
                ".footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 12px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<div class='logo'>LogiFlow</div>" +
                "</div>" +

                "<div class='receipt-header'>" +
                "<h1 style='margin: 0; color: #2c3e50;'>PAYMENT RECEIPT</h1>" +
                "<h2 style='margin: 5px 0; color: #27ae60;'>Order #" + orderId + "</h2>" +
                "<p style='margin: 10px 0; color: #666;'>Payment processed successfully</p>" +
                "</div>" +

                "<div class='section'>" +
                "<div class='section-title'>Customer Information</div>" +
                "<div class='info-row'><span class='label'>Name:</span> <span class='value'>" + escapedCustomerName + "</span></div>" +
                "</div>" +

                "<div class='section'>" +
                "<div class='section-title'>Order Details</div>" +
                "<div class='info-row'><span class='label'>From:</span> <span class='value'>" + pickupAddress + "</span></div>" +
                "<div class='info-row'><span class='label'>To:</span> <span class='value'>" + deliveryAddress + "</span></div>" +
                "<div class='info-row'><span class='label'>Package:</span> <span class='value'>" + packageDetails + "</span></div>" +
                "<div class='info-row'><span class='label'>Weight:</span> <span class='value'>" + weightInfo + "</span></div>" +
                "</div>" +

                "<div class='section'>" +
                "<div class='section-title'>Payment Information</div>" +
                "<div class='info-row'><span class='label'>Amount Paid:</span> <span class='amount-highlight'>VND " + vndAmount + " (USD $" + usdFormatted + ")</span></div>" +
                "<div class='info-row'><span class='label'>Transaction ID:</span> <span class='value'>" + escapedTransactionId + "</span></div>" +
                "<div class='info-row'><span class='label'>Payment Date:</span> <span class='value'>" + LocalDate.now() + "</span></div>" +
                "<div style='text-align: center; margin-top: 15px;'><span class='success-badge'>✓ Payment Completed Successfully</span></div>" +
                "</div>" +

                (driverName != null || vehiclePlate != null ? "<div class='section'>" +
                "<div class='section-title'>Delivery Information</div>" +
                (driverName != null ? "<div class='info-row'><span class='label'>Driver:</span> <span class='value'>" + driverName + "</span></div>" : "") +
                (vehiclePlate != null ? "<div class='info-row'><span class='label'>Vehicle:</span> <span class='value'>" + vehiclePlate + "</span></div>" : "") +
                "</div>" : "") +

                "<div style='margin: 30px 0; padding: 20px; background-color: #e8f5e8; border-left: 4px solid #27ae60; border-radius: 4px;'>" +
                "<h3 style='margin: 0 0 10px 0; color: #27ae60;'>Thank you for your payment!</h3>" +
                "<p style='margin: 0 0 15px 0; color: #2c3e50;'>Your order is now being processed and will be delivered according to the scheduled timeline. You will receive updates on your order status.</p>" +
                "<div style='text-align: center; margin-top: 20px;'>" +
                "<a href='http://localhost:5173/track' style='display: inline-block; padding: 12px 24px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;'>Track Your Order</a>" +
                "<a href='http://localhost:8080/api/orders/" + orderId + "/invoice/download' style='display: inline-block; padding: 12px 24px; background-color: #3498db; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;'>Download Invoice</a>" +
                "</div>" +
                "</div>" +

                "<div class='footer'>" +
                "<p>This receipt was generated by LogiFlow Logistics Management System</p>" +
                "<p>© 2024 LogiFlow. All rights reserved.</p>" +
                "<p>If you have any questions about this payment or your order, please don't hesitate to contact our support team.</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    private String buildPaymentRequestEmail(String customerName, Integer orderId,
            BigDecimal amount, String paypalPaymentLink) {
        // Escape HTML content to prevent XSS
        String escapedCustomerName = HtmlUtils.htmlEscape(customerName != null ? customerName : "Valued Customer");

        // Format VND amount with USD equivalent
        String vndAmount = String.format("%,.0f", amount);
        BigDecimal usdAmount = amount.divide(new BigDecimal("23000"), 2, java.math.RoundingMode.HALF_UP);
        String usdFormatted = String.format("%.2f", usdAmount);

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
                ".amount-secondary { font-size: 16px; color: #6b7280; font-weight: normal; }" +
                ".footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 12px; }" +
                ".button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white !important; text-decoration: none; border-radius: 5px; margin: 10px 0; }" +
                ".button:hover { background-color: #2563eb; color: white !important; }" +
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
                "<p><strong>Amount Due:</strong> <span class='amount'>VND " + vndAmount + "</span> <span class='amount-secondary'>($" + usdFormatted + ")</span></p>" +
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
     * Send registration approval email with login credentials
     */
    public void sendRegistrationApprovalEmail(String to, String fullName, String username, String tempPassword, String roleName) {
        try {
            String subject = "Welcome to LogiFlow - Your Account Has Been Approved";
            String htmlContent = buildRegistrationApprovalEmail(fullName, username, tempPassword, roleName);
            sendHtmlEmail(to, subject, htmlContent);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send registration approval email", e);
        }
    }

    private String buildRegistrationApprovalEmail(String fullName, String username, String tempPassword, String roleName) {
        // Escape HTML content to prevent XSS
        String escapedFullName = HtmlUtils.htmlEscape(fullName != null ? fullName : "Valued User");
        String escapedUsername = HtmlUtils.htmlEscape(username);
        String escapedTempPassword = HtmlUtils.htmlEscape(tempPassword);
        String escapedRoleName = HtmlUtils.htmlEscape(roleName != null ? roleName : "USER");

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<title>Welcome to LogiFlow</title>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }" +
                ".container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }" +
                ".header { text-align: center; margin-bottom: 30px; }" +
                ".logo { font-size: 24px; font-weight: bold; color: #2c3e50; }" +
                ".welcome-section { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }" +
                ".credentials-section { background-color: #f0f9ff; padding: 20px; border-radius: 8px; border: 1px solid #0ea5e9; margin: 20px 0; }" +
                ".credential-item { display: flex; justify-content: space-between; align-items: center; margin: 10px 0; }" +
                ".credential-label { font-weight: bold; color: #374151; }" +
                ".credential-value { background-color: #e0f2fe; padding: 6px 12px; border-radius: 4px; font-family: monospace; color: #0369a1; font-size: 14px; }" +
                ".warning-box { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0; }" +
                ".warning-box h4 { margin: 0 0 8px 0; color: #92400e; }" +
                ".warning-box p { margin: 0; color: #92400e; font-size: 14px; }" +
                ".steps-section { background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #22c55e; margin: 20px 0; }" +
                ".steps-section h3 { margin: 0 0 16px 0; color: #15803d; }" +
                ".steps-list { list-style: none; padding: 0; margin: 0; }" +
                ".steps-list li { margin: 8px 0; padding-left: 20px; position: relative; color: #374151; }" +
                ".steps-list li:before { content: '✓'; position: absolute; left: 0; color: #22c55e; font-weight: bold; }" +
                ".footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 12px; }" +
                ".button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white !important; text-decoration: none; border-radius: 5px; margin: 10px 0; }" +
                ".button:hover { background-color: #2563eb; color: white !important; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<div class='logo'>LogiFlow</div>" +
                "<h1 style='margin: 10px 0; color: #27ae60;'>Welcome to LogiFlow!</h1>" +
                "</div>" +

                "<div class='welcome-section'>" +
                "<h2 style='margin: 0 0 10px 0; color: #2c3e50;'>🎉 Your Account Has Been Approved</h2>" +
                "<p style='margin: 0; color: #666;'>Dear " + escapedFullName + ", your registration as a " + escapedRoleName + " has been approved. Welcome to the LogiFlow Logistics Management System!</p>" +
                "</div>" +

                "<div class='credentials-section'>" +
                "<h3 style='margin: 0 0 20px 0; color: #0c4a6e;'>🔐 Your Login Credentials</h3>" +

                "<div class='credential-item'>" +
                "<span class='credential-label'>Username:</span>" +
                "<span class='credential-value'>" + escapedUsername + "</span>" +
                "</div>" +

                "<div class='credential-item'>" +
                "<span class='credential-label'>Temporary Password:</span>" +
                "<span class='credential-value'>" + escapedTempPassword + "</span>" +
                "</div>" +
                "</div>" +

                "<div class='warning-box'>" +
                "<h4>⚠️ Important Security Notice</h4>" +
                "<p><strong>Please change your password immediately after your first login.</strong> This temporary password is for initial access only and should not be shared with anyone.</p>" +
                "</div>" +

                "<div class='steps-section'>" +
                "<h3>🚀 Getting Started</h3>" +
                "<ol class='steps-list'>" +
                "<li>Visit <a href='http://localhost:5173/login' style='color: #3b82f6; text-decoration: underline;'>LogiFlow Login Page</a></li>" +
                "<li>Enter your username and temporary password</li>" +
                "<li>Complete your profile information</li>" +
                "<li>Change your password to something secure</li>" +
                "<li>Start using LogiFlow for your logistics needs</li>" +
                "</ol>" +
                "</div>" +

                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='http://localhost:5173/login' class='button'>🔑 Login to Your Account</a>" +
                "</div>" +

                "<div style='margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #27ae60;'>" +
                "<h3 style='margin: 0 0 10px 0; color: #27ae60;'>Need Help?</h3>" +
                "<p style='margin: 0 0 15px 0; color: #2c3e50;'>If you have any questions about using LogiFlow or need assistance, don't hesitate to contact our support team.</p>" +
                "<p style='margin: 0; color: #6b7280; font-size: 14px;'>📧 Support Email: support@logiflow.com<br>📞 Support Phone: +1 (555) 123-4567</p>" +
                "</div>" +

                "<div class='footer'>" +
                "<p>This email was sent by LogiFlow Logistics Management System</p>" +
                "<p>© 2024 LogiFlow. All rights reserved.</p>" +
                "<p>If you did not request this account or believe this email was sent in error, please contact our support team immediately.</p>" +
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
