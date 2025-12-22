package com.logiflow.server.controllers.payment;

import com.logiflow.server.services.payment.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;

    /**
     * Create PayPal payment order
     */
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createPayPalOrder(@RequestBody Map<String, Object> request) {
        try {
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            String description = request.get("description").toString();
            Integer orderId = Integer.parseInt(request.get("orderId").toString());

            Map<String, Object> paypalOrder = paymentService.createPayPalOrder(amount, description, orderId);
            return ResponseEntity.ok(paypalOrder);
        } catch (Exception e) {
            logger.error("Failed to create PayPal order for amount {} with description '{}' and orderId {}: {}", request.get("amount"), request.get("description"), request.get("orderId"), e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Payment order creation failed",
                "message", "Unable to create payment order. Please try again later."
            ));
        }
    }

    /**
     * PayPal return URL handler - redirects to React frontend
     */
    @GetMapping("/return")
    public String paymentReturn(
            @RequestParam String token,
            @RequestParam(required = false) Integer orderId) {
        logger.info("PayPal return received - token: {}, orderId: {}", token, orderId);

        try {
            // If orderId is provided directly, use it
            if (orderId != null) {
                logger.info("Processing payment capture for order {} with PayPal token {}", orderId, token);
                paymentService.processPaymentCapture(token, orderId);
                logger.info("Payment capture completed successfully for order {}", orderId);

                // Redirect to success page with order ID
                return "redirect:http://localhost:5173/payment/success?orderId=" + orderId;
            } else {
                // Try to find orderId by PayPal token (order ID)
                logger.info("Looking up order by PayPal token: {}", token);
                Integer foundOrderId = paymentService.findOrderIdByPaypalOrderId(token);

                if (foundOrderId != null) {
                    logger.info("Found order {} for PayPal token {}", foundOrderId, token);
                    paymentService.processPaymentCapture(token, foundOrderId);
                    logger.info("Payment capture completed successfully for order {}", foundOrderId);

                    // Redirect to success page with order ID
                    return "redirect:http://localhost:5173/payment/success?orderId=" + foundOrderId;
                } else {
                    logger.error("PayPal return received but no payment record found for token: {}", token);
                    // No order found, redirect to error page
                    return "redirect:http://localhost:5173/payment/error?error=no_payment_record";
                }
            }
        } catch (Exception e) {
            logger.error("Failed to process PayPal return for token {} and order {}: {}", token, orderId, e.getMessage(), e);
            // Redirect to error page
            return "redirect:http://localhost:5173/payment/error?error=payment_failed";
        }
    }

    /**
     * Get payment status
     */
    @GetMapping("/status/{paypalOrderId}")
    public ResponseEntity<Map<String, Object>> getPaymentStatus(@PathVariable String paypalOrderId) {
        try {
            Map<String, Object> status = paymentService.getPaymentStatus(paypalOrderId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("Failed to get payment status for PayPal order {}: {}", paypalOrderId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Payment status retrieval failed",
                "message", "Unable to retrieve payment status. Please try again later."
            ));
        }
    }

    /**
     * Send payment request email
     */
    @PostMapping("/send-request/{orderId}")
    public ResponseEntity<Map<String, String>> sendPaymentRequest(@PathVariable Integer orderId) {
        try {
            paymentService.sendPaymentRequest(orderId);
            return ResponseEntity.ok(Map.of("message", "Payment request sent successfully"));
        } catch (Exception e) {
            logger.error("Failed to send payment request for order {}: {}", orderId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Payment request failed",
                "message", "Unable to send payment request. Please try again later."
            ));
        }
    }

    /**
     * Send payment reminder
     */
    @PostMapping("/send-reminder/{orderId}")
    public ResponseEntity<Map<String, String>> sendPaymentReminder(@PathVariable Integer orderId) {
        try {
            paymentService.sendPaymentReminder(orderId);
            return ResponseEntity.ok(Map.of("message", "Payment reminder sent successfully"));
        } catch (Exception e) {
            logger.error("Failed to send payment reminder for order {}: {}", orderId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Payment reminder failed",
                "message", "Unable to send payment reminder. Please try again later."
            ));
        }
    }



    /**
     * PayPal cancel URL handler - redirects to React frontend
     */
    @GetMapping("/cancel")
    public String paymentCancel(
            @RequestParam String token,
            @RequestParam(required = false) Integer orderId) {
        // Redirect to cancelled page
        if (orderId != null) {
            return "redirect:http://localhost:5173/payment/cancelled?orderId=" + orderId;
        } else {
            return "redirect:http://localhost:5173/payment/cancelled";
        }
    }
}
