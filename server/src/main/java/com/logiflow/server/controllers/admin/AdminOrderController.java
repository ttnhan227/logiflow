package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.order.OrderStatusUpdateRequest;
import com.logiflow.server.dtos.admin.order.OrderOversightDto;
import com.logiflow.server.dtos.admin.order.OrderOversightListResponse;
import com.logiflow.server.services.admin.AdminOrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    @Autowired
    private AdminOrderService adminOrderService;

    @GetMapping("/oversight")
    public ResponseEntity<OrderOversightListResponse> getOversightOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            OrderOversightListResponse response = adminOrderService.getOversightOrders(status, page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderOversightDto> updateStatus(
            @PathVariable Integer orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        try {
            OrderOversightDto dto = adminOrderService.updateStatus(orderId, request.getStatus());
            return ResponseEntity.ok(dto);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{orderId}/delay")
    public ResponseEntity<OrderOversightDto> updateDelay(
            @PathVariable Integer orderId,
            @RequestBody DelayUpdateRequest request) {
        try {
            OrderOversightDto dto = adminOrderService.updateOrderDelay(orderId, request.getDelayReason(), request.getDelayMinutesExtension());
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