package com.logiflow.server.controllers.customer;

import com.logiflow.server.services.payment.InvoiceService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/orders")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }



    /**
     * Download order invoice as PDF
     * Customers may download their own invoices. Operations staff may download
     * any invoice for support and dispatch workflows.
     */
    @GetMapping("/{orderId}/invoice/download")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Integer orderId,
                                                   Authentication authentication) {
        byte[] pdf = invoiceService.generateInvoice(orderId, authentication);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=invoice_" + orderId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
