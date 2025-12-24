package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.AdminPaymentRequestDtos.*;
import com.logiflow.server.services.admin.AdminPaymentRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/payment-requests")
public class AdminPaymentRequestController {

    @Autowired
    private AdminPaymentRequestService paymentRequestService;

    /**
     * Get all delivered orders that need payment review
     */
    @GetMapping("/delivered-orders")
    public ResponseEntity<Page<DeliveredOrderDto>> getDeliveredOrdersForPaymentReview(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<DeliveredOrderDto> orders = paymentRequestService.getDeliveredOrdersForPaymentReview(page, size);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get delivered orders by customer name
     */
    @GetMapping("/delivered-orders/by-customer")
    public ResponseEntity<Page<DeliveredOrderDto>> getDeliveredOrdersByCustomer(
            @RequestParam String customerName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<DeliveredOrderDto> orders = paymentRequestService.getDeliveredOrdersByCustomer(customerName, page, size);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get delivered orders by date range
     */
    @GetMapping("/delivered-orders/by-date")
    public ResponseEntity<Page<DeliveredOrderDto>> getDeliveredOrdersByDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<DeliveredOrderDto> orders = paymentRequestService.getDeliveredOrdersByDateRange(startDate, endDate, page, size);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get delivered orders by priority level
     */
    @GetMapping("/delivered-orders/by-priority")
    public ResponseEntity<Page<DeliveredOrderDto>> getDeliveredOrdersByPriority(
            @RequestParam String priority,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<DeliveredOrderDto> orders = paymentRequestService.getDeliveredOrdersByPriority(priority, page, size);
        return ResponseEntity.ok(orders);
    }

    /**
     * Send payment request for a specific order
     */
    @PostMapping("/{orderId}/send-request")
    public ResponseEntity<String> sendPaymentRequest(@PathVariable Integer orderId) {
        try {
            paymentRequestService.sendPaymentRequest(orderId);
            return ResponseEntity.ok("Payment request sent successfully for order #" + orderId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send payment request: " + e.getMessage());
        }
    }

    /**
     * Send payment requests for multiple orders
     */
    @PostMapping("/send-requests")
    public ResponseEntity<String> sendPaymentRequests(@RequestBody List<Integer> orderIds) {
        try {
            paymentRequestService.sendPaymentRequests(orderIds);
            return ResponseEntity.ok("Payment requests sent successfully for " + orderIds.size() + " orders");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send payment requests: " + e.getMessage());
        }
    }

    /**
     * Get payment statistics for delivered orders
     */
    @GetMapping("/statistics")
    public ResponseEntity<PaymentStatisticsDto> getPaymentStatistics() {
        PaymentStatisticsDto stats = paymentRequestService.getPaymentStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get payment history for an order
     */
    @GetMapping("/{orderId}/payment-history")
    public ResponseEntity<List<PaymentHistoryDto>> getPaymentHistory(@PathVariable Integer orderId) {
        List<PaymentHistoryDto> history = paymentRequestService.getPaymentHistory(orderId);
        return ResponseEntity.ok(history);
    }

    /**
     * Get payment history for a customer (all their orders)
     */
    @GetMapping("/customer/{customerName}/payment-history")
    public ResponseEntity<List<PaymentHistoryDto>> getCustomerPaymentHistory(@PathVariable String customerName) {
        List<PaymentHistoryDto> history = paymentRequestService.getCustomerPaymentHistory(customerName);
        return ResponseEntity.ok(history);
    }

    /**
     * Get customers with their delivered orders for payment management
     */
    @GetMapping("/customers-with-orders")
    public ResponseEntity<List<CustomerOrdersDto>> getCustomersWithOrders() {
        List<CustomerOrdersDto> customers = paymentRequestService.getCustomersWithOrders();
        return ResponseEntity.ok(customers);
    }

    /**
     * Get payment request summary for selected orders
     */
    @PostMapping("/summary")
    public ResponseEntity<PaymentRequestSummaryDto> getPaymentRequestSummary(@RequestBody List<Integer> orderIds) {
        // This would need to be implemented in the service layer
        // For now, return a basic summary
        PaymentRequestSummaryDto summary = new PaymentRequestSummaryDto();
        summary.setTotalOrders(orderIds.size());
        summary.setSelectedOrders(orderIds.size());
        summary.setTotalAmount(BigDecimal.ZERO); // Would calculate from actual order amounts
        summary.setOrders(List.of()); // Would populate with actual order data

        return ResponseEntity.ok(summary);
    }
}
