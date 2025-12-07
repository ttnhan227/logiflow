package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.OrderStatusUpdateRequest;
import com.logiflow.server.dtos.dispatch.OrderDto;
import com.logiflow.server.dtos.dispatch.OrderListResponse;
import com.logiflow.server.services.dispatch.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping("/oversight")
    public ResponseEntity<OrderListResponse> getOversightOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            OrderListResponse response = orderService.getOrders(status, null, page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderDto> updateStatus(
            @PathVariable Integer orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        try {
            OrderDto dto = orderService.updateStatus(orderId, request.getStatus());
            return ResponseEntity.ok(dto);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{orderId}/delay")
    public ResponseEntity<OrderDto> updateDelay(
            @PathVariable Integer orderId,
            @RequestBody DelayUpdateRequest request) {
        try {
            OrderDto dto = orderService.updateOrderDelay(orderId, request.getDelayReason(), request.getDelayMinutesExtension());
            return ResponseEntity.ok(dto);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Inner DTO for delay updates
    public static class DelayUpdateRequest {
        private String delayReason;
        private Integer delayMinutesExtension;

        public DelayUpdateRequest() {}
        public DelayUpdateRequest(String delayReason, Integer delayMinutesExtension) {
            this.delayReason = delayReason;
            this.delayMinutesExtension = delayMinutesExtension;
        }

        public String getDelayReason() {
            return delayReason;
        }
        public void setDelayReason(String delayReason) {
            this.delayReason = delayReason;
        }

        public Integer getDelayMinutesExtension() {
            return delayMinutesExtension;
        }
        public void setDelayMinutesExtension(Integer delayMinutesExtension) {
            this.delayMinutesExtension = delayMinutesExtension;
        }
    }
}