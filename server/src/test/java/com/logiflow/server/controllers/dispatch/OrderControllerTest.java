package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.OrderDto;
import com.logiflow.server.exceptions.GlobalExceptionHandler;
import com.logiflow.server.exceptions.ResourceNotFoundException;
import com.logiflow.server.services.dispatch.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getOrderById_whenFound_returnsOrder() throws Exception {
        OrderDto order = new OrderDto();
        order.setOrderId(202);
        order.setCustomerName("Acme Logistics");

        when(orderService.getOrderById(202)).thenReturn(order);

        mockMvc.perform(get("/api/dispatch/orders/202"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(202))
                .andExpect(jsonPath("$.customerName").value("Acme Logistics"));
    }

    @Test
    void getOrderById_whenNotFound_returnsStructured404() throws Exception {
        when(orderService.getOrderById(888)).thenThrow(new ResourceNotFoundException("Order with id 888 not found"));

        mockMvc.perform(get("/api/dispatch/orders/888"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Order with id 888 not found"));
    }

    @Test
    void createOrder_whenInvalidPayload_returnsValidationError() throws Exception {
        mockMvc.perform(post("/api/dispatch/orders")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void importOrders_whenFileIsEmpty_returnsBusinessRuleError() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.csv", "text/csv", new byte[0]);

        mockMvc.perform(multipart("/api/dispatch/orders/import")
                        .file(emptyFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("BUSINESS_RULE_VIOLATION"))
                .andExpect(jsonPath("$.message").value("Import file cannot be empty"));
    }
}
