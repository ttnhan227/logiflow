package com.logiflow.server.controllers.customer;

import com.logiflow.server.models.Order;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.services.payment.InvoicePdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/orders")
public class InvoiceController {

    private final OrderRepository orderRepository;
    private final InvoicePdfService invoicePdfService;

    public InvoiceController(OrderRepository orderRepository,
                             InvoicePdfService invoicePdfService) {
        this.orderRepository = orderRepository;
        this.invoicePdfService = invoicePdfService;
    }



    /**
     * Download order invoice as PDF
     * This endpoint is publicly accessible for easy email link access
     */
    @GetMapping("/{orderId}/invoice/download")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Integer orderId) {

        Order order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        byte[] pdf = invoicePdfService.generateInvoice(order);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=invoice_" + orderId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
