package com.logiflow.server.services.payment;

import com.logiflow.server.models.Order;
import com.logiflow.server.models.Payment;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.payment.PaymentRepository;
import com.logiflow.server.services.email.EmailService;
import com.logiflow.server.websocket.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceIdempotencyTest {

    @Mock
    private PayPalService payPalService;

    @Mock
    private EmailService emailService;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    @Test
    @DisplayName("Duplicate capture call returns early without calling PayPal when payment is already PAID")
    void testDuplicateCaptureSkipsWhenPaymentAlreadyPaid() {
        Order order = new Order();
        order.setOrderId(101);
        order.setShippingFee(new BigDecimal("150000"));

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setPaypalOrderId("PAYPAL-DUPLICATE-1");
        payment.setPaymentStatus(Payment.PaymentStatus.PAID);

        when(orderRepository.findByIdWithRelations(101)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderAndPaypalOrderId(order, "PAYPAL-DUPLICATE-1"))
                .thenReturn(Optional.of(payment));

        // Call capture - should be idempotent
        assertDoesNotThrow(() -> paymentService.processPaymentCapture("PAYPAL-DUPLICATE-1", 101));

        // PayPal capture should never have been invoked
        verify(payPalService, never()).capturePayment(anyString());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    @DisplayName("Duplicate capture call returns early without calling PayPal when order is already PAID")
    void testDuplicateCaptureSkipsWhenOrderAlreadyPaid() {
        Order order = new Order();
        order.setOrderId(102);
        order.setShippingFee(new BigDecimal("200000"));
        order.setPaymentStatus(Order.PaymentStatus.PAID);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setPaypalOrderId("PAYPAL-DUPLICATE-2");
        payment.setPaymentStatus(Payment.PaymentStatus.PENDING);

        when(orderRepository.findByIdWithRelations(102)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderAndPaypalOrderId(order, "PAYPAL-DUPLICATE-2"))
                .thenReturn(Optional.of(payment));

        assertDoesNotThrow(() -> paymentService.processPaymentCapture("PAYPAL-DUPLICATE-2", 102));

        verify(payPalService, never()).capturePayment(anyString());
    }

    @Test
    @DisplayName("Capture exception does not overwrite existing PAID status to FAILED")
    void testExceptionDoesNotOverwritePaidStatus() {
        Order order = new Order();
        order.setOrderId(103);
        order.setShippingFee(new BigDecimal("100000"));
        order.setPaymentStatus(Order.PaymentStatus.PENDING);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setPaypalOrderId("PAYPAL-ALREADY-CAPTURED");
        payment.setPaymentStatus(Payment.PaymentStatus.PENDING);

        when(orderRepository.findByIdWithRelations(103)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderAndPaypalOrderId(order, "PAYPAL-ALREADY-CAPTURED"))
                .thenReturn(Optional.of(payment));

        // Simulate PayPal throwing an exception (e.g. 422 ORDER_ALREADY_CAPTURED)
        when(payPalService.capturePayment("PAYPAL-ALREADY-CAPTURED"))
                .thenThrow(new RuntimeException("ORDER_ALREADY_CAPTURED"));

        // When the catch block re-reads from the DB, simulate the order was already marked PAID concurrently
        Order persistedPaidOrder = new Order();
        persistedPaidOrder.setOrderId(103);
        persistedPaidOrder.setPaymentStatus(Order.PaymentStatus.PAID);

        when(orderRepository.findById(103)).thenReturn(Optional.of(persistedPaidOrder));

        // The method should catch the concurrent PAID state and not overwrite with FAILED
        paymentService.processPaymentCapture("PAYPAL-ALREADY-CAPTURED", 103);

        assertEquals(Order.PaymentStatus.PAID, persistedPaidOrder.getPaymentStatus());
        verify(orderRepository, never()).save(argThat(o -> o.getPaymentStatus() == Order.PaymentStatus.FAILED));
    }

    @Test
    @DisplayName("First-time capture succeeds, marks payment and order as PAID, and sends confirmation email")
    void testFirstCaptureSucceeds() {
        User customer = new User();
        customer.setUserId(5);
        customer.setEmail("customer@test.com");
        customer.setUsername("customer1");

        Order order = new Order();
        order.setOrderId(104);
        order.setCustomer(customer);
        order.setCustomerName("Customer One");
        order.setShippingFee(new BigDecimal("250000"));
        order.setPaymentStatus(Order.PaymentStatus.PENDING);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setPaypalOrderId("PAYPAL-FIRST-CAPTURE");
        payment.setPaymentStatus(Payment.PaymentStatus.PENDING);

        when(orderRepository.findByIdWithRelations(104)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderAndPaypalOrderId(order, "PAYPAL-FIRST-CAPTURE"))
                .thenReturn(Optional.of(payment));
        when(payPalService.capturePayment("PAYPAL-FIRST-CAPTURE"))
                .thenReturn(Map.of("id", "CAPTURE-TX-999", "status", "COMPLETED"));
        when(payPalService.extractTransactionId(any())).thenReturn("CAPTURE-TX-999");

        paymentService.processPaymentCapture("PAYPAL-FIRST-CAPTURE", 104);

        assertEquals(Payment.PaymentStatus.PAID, payment.getPaymentStatus());
        assertEquals("CAPTURE-TX-999", payment.getPaypalTransactionId());
        assertEquals(Order.PaymentStatus.PAID, order.getPaymentStatus());

        verify(paymentRepository).save(payment);
        verify(orderRepository).save(order);
        verify(emailService).sendPaymentConfirmationEmail(
                eq("customer@test.com"),
                eq("Customer One"),
                eq(104),
                eq(new BigDecimal("250000")),
                eq("CAPTURE-TX-999"),
                any()
        );
    }
}
