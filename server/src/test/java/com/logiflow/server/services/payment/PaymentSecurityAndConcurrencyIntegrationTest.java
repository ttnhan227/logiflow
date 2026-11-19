package com.logiflow.server.services.payment;

import com.logiflow.server.models.Order;
import com.logiflow.server.models.Payment;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.payment.PaymentRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.services.email.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PaymentSecurityAndConcurrencyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private PayPalService payPalService;

    @MockitoBean
    private EmailService emailService;

    private User createCustomer(String suffix) {
        Role customerRole = roleRepository.findByRoleName("CUSTOMER").orElseGet(() -> {
            Role role = new Role();
            role.setRoleName("CUSTOMER");
            role.setDescription("Customer");
            return roleRepository.save(role);
        });

        User customer = new User();
        customer.setUsername("pay_cust_" + suffix);
        customer.setEmail("pay_cust_" + suffix + "@example.com");
        customer.setPasswordHash(passwordEncoder.encode("Pass123!"));
        customer.setFullName("Payment Customer " + suffix);
        customer.setRole(customerRole);
        customer.setIsActive(true);
        return userRepository.save(customer);
    }

    private Order createOrder(User customer, BigDecimal fee) {
        Order order = new Order();
        order.setCustomer(customer);
        order.setCustomerName(customer.getFullName());
        order.setPickupAddress("123 Pickup Ave");
        order.setDeliveryAddress("456 Delivery Blvd");
        order.setShippingFee(fee);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
        order.setCreatedBy(customer);
        return orderRepository.save(order);
    }

    private Payment createPendingPayment(Order order, String paypalOrderId) {
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setPaypalOrderId(paypalOrderId);
        payment.setAmount(order.getShippingFee());
        payment.setCurrency("VND");
        payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
        payment.setDescription("Order #" + order.getOrderId());
        return paymentRepository.save(payment);
    }

    @Test
    void concurrentCaptureExecutesPayPalAtMostOnce() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User customer = createCustomer(suffix);
        Order order = createOrder(customer, new BigDecimal("230000"));
        String paypalOrderId = "PP-RACE-" + suffix;
        createPendingPayment(order, paypalOrderId);

        AtomicInteger captureCalls = new AtomicInteger(0);
        when(payPalService.capturePayment(paypalOrderId)).thenAnswer(inv -> {
            captureCalls.incrementAndGet();
            Thread.sleep(60);
            return Map.of("id", "TX-" + suffix, "status", "COMPLETED");
        });
        when(payPalService.extractTransactionId(any())).thenReturn("TX-" + suffix);

        int threads = 4;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Callable<Void>> tasks = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            tasks.add(() -> {
                ready.countDown();
                assertThat(start.await(5, TimeUnit.SECONDS)).isTrue();
                paymentService.processPaymentCapture(paypalOrderId, order.getOrderId());
                return null;
            });
        }

        List<Future<Void>> futures = new ArrayList<>();
        for (Callable<Void> task : tasks) {
            futures.add(pool.submit(task));
        }
        assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
        start.countDown();
        for (Future<Void> future : futures) {
            future.get(15, TimeUnit.SECONDS);
        }
        pool.shutdown();

        assertThat(captureCalls.get()).isEqualTo(1);
        verify(payPalService, times(1)).capturePayment(paypalOrderId);

        Order reloadedOrder = orderRepository.findById(order.getOrderId()).orElseThrow();
        Payment reloadedPayment = paymentRepository.findByPaypalOrderId(paypalOrderId).orElseThrow();
        assertThat(reloadedOrder.getPaymentStatus()).isEqualTo(Order.PaymentStatus.PAID);
        assertThat(reloadedPayment.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.PAID);
        assertThat(reloadedPayment.getPaypalTransactionId()).isEqualTo("TX-" + suffix);
    }

    @Test
    void captureExceptionPersistsFailedStatusAcrossRollback() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User customer = createCustomer(suffix);
        Order order = createOrder(customer, new BigDecimal("345000"));
        String paypalOrderId = "PP-FAIL-" + suffix;
        createPendingPayment(order, paypalOrderId);

        when(payPalService.capturePayment(paypalOrderId))
                .thenThrow(new RuntimeException("PAYPAL_GATEWAY_TIMEOUT"));

        assertThrows(RuntimeException.class,
                () -> paymentService.processPaymentCapture(paypalOrderId, order.getOrderId()));

        Order reloadedOrder = orderRepository.findById(order.getOrderId()).orElseThrow();
        Payment reloadedPayment = paymentRepository.findByPaypalOrderId(paypalOrderId).orElseThrow();
        assertThat(reloadedOrder.getPaymentStatus()).isEqualTo(Order.PaymentStatus.FAILED);
        assertThat(reloadedPayment.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.FAILED);
        assertThat(reloadedPayment.getFailureReason()).contains("PAYPAL_GATEWAY_TIMEOUT");
    }

    @Test
    void sendPaymentReminderPersistsPaymentAndReturnEndpointResolvesByToken() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User customer = createCustomer(suffix);
        Order order = createOrder(customer, new BigDecimal("460000"));
        String reminderToken = "PP-REM-" + suffix;

        when(payPalService.createPaymentOrder(eq(new BigDecimal("20.00")), eq("USD"), anyString()))
                .thenReturn(Map.of(
                        "id", reminderToken,
                        "links", List.of(Map.of("rel", "approve", "href", "https://paypal.test/checkout/" + reminderToken))
                ));
        when(payPalService.capturePayment(reminderToken))
                .thenReturn(Map.of("id", "TX-REM-" + suffix, "status", "COMPLETED"));
        when(payPalService.extractTransactionId(any())).thenReturn("TX-REM-" + suffix);

        paymentService.sendPaymentReminder(order.getOrderId());

        Payment persisted = paymentRepository.findByPaypalOrderId(reminderToken).orElseThrow();
        assertThat(persisted.getCurrency()).isEqualTo("VND");
        assertThat(persisted.getAmount()).isEqualByComparingTo("460000");
        assertThat(persisted.getOrder().getOrderId()).isEqualTo(order.getOrderId());

        mockMvc.perform(get("/api/payment/return").param("token", reminderToken))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Payment Successful")));

        Order paidOrder = orderRepository.findById(order.getOrderId()).orElseThrow();
        Payment paidPayment = paymentRepository.findByPaypalOrderId(reminderToken).orElseThrow();
        assertThat(paidOrder.getPaymentStatus()).isEqualTo(Order.PaymentStatus.PAID);
        assertThat(paidPayment.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.PAID);
    }

    @Test
    void returnEndpointRejectsOrderIdMismatchAndUnknownToken() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User customer = createCustomer(suffix);
        Order orderA = createOrder(customer, new BigDecimal("115000"));
        Order orderB = createOrder(customer, new BigDecimal("230000"));
        String tokenA = "PP-BIND-" + suffix;
        createPendingPayment(orderA, tokenA);

        mockMvc.perform(get("/api/payment/return")
                        .param("token", tokenA)
                        .param("orderId", String.valueOf(orderB.getOrderId())))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Payment token does not match the specified order.")));

        mockMvc.perform(get("/api/payment/return")
                        .param("token", "PP-UNKNOWN-" + suffix)
                        .param("orderId", String.valueOf(orderA.getOrderId())))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("No payment record found for this transaction.")));

        verify(payPalService, never()).capturePayment(anyString());
        assertThat(orderRepository.findById(orderA.getOrderId()).orElseThrow().getPaymentStatus())
                .isEqualTo(Order.PaymentStatus.PENDING);
        assertThat(orderRepository.findById(orderB.getOrderId()).orElseThrow().getPaymentStatus())
                .isEqualTo(Order.PaymentStatus.PENDING);
    }
}
