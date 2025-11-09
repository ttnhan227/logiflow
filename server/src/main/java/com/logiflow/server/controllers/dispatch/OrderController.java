package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.OrderCreateRequest;
import com.logiflow.server.dtos.dispatch.OrderDto;
import com.logiflow.server.dtos.dispatch.OrderImportResponse;
import com.logiflow.server.dtos.dispatch.OrderListResponse;
import com.logiflow.server.dtos.dispatch.OrderUpdateRequest;
import com.logiflow.server.services.dispatch.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    private OrderService orderService;

    @GetMapping("/orders")
    public ResponseEntity<OrderListResponse> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            OrderListResponse response = orderService.getOrders(status, date, page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }


    @PostMapping("/orders")
    public ResponseEntity<OrderDto> createOrder(
            @Valid @RequestBody OrderCreateRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            OrderDto createdOrder = orderService.createOrder(request, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @PostMapping(value = "/orders/import")
    public ResponseEntity<OrderImportResponse> importOrders(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            String username = authentication.getName();
            OrderImportResponse response = orderService.importOrders(file, username);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @GetMapping("/orders/import/template")
    public ResponseEntity<byte[]> downloadTemplate(
            @RequestParam(defaultValue = "csv") String format,
            Authentication authentication) {
        try {
            byte[] templateBytes = orderService.downloadTemplate(format);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            
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
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @GetMapping("/orders/{orderId}")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Integer orderId) {
        try {
            OrderDto order = orderService.getOrderById(orderId);
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @PutMapping("/orders/{orderId}")
    public ResponseEntity<OrderDto> updateOrder(
            @PathVariable Integer orderId,
            @Valid @RequestBody OrderUpdateRequest request) {
        try {
            OrderDto updatedOrder = orderService.updateOrder(orderId, request);
            return ResponseEntity.ok(updatedOrder);
        } catch (RuntimeException e) {
            // Handle "Order not found" or "Cannot update order" errors
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            // Handle "Order can only be updated when status is PENDING" error
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}


