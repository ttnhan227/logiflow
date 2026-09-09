package com.logiflow.server.controllers.customer;

import com.logiflow.server.dtos.customer.CustomerDtos.OrderDto;
import com.logiflow.server.dtos.customer.CustomerDtos.OrderSummaryDto;
import com.logiflow.server.dtos.customer.CustomerDtos.TrackOrderResponse;
import com.logiflow.server.exceptions.GlobalExceptionHandler;
import com.logiflow.server.services.customer.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CustomerControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CustomerService customerService;

    @InjectMocks
    private CustomerController customerController;

    private UsernamePasswordAuthenticationToken authPrincipal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(customerController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        authPrincipal = new UsernamePasswordAuthenticationToken(
                "customer.alice", "password", List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
    }

    @Test
    void getMyOrders_returnsCustomerOrders() throws Exception {
        OrderSummaryDto orderSummary = new OrderSummaryDto();
        orderSummary.setOrderId(10);
        orderSummary.setDeliveryAddress("456 Market St, Da Nang");
        orderSummary.setOrderStatus("PENDING");
        orderSummary.setShippingFee(new BigDecimal("120000.00"));

        when(customerService.getMyOrders("customer.alice")).thenReturn(List.of(orderSummary));

        mockMvc.perform(get("/api/customer/me/orders").principal(authPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderId").value(10))
                .andExpect(jsonPath("$[0].orderStatus").value("PENDING"))
                .andExpect(jsonPath("$[0].deliveryAddress").value("456 Market St, Da Nang"));
    }

    @Test
    void getOrderById_returnsSpecificOrder() throws Exception {
        OrderDto order = new OrderDto();
        order.setOrderId(15);
        order.setCustomerName("Alice Cooper");
        order.setOrderStatus("IN_TRANSIT");

        when(customerService.getOrderById("customer.alice", 15)).thenReturn(order);

        mockMvc.perform(get("/api/customer/me/orders/15").principal(authPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(15))
                .andExpect(jsonPath("$.customerName").value("Alice Cooper"))
                .andExpect(jsonPath("$.orderStatus").value("IN_TRANSIT"));
    }

    @Test
    void trackOrder_returnsTrackingMilestones() throws Exception {
        TrackOrderResponse trackResponse = new TrackOrderResponse();
        trackResponse.setOrderId(20);
        trackResponse.setOrderStatus("DELIVERED");
        trackResponse.setDriverName("Sarah Driver");

        when(customerService.trackOrder("customer.alice", 20)).thenReturn(trackResponse);

        mockMvc.perform(get("/api/customer/me/orders/20/track").principal(authPrincipal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(20))
                .andExpect(jsonPath("$.orderStatus").value("DELIVERED"))
                .andExpect(jsonPath("$.driverName").value("Sarah Driver"));
    }

    @Test
    void createOrder_whenPayloadIncomplete_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/customer/me/orders")
                        .principal(authPrincipal)
                        .contentType("application/json")
                        .content("{\"notes\":\"Leave at door\"}"))
                .andExpect(status().isBadRequest());
    }
}
