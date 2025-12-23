package com.logiflow.server.controllers.customer;

import com.logiflow.server.services.payment.PaymentService;
import com.logiflow.server.models.Order;
import com.logiflow.server.repositories.order.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderRepository orderRepository;

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
     * PayPal return URL handler - serves success page directly from backend
     */
    @GetMapping(value = "/return", produces = "text/html")
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

                // Return success HTML page
                return generateSuccessHtml(orderId);
            } else {
                // Try to find orderId by PayPal token (order ID)
                logger.info("Looking up order by PayPal token: {}", token);
                Integer foundOrderId = paymentService.findOrderIdByPaypalOrderId(token);

                if (foundOrderId != null) {
                    logger.info("Found order {} for PayPal token {}", foundOrderId, token);
                    paymentService.processPaymentCapture(token, foundOrderId);
                    logger.info("Payment capture completed successfully for order {}", foundOrderId);

                    // Return success HTML page
                    return generateSuccessHtml(foundOrderId);
                } else {
                    logger.error("PayPal return received but no payment record found for token: {}", token);
                    // Return error HTML page
                    return generateErrorHtml("No payment record found for this transaction.");
                }
            }
        } catch (Exception e) {
            logger.error("Failed to process PayPal return for token {} and order {}: {}", token, orderId, e.getMessage(), e);
            // Return error HTML page
            return generateErrorHtml("Payment processing failed. Please contact support.");
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
     * PayPal cancel URL handler - serves cancel page directly from backend
     */
    @GetMapping(value = "/cancel", produces = "text/html")
    public String paymentCancel(
            @RequestParam String token,
            @RequestParam(required = false) Integer orderId) {
        return generateCancelHtml();
    }

    /**
     * Generate success HTML page
     */
    private String generateSuccessHtml(Integer orderId) {
        try {
            // Get real order data
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            String orderDetails;

            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                String customerName = order.getCustomer() != null ? order.getCustomer().getFullName() : "Customer";
                String shippingFee = order.getShippingFee() != null ? "VND " + String.format("%,.0f", order.getShippingFee()) : "N/A";
                String pickupAddress = order.getPickupAddress() != null ? order.getPickupAddress() : "N/A";
                String deliveryAddress = order.getDeliveryAddress() != null ? order.getDeliveryAddress() : "N/A";
                String packageDetails = order.getPackageDetails() != null ? order.getPackageDetails() : "N/A";
                String weight = order.getWeightTons() != null ? order.getWeightTons() + " tons" : "N/A";
                String distance = order.getDistanceKm() != null ? order.getDistanceKm() + " km" : "N/A";

                orderDetails = "<div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>" +
                    "<h3 style='margin: 0 0 15px 0; color: #374151;'>Order Details</h3>" +
                    "<div style='display: grid; grid-template-columns: 1fr 1fr; gap: 10px;'>" +
                    "<p style='margin: 5px 0;'><strong>Order ID:</strong> #" + orderId + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Customer:</strong> " + customerName + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Status:</strong> <span style='color: #10b981; font-weight: bold;'>Payment Completed</span></p>" +
                    "<p style='margin: 5px 0;'><strong>Amount Paid:</strong> " + shippingFee + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Pickup:</strong> " + pickupAddress + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Delivery:</strong> " + deliveryAddress + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Package:</strong> " + packageDetails + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Weight:</strong> " + weight + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Distance:</strong> " + distance + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Payment Date:</strong> " + java.time.LocalDate.now() + "</p>" +
                    "<p style='margin: 5px 0;'><strong>Confirmation:</strong> <span style='color: #059669; font-weight: bold;'>Transaction Processed</span></p>" +
                    "</div>" +
                    "</div>";
            } else {
                orderDetails = "<div style='background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;'>" +
                    "<p style='margin: 0; color: #1976d2;'>Order #" + orderId + " payment processed successfully!</p>" +
                    "</div>";
            }

            return "<!DOCTYPE html>" +
                "<html lang='en'>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<title>Payment Successful - LogiFlow</title>" +
                "<style>" +
                "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }" +
                ".container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }" +
                ".header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }" +
                ".success-icon { font-size: 72px; margin-bottom: 20px; }" +
                ".header h1 { margin: 0 0 10px 0; font-size: 32px; font-weight: 700; }" +
                ".header p { margin: 0; font-size: 18px; opacity: 0.9; }" +
                ".content { padding: 40px 30px; }" +
                ".message { text-align: center; margin-bottom: 30px; }" +
                ".message h2 { color: #374151; margin: 0 0 15px 0; font-size: 24px; }" +
                ".message p { color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0; }" +
                ".actions { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 40px; }" +
                ".btn { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.3s ease; text-align: center; min-width: 160px; }" +
                ".btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }" +
                ".btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3); }" +
                ".btn-secondary { background: #f3f4f6; color: #374151; border: 2px solid #e5e7eb; }" +
                ".btn-secondary:hover { background: #e5e7eb; }" +
                ".footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }" +
                ".footer p { margin: 0; color: #6b7280; font-size: 14px; }" +
                ".footer a { color: #667eea; text-decoration: none; }" +
                ".footer a:hover { text-decoration: underline; }" +
                "@media (max-width: 640px) { .actions { flex-direction: column; align-items: center; } .btn { width: 100%; max-width: 300px; } }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<div class='success-icon'>🎉</div>" +
                "<h1>Payment Successful!</h1>" +
                "<p>Your transaction has been completed</p>" +
                "</div>" +
                "<div class='content'>" +
                "<div class='message'>" +
                "<h2>Thank You for Your Payment</h2>" +
                "<p>Your payment has been successfully processed. Your order is now being prepared for delivery.</p>" +
                "<p>Please check your email for the invoice and order confirmation details.</p>" +
                "</div>" +
                orderDetails +
                "<div class='actions'>" +
                "<a href='http://localhost:5173/track' class='btn btn-primary'>Go back to LogiFlow</a>" +
                "</div>" +
                "</div>" +
                "<div class='footer'>" +
                "<p>Need help? <a href='mailto:support@logiflow.com'>Contact Support</a></p>" +
                "<p>&copy; 2024 LogiFlow Logistics. All rights reserved.</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
        } catch (Exception e) {
            logger.error("Failed to generate success HTML for order {}: {}", orderId, e.getMessage());
            return generateErrorHtml("Payment was successful but we couldn't display the confirmation page.");
        }
    }

    /**
     * Generate error HTML page
     */
    private String generateErrorHtml(String errorMessage) {
        return "<!DOCTYPE html>" +
            "<html lang='en'>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
            "<title>Payment Issue - LogiFlow</title>" +
            "<style>" +
            "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }" +
            ".container { max-width: 500px; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }" +
            ".header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }" +
            ".warning-icon { font-size: 64px; margin-bottom: 20px; }" +
            ".header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 700; }" +
            ".header p { margin: 0; font-size: 16px; opacity: 0.9; }" +
            ".content { padding: 40px 30px; text-align: center; }" +
            ".error-details { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px; }" +
            ".error-details p { margin: 0; color: #92400e; font-weight: 500; }" +
            ".description { color: #6b7280; line-height: 1.6; margin-bottom: 30px; }" +
            ".help-text { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin-bottom: 20px; }" +
            ".help-text p { margin: 0; color: #0c4a6e; font-size: 14px; }" +
            ".actions { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }" +
            ".btn { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.3s ease; text-align: center; min-width: 160px; }" +
            ".btn-primary { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }" +
            ".btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3); }" +
            ".btn-secondary { background: #f3f4f6; color: #374151; border: 2px solid #e5e7eb; }" +
            ".btn-secondary:hover { background: #e5e7eb; }" +
            ".footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }" +
            ".footer p { margin: 0; color: #6b7280; font-size: 12px; }" +
            "@media (max-width: 640px) { .actions { flex-direction: column; align-items: center; } .btn { width: 100%; max-width: 280px; } }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<div class='warning-icon'>⚠️</div>" +
            "<h1>Payment Issue</h1>" +
            "<p>We couldn't process your payment</p>" +
            "</div>" +
            "<div class='content'>" +
            "<div class='error-details'>" +
            "<p>" + errorMessage + "</p>" +
            "</div>" +
            "<div class='description'>" +
            "<p>This usually happens when the payment session has expired or there was an issue with the transaction.</p>" +
            "</div>" +
            "<div class='help-text'>" +
            "<p><strong>What you can do:</strong></p>" +
            "<ul style='text-align: left; margin: 10px 0 0 0; padding-left: 20px;'>" +
            "<li>Go back to your orders and try paying again</li>" +
            "<li>Contact support if the issue persists</li>" +
            "</ul>" +
            "</div>" +
            "<div class='actions'>" +
            "<a href='http://localhost:5173' class='btn btn-primary'>Back to Home</a>" +
            "<a href='mailto:support@logiflow.com' class='btn btn-secondary'>Contact Support</a>" +
            "</div>" +
            "</div>" +
            "<div class='footer'>" +
            "<p>Need help? Our support team is here to assist you.</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>";
    }

    /**
     * Generate cancel HTML page
     */
    private String generateCancelHtml() {
        return "<!DOCTYPE html>" +
            "<html lang='en'>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
            "<title>Payment Cancelled - LogiFlow</title>" +
            "<style>" +
            "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }" +
            ".container { max-width: 500px; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }" +
            ".header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }" +
            ".cancel-icon { font-size: 64px; margin-bottom: 20px; }" +
            ".header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 700; }" +
            ".content { padding: 40px 30px; text-align: center; }" +
            ".description { color: #6b7280; line-height: 1.6; margin-bottom: 30px; }" +
            ".actions { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }" +
            ".btn { display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.3s ease; }" +
            ".btn-primary { background: #f59e0b; color: white; }" +
            ".btn-primary:hover { background: #d97706; }" +
            ".btn-secondary { background: #f3f4f6; color: #374151; }" +
            ".btn-secondary:hover { background: #e5e7eb; }" +
            "@media (max-width: 640px) { .actions { flex-direction: column; align-items: center; } .btn { width: 100%; max-width: 250px; text-align: center; } }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<div class='cancel-icon'>🚫</div>" +
            "<h1>Payment Cancelled</h1>" +
            "</div>" +
            "<div class='content'>" +
            "<div class='description'>" +
            "<p>You have cancelled the payment process. No charges have been made to your account.</p>" +
            "<p>You can try again whenever you're ready.</p>" +
            "</div>" +
            "<div class='actions'>" +
            "<a href='http://localhost:5173/customer/orders' class='btn btn-primary'>Back to Orders</a>" +
            "<a href='http://localhost:5173' class='btn btn-secondary'>Continue Shopping</a>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>";
    }
}
