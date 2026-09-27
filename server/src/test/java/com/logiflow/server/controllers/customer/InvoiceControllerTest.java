package com.logiflow.server.controllers.customer;

import com.logiflow.server.exceptions.GlobalExceptionHandler;
import com.logiflow.server.services.payment.InvoiceService;
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

import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class InvoiceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private InvoiceService invoiceService;

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
        byte[] fakePdf = "%PDF-1.4 test invoice content".getBytes();

        when(invoiceService.generateInvoice(eq(1), any())).thenReturn(fakePdf);

        mockMvc.perform(get("/api/orders/1/invoice/download"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice_1.pdf"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(fakePdf));
    }

    @Test
    void downloadInvoice_whenOrderNotFound_returnsStructured404() throws Exception {
        when(invoiceService.generateInvoice(eq(999999), any()))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Order not found"));

        mockMvc.perform(get("/api/orders/999999/invoice/download"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Order not found"));
    }
}
