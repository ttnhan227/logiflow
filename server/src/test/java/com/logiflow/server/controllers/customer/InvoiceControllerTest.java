package com.logiflow.server.controllers.customer;

import com.logiflow.server.exceptions.GlobalExceptionHandler;
import com.logiflow.server.models.Order;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.services.payment.InvoicePdfService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class InvoiceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InvoicePdfService invoicePdfService;

    @InjectMocks
    private InvoiceController invoiceController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(invoiceController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void downloadInvoice_whenOrderExists_returnsPdfBytesAndHeaders() throws Exception {
        Order order = new Order();
        order.setOrderId(1);

        byte[] fakePdf = "%PDF-1.4 test invoice content".getBytes();

        when(orderRepository.findByIdWithRelations(1)).thenReturn(Optional.of(order));
        when(invoicePdfService.generateInvoice(order)).thenReturn(fakePdf);

        mockMvc.perform(get("/api/orders/1/invoice/download"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice_1.pdf"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(fakePdf));
    }

    @Test
    void downloadInvoice_whenOrderNotFound_returnsStructured404() throws Exception {
        when(orderRepository.findByIdWithRelations(999999)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/orders/999999/invoice/download"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Order not found"));
    }
}
