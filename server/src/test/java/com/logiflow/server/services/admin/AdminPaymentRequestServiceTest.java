package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.AdminPaymentRequestDtos.PaymentRequestSummaryDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.payment.PaymentRepository;
import com.logiflow.server.services.payment.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminPaymentRequestServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentService paymentService;

    private AdminPaymentRequestServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminPaymentRequestServiceImpl(
                orderRepository,
                paymentRepository,
                paymentService
        );
    }

    @Test
    void getPaymentRequestSummary_withEmptyList_returnsZeroTotals() {
        PaymentRequestSummaryDto summary = service.getPaymentRequestSummary(List.of());

        assertNotNull(summary);
        assertEquals(0, summary.getTotalOrders());
        assertEquals(0, summary.getSelectedOrders());
        assertEquals(BigDecimal.ZERO, summary.getTotalAmount());
        assertEquals(0, summary.getOrders().size());
    }

    @Test
    void getPaymentRequestSummary_withValidOrderIds_calculatesTotalsCorrectly() {
        User customer = new User();
        customer.setEmail("customer@logiflow.com");

        Order order1 = new Order();
        order1.setOrderId(1);
        order1.setCustomerName("Alpha Corp");
        order1.setCustomer(customer);
        order1.setShippingFee(new BigDecimal("150.50"));

        Order order2 = new Order();
        order2.setOrderId(2);
        order2.setCustomerName("Beta Inc");
        order2.setCustomer(customer);
        order2.setShippingFee(new BigDecimal("249.50"));

        when(orderRepository.findAllById(List.of(1, 2))).thenReturn(List.of(order1, order2));

        PaymentRequestSummaryDto summary = service.getPaymentRequestSummary(List.of(1, 2));

        assertNotNull(summary);
        assertEquals(2, summary.getTotalOrders());
        assertEquals(2, summary.getSelectedOrders());
        assertEquals(new BigDecimal("400.00"), summary.getTotalAmount());
        assertEquals(2, summary.getOrders().size());
        assertEquals("customer@logiflow.com", summary.getOrders().get(0).getCustomerEmail());
    }
}
