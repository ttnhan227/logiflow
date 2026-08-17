package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.OrderCreateRequest;
import com.logiflow.server.dtos.dispatch.OrderDto;
import com.logiflow.server.dtos.dispatch.OrderImportResponse;
import com.logiflow.server.dtos.dispatch.OrderListResponse;
import com.logiflow.server.dtos.dispatch.OrderUpdateRequest;
import com.logiflow.server.exceptions.BusinessRuleException;
import com.logiflow.server.services.dispatch.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/dispatch")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/orders")
    public ResponseEntity<OrderListResponse> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        OrderListResponse response = orderService.getOrders(status, date, page, size);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderDto> createOrder(
            @Valid @RequestBody OrderCreateRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        OrderDto createdOrder = orderService.createOrder(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    @PostMapping(value = "/orders/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OrderImportResponse> importOrders(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Import file cannot be empty");
        }

        String username = authentication != null ? authentication.getName() : "system";
        OrderImportResponse response = orderService.importOrders(file, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/import/template")
    public ResponseEntity<byte[]> downloadTemplate(
            @RequestParam(defaultValue = "csv") String format) {
        byte[] templateBytes = orderService.downloadTemplate(format);

        HttpHeaders headers = new HttpHeaders();
        String fileName;
        String contentType;
        if ("xlsx".equalsIgnoreCase(format) || "excel".equalsIgnoreCase(format)) {
            fileName = "order_import_template.xlsx";
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else {
            fileName = "order_import_template.csv";
            contentType = "text/csv";
        }

        headers.setContentDispositionFormData("attachment", fileName);
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentLength(templateBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(templateBytes);
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Integer orderId) {
        OrderDto order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }

    @PutMapping("/orders/{orderId}")
    public ResponseEntity<OrderDto> updateOrder(
            @PathVariable Integer orderId,
            @Valid @RequestBody OrderUpdateRequest request) {
        OrderDto updatedOrder = orderService.updateOrder(orderId, request);
        return ResponseEntity.ok(updatedOrder);
    }
}



