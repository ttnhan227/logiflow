package com.logiflow.server.services.payment;

import com.logiflow.server.models.Order;
import com.logiflow.server.models.Payment;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.payment.PaymentRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.services.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentServiceImpl.class);

    @Autowired
    private PayPalService payPalService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Send payment request email to customer with PayPal link
     */
    @Transactional
    public void sendPaymentRequest(Integer orderId) {
        Order order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getCustomer() == null) {
            throw new RuntimeException("Order has no associated customer");
        }

        if (order.getShippingFee() == null || order.getShippingFee().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Order has invalid shipping fee");
        }

        try {
            // Convert VND to USD for PayPal (approximate rate: 1 USD = 23,000 VND)
            BigDecimal usdAmount = order.getShippingFee().divide(new BigDecimal("23000"), 2, java.math.RoundingMode.HALF_UP);

            // Create PayPal order first to get the order ID
            String description = "Payment for Order #" + orderId + " - " + order.getCustomerName();
            Map<String, Object> paypalOrder = payPalService.createPaymentOrder(usdAmount, "USD", description);

            // Extract PayPal order ID and store it for later capture
            String paypalOrderId = (String) paypalOrder.get("id");

            // Find or create payment record to store PayPal order ID
            Payment payment = paymentRepository.findByOrderAndPaypalOrderId(order, paypalOrderId)
                    .orElseGet(() -> {
                        Payment newPayment = new Payment();
                        newPayment.setOrder(order);
                        newPayment.setPaypalOrderId(paypalOrderId);
                        newPayment.setAmount(order.getShippingFee());
                        newPayment.setDescription(description);
                        return paymentRepository.save(newPayment);
                    });

            // Extract approval URL from PayPal response
            String paymentLink = null;
            if (paypalOrder.containsKey("links")) {
                @SuppressWarnings("unchecked")
                java.util.List<Object> links = (java.util.List<Object>) paypalOrder.get("links");
                if (links != null) {
                    for (Object linkObj : links) {
                        Map<String, Object> link = (Map<String, Object>) linkObj;
                        if ("approve".equals(link.get("rel"))) {
                            paymentLink = (String) link.get("href");
                            break;
                        }
                    }
                }
            }

            if (paymentLink == null) {
                throw new RuntimeException("Failed to generate PayPal approval link");
            }

            // Send payment request email with VND amount displayed
            emailService.sendPaymentRequestEmail(
                order.getCustomer().getEmail(),
                order.getCustomerName(),
                orderId,
                order.getShippingFee(), // Show VND amount in email
                paymentLink
            );

        } catch (Exception e) {
            logger.error("Failed to send payment request email for order {}: {}. Payment will continue without email.", orderId, e.getMessage(), e);
            // Don't throw exception - allow payment to continue even if email fails
        }
    }

    /**
     * Process PayPal payment capture and send confirmation
     */
    @Transactional
    public void processPaymentCapture(String paypalOrderId, Integer orderId) {
        try {
            // Get order details first
            Order order = orderRepository.findByIdWithRelations(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

            // Find or create payment record
            Payment payment = paymentRepository.findByOrderAndPaypalOrderId(order, paypalOrderId)
                    .orElseGet(() -> {
                        Payment newPayment = new Payment();
                        newPayment.setOrder(order);
                        newPayment.setPaypalOrderId(paypalOrderId);
                        newPayment.setAmount(order.getShippingFee());
                        newPayment.setDescription("Payment for Order #" + orderId);
                        return paymentRepository.save(newPayment);
                    });

            // Capture the payment
            Map<String, Object> captureResponse = payPalService.capturePayment(paypalOrderId);

            // Extract transaction ID
            String transactionId = payPalService.extractTransactionId(captureResponse);

            // Mark payment as successful
            payment.markAsPaid(transactionId);
            paymentRepository.save(payment);

            // Update order payment status
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            order.setPaymentUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // Send payment confirmation email (don't fail payment if email fails)
            if (order.getCustomer() != null) {
                try {
                    emailService.sendPaymentConfirmationEmail(
                        order.getCustomer().getEmail(),
                        order.getCustomerName(),
                        orderId,
                        order.getShippingFee(),
                        transactionId
                    );
                } catch (Exception emailError) {
                    logger.error("Failed to send payment confirmation email for order {}: {}. Payment completed successfully.", orderId, emailError.getMessage(), emailError);
                    // Don't throw - payment should still succeed even if email fails
                }
            }

        } catch (Exception e) {
            logger.error("Failed to process payment capture for PayPal order {} and order {}: {}", paypalOrderId, orderId, e.getMessage(), e);

            // Mark payment as failed if capture fails
            try {
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null) {
                    // Find the payment record and mark as failed
                    Payment payment = paymentRepository.findByOrderAndPaypalOrderId(order, paypalOrderId)
                            .orElse(null);
                    if (payment != null) {
                        payment.markAsFailed(e.getMessage());
                        paymentRepository.save(payment);
                    }

                    // Update order status
                    order.setPaymentStatus(Order.PaymentStatus.FAILED);
                    order.setPaymentUpdatedAt(LocalDateTime.now());
                    orderRepository.save(order);
                }
            } catch (Exception saveError) {
                logger.error("Failed to update payment status to FAILED for order {}: {}", orderId, saveError.getMessage(), saveError);
            }

            throw new RuntimeException("Payment processing failed. Please contact support if the issue persists.");
        }
    }

    /**
     * Get payment status from PayPal
     */
    public Map<String, Object> getPaymentStatus(String paypalOrderId) {
        return payPalService.getPaymentDetails(paypalOrderId);
    }

    /**
     * Create PayPal payment order (for frontend integration) - legacy method
     */
    public Map<String, Object> createPayPalOrder(BigDecimal amount, String description) {
        // Convert VND to USD for PayPal (approximate rate: 1 USD = 23,000 VND)
        BigDecimal usdAmount = amount.divide(new BigDecimal("23000"), 2, java.math.RoundingMode.HALF_UP);
        return payPalService.createPaymentOrder(usdAmount, "USD", description);
    }

    /**
     * Create PayPal payment order with order tracking (for frontend integration)
     */
    @Transactional
    public Map<String, Object> createPayPalOrder(BigDecimal amount, String description, Integer orderId) {
        // Get order to store PayPal order ID
        Order order = orderRepository.findById(orderId).orElseThrow(() ->
            new RuntimeException("Order not found: " + orderId));

        // Convert VND to USD for PayPal (approximate rate: 1 USD = 23,000 VND)
        BigDecimal usdAmount = amount.divide(new BigDecimal("23000"), 2, java.math.RoundingMode.HALF_UP);

        Map<String, Object> paypalOrder = payPalService.createPaymentOrder(usdAmount, "USD", description);

        // Extract PayPal order ID and store it for later capture
        String paypalOrderId = (String) paypalOrder.get("id");

        // Find or create payment record to store PayPal order ID
        Payment payment = paymentRepository.findByOrderAndPaypalOrderId(order, paypalOrderId)
                .orElseGet(() -> {
                    Payment newPayment = new Payment();
                    newPayment.setOrder(order);
                    newPayment.setPaypalOrderId(paypalOrderId);
                    newPayment.setAmount(amount);
                    newPayment.setDescription(description);
                    return paymentRepository.save(newPayment);
                });

        return paypalOrder;
    }

    /**
     * Send payment reminder for overdue payments
     */
    @Transactional
    public void sendPaymentReminder(Integer orderId) {
        Order order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getCustomer() == null || order.getShippingFee() == null) {
            return; // Skip if order is not properly set up
        }

        try {
            // Convert VND to USD for PayPal (approximate rate: 1 USD = 23,000 VND)
            BigDecimal usdAmount = order.getShippingFee().divide(new BigDecimal("23000"), 2, java.math.RoundingMode.HALF_UP);

            // Generate new PayPal link (they expire after 24 hours)
            String description = "Payment Reminder for Order #" + orderId + " - " + order.getCustomerName();
            String paymentLink = payPalService.generatePaymentLink(
                usdAmount,
                "USD",
                description
            );

            // Send reminder email with VND amount displayed but USD link
            emailService.sendPaymentRequestEmail(
                order.getCustomer().getEmail(),
                order.getCustomerName(),
                orderId,
                order.getShippingFee(), // Show VND amount in email
                paymentLink
            );

        } catch (Exception e) {
            // Log error but don't fail the operation
            logger.warn("Failed to send payment reminder for order {}: {}", orderId, e.getMessage());
        }
    }

    /**
     * Find order ID by PayPal order ID
     */
    public Integer findOrderIdByPaypalOrderId(String paypalOrderId) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findByPaypalOrderId(paypalOrderId);
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                if (payment.getOrder() != null) {
                    return payment.getOrder().getOrderId();
                }
            }
            return null;
        } catch (Exception e) {
            logger.error("Failed to find order by PayPal order ID {}: {}", paypalOrderId, e.getMessage(), e);
            return null;
        }
    }
}
