package com.logiflow.server.services.payment;

import com.logiflow.server.models.Order;
import com.logiflow.server.models.Payment;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.payment.PaymentRepository;
import com.logiflow.server.services.email.EmailService;
import com.logiflow.server.websocket.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PayPalService payPalService;
    private final EmailService emailService;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final TransactionTemplate captureTransactionTemplate;
    private final TransactionTemplate failureTransactionTemplate;

    @Value("${logiflow.payment.vnd-usd-rate:23000}")
    private BigDecimal vndUsdRate = new BigDecimal("23000");

    public void setVndUsdRate(BigDecimal vndUsdRate) {
        this.vndUsdRate = vndUsdRate;
    }

    public BigDecimal getVndUsdRate() {
        return this.vndUsdRate;
    }

    public PaymentServiceImpl(
            PayPalService payPalService,
            EmailService emailService,
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            NotificationService notificationService) {
        this(payPalService, emailService, orderRepository, paymentRepository, notificationService, null);
    }

    @Autowired
    public PaymentServiceImpl(
            PayPalService payPalService,
            EmailService emailService,
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            NotificationService notificationService,
            PlatformTransactionManager transactionManager) {
        this.payPalService = payPalService;
        this.emailService = emailService;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
        if (transactionManager != null) {
            this.captureTransactionTemplate = new TransactionTemplate(transactionManager);
            this.failureTransactionTemplate = new TransactionTemplate(transactionManager);
            this.failureTransactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        } else {
            this.captureTransactionTemplate = null;
            this.failureTransactionTemplate = null;
        }
    }

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
            String description = "Payment for Order #" + orderId + " - " + order.getCustomerName();
            Map<String, Object> paypalOrder = createPayPalOrderAndPersistPayment(order, order.getShippingFee(), description);
            String paymentLink = extractApprovalLink(paypalOrder);

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

            // Send push notification to customer
            try {
                notificationService.sendOrderNotification(
                    order.getCustomer().getUserId(),
                    orderId,
                    "PAYMENT_REQUEST",
                    "Payment request sent for Order #" + orderId + ". Check your email for PayPal payment link.",
                    "PENDING"
                );
            } catch (Exception notificationError) {
                logger.warn("Failed to send payment request notification for order {}: {}", orderId, notificationError.getMessage());
                // Don't fail the payment request if notification fails
            }

        } catch (Exception e) {
            logger.error("Failed to send payment request email for order {}: {}. Payment will continue without email.", orderId, e.getMessage(), e);
            // Don't throw exception - allow payment to continue even if email fails
        }
    }

    /**
     * Process PayPal payment capture and send confirmation.
     * Uses explicit transaction boundaries so capture locking commits/rolls back independently
     * from durable FAILED status persistence and post-commit confirmation emails.
     */
    public void processPaymentCapture(String paypalOrderId, Integer orderId) {
        if (paypalOrderId == null || paypalOrderId.isBlank() || orderId == null) {
            throw new IllegalArgumentException("PayPal order ID and order ID are required");
        }

        CaptureEmailPayload emailPayload;
        try {
            emailPayload = executeInTransaction(captureTransactionTemplate,
                    () -> captureInsideTransaction(paypalOrderId, orderId));
        } catch (InvalidPaymentBindingException e) {
            logger.warn("Rejected invalid payment capture request for PayPal order {} and order {}: {}",
                    paypalOrderId, orderId, e.getMessage());
            throw new RuntimeException(e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Failed to process payment capture for PayPal order {} and order {}: {}", paypalOrderId, orderId, e.getMessage(), e);

            boolean alreadyPaid = false;
            try {
                alreadyPaid = Boolean.TRUE.equals(executeInTransaction(failureTransactionTemplate,
                        () -> recordCaptureFailure(paypalOrderId, orderId, e.getMessage())));
            } catch (Exception saveError) {
                logger.error("Failed to update payment status to FAILED for order {}: {}", orderId, saveError.getMessage(), saveError);
            }

            if (alreadyPaid) {
                return;
            }

            throw new RuntimeException("Payment processing failed. Please contact support if the issue persists.");
        }

        // Send payment confirmation email post-commit so slow SMTP never holds DB locks
        if (emailPayload != null && emailPayload.customerEmail() != null) {
            try {
                emailService.sendPaymentConfirmationEmail(
                    emailPayload.customerEmail(),
                    emailPayload.customerName(),
                    orderId,
                    emailPayload.shippingFee(),
                    emailPayload.transactionId(),
                    emailPayload.orderDetails()
                );
            } catch (Exception emailError) {
                logger.error("Failed to send payment confirmation email for order {}: {}. Payment completed successfully.", orderId, emailError.getMessage(), emailError);
            }
        }
    }

    private CaptureEmailPayload captureInsideTransaction(String paypalOrderId, Integer orderId) {
        // Acquire pessimistic write lock on Order when backed by JPA; fall back cleanly for unit tests
        Order order = orderRepository.findByIdForUpdate(orderId)
                .or(() -> orderRepository.findByIdWithRelations(orderId))
                .orElseThrow(() -> new InvalidPaymentBindingException("Order not found: " + orderId));

        Payment payment = paymentRepository.findByOrderAndPaypalOrderId(order, paypalOrderId)
                .orElseGet(() -> {
                    Optional<Payment> byToken = paymentRepository.findByPaypalOrderId(paypalOrderId);
                    if (byToken.isPresent()) {
                        throw new InvalidPaymentBindingException(
                                "PayPal order " + paypalOrderId + " does not belong to order #" + orderId);
                    }
                    throw new InvalidPaymentBindingException(
                            "No payment record found for PayPal order " + paypalOrderId);
                });

        // Idempotency check: if already processed as PAID, return early and do not re-capture
        if (payment.getPaymentStatus() == Payment.PaymentStatus.PAID ||
            order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            logger.info("Payment for PayPal order {} (Order #{}) has already been processed as PAID. Skipping duplicate capture.",
                    paypalOrderId, orderId);
            return null;
        }

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

        if (order.getCustomer() == null) {
            return new CaptureEmailPayload(null, null, null, transactionId, null);
        }

        Map<String, Object> orderDetails = new HashMap<>();
        orderDetails.put("pickupAddress", order.getPickupAddress() != null ? order.getPickupAddress() : "N/A");
        orderDetails.put("deliveryAddress", order.getDeliveryAddress() != null ? order.getDeliveryAddress() : "N/A");
        orderDetails.put("packageDetails", order.getPackageDetails() != null ? order.getPackageDetails() : "N/A");
        orderDetails.put("weightTons", order.getWeightTons() != null ? order.getWeightTons() : null);

        return new CaptureEmailPayload(
                order.getCustomer().getEmail(),
                order.getCustomerName(),
                order.getShippingFee(),
                transactionId,
                orderDetails
        );
    }

    private boolean recordCaptureFailure(String paypalOrderId, Integer orderId, String failureReason) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return false;
        }

        Payment payment = paymentRepository.findByOrderAndPaypalOrderId(order, paypalOrderId)
                .orElse(null);
        if (payment != null && payment.getPaymentStatus() == Payment.PaymentStatus.PAID) {
            logger.info("Order #{} is already marked PAID, not overwriting with FAILED on exception: {}", orderId, failureReason);
            return true;
        }
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            logger.info("Order #{} status is already PAID, not overwriting with FAILED.", orderId);
            return true;
        }

        // Only mark as failed if neither payment nor order was already PAID
        if (payment != null) {
            payment.markAsFailed(failureReason);
            paymentRepository.save(payment);
        }

        order.setPaymentStatus(Order.PaymentStatus.FAILED);
        order.setPaymentUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        return false;
    }

    private <T> T executeInTransaction(TransactionTemplate template, Supplier<T> action) {
        if (template == null) {
            return action.get();
        }
        return template.execute(status -> action.get());
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
        BigDecimal usdAmount = amount.divide(vndUsdRate, 2, java.math.RoundingMode.HALF_UP);
        return payPalService.createPaymentOrder(usdAmount, "USD", description);
    }

    /**
     * Create PayPal payment order with order tracking (for frontend integration)
     */
    @Transactional
    public Map<String, Object> createPayPalOrder(BigDecimal amount, String description, Integer orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() ->
            new RuntimeException("Order not found: " + orderId));
        return createPayPalOrderAndPersistPayment(order, amount, description);
    }

    /**
     * Send payment reminder for overdue payments
     */
    @Transactional
    public void sendPaymentReminder(Integer orderId) {
        Order order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getCustomer() == null
                || order.getShippingFee() == null
                || order.getShippingFee().compareTo(BigDecimal.ZERO) <= 0
                || order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            return; // Skip if order is already paid or not properly set up
        }

        try {
            // Create tracked PayPal order and persist Payment so /api/payment/return?token=... resolves
            String description = "Payment Reminder for Order #" + orderId + " - " + order.getCustomerName();
            Map<String, Object> paypalOrder = createPayPalOrderAndPersistPayment(order, order.getShippingFee(), description);
            String paymentLink = extractApprovalLink(paypalOrder);
            if (paymentLink == null) {
                throw new RuntimeException("Failed to generate PayPal approval link for reminder");
            }

            // Send reminder email with VND amount displayed
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

    private Map<String, Object> createPayPalOrderAndPersistPayment(Order order, BigDecimal vndAmount, String description) {
        BigDecimal usdAmount = vndAmount.divide(vndUsdRate, 2, java.math.RoundingMode.HALF_UP);
        Map<String, Object> paypalOrder = payPalService.createPaymentOrder(usdAmount, "USD", description);
        String paypalOrderId = paypalOrder != null ? (String) paypalOrder.get("id") : null;

        if (paypalOrderId != null && !paypalOrderId.isBlank()) {
            paymentRepository.findByOrderAndPaypalOrderId(order, paypalOrderId)
                    .orElseGet(() -> {
                        Payment newPayment = new Payment();
                        newPayment.setOrder(order);
                        newPayment.setPaypalOrderId(paypalOrderId);
                        newPayment.setAmount(vndAmount);
                        newPayment.setCurrency("VND");
                        newPayment.setDescription(description);
                        return paymentRepository.save(newPayment);
                    });
        }

        return paypalOrder;
    }

    @SuppressWarnings("unchecked")
    private String extractApprovalLink(Map<String, Object> paypalOrder) {
        if (paypalOrder == null || !paypalOrder.containsKey("links")) {
            return null;
        }
        java.util.List<Object> links = (java.util.List<Object>) paypalOrder.get("links");
        if (links == null) {
            return null;
        }
        for (Object linkObj : links) {
            Map<String, Object> link = (Map<String, Object>) linkObj;
            if ("approve".equals(link.get("rel"))) {
                return (String) link.get("href");
            }
        }
        return null;
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

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getOrderPaymentSummary(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        Map<String, Object> summary = new HashMap<>();
        summary.put("orderId", orderId);
        summary.put("customerName", order.getCustomer() != null ? order.getCustomer().getFullName() : "Customer");
        summary.put("shippingFee", order.getShippingFee());
        summary.put("pickupAddress", order.getPickupAddress());
        summary.put("deliveryAddress", order.getDeliveryAddress());
        summary.put("packageDetails", order.getPackageDetails());
        summary.put("weightTons", order.getWeightTons());
        summary.put("distanceKm", order.getDistanceKm());
        return summary;
    }

    private record CaptureEmailPayload(
            String customerEmail,
            String customerName,
            BigDecimal shippingFee,
            String transactionId,
            Map<String, Object> orderDetails
    ) {}

    private static class InvalidPaymentBindingException extends RuntimeException {
        InvalidPaymentBindingException(String message) {
            super(message);
        }
    }
}
