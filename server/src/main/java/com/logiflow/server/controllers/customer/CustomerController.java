package com.logiflow.server.controllers.customer;

import com.logiflow.server.dtos.customer.CustomerDtos.*;
import com.logiflow.server.services.customer.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/me")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // 1) POST /api/customer/me/orders - Create new order
    @PostMapping("/orders")
    public ResponseEntity<OrderDto> createOrder(
            @RequestBody CreateOrderRequest request,
            Authentication authentication
    ) {
        if (request == null || request.getCustomerName() == null ||
            request.getPickupAddress() == null || request.getDeliveryAddress() == null) {
            return ResponseEntity.badRequest().build();
        }
        var result = customerService.createOrder(authentication.getName(), request);
        return ResponseEntity.ok(result);
    }

    // 2) GET /api/customer/me/orders - Get all my orders
    @GetMapping("/orders")
    public ResponseEntity<List<OrderSummaryDto>> getMyOrders(Authentication authentication) {
        var result = customerService.getMyOrders(authentication.getName());
        return ResponseEntity.ok(result);
    }

    // 3) GET /api/customer/me/orders/{orderId} - Get specific order details
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<OrderDto> getOrderById(
            @PathVariable Integer orderId,
            Authentication authentication
    ) {
        var result = customerService.getOrderById(authentication.getName(), orderId);
        return ResponseEntity.ok(result);
    }

    // 4) GET /api/customer/me/orders/{orderId}/track - Track order in real-time
    @GetMapping("/orders/{orderId}/track")
    public ResponseEntity<TrackOrderResponse> trackOrder(
            @PathVariable Integer orderId,
            Authentication authentication
    ) {
        var result = customerService.trackOrder(authentication.getName(), orderId);
        return ResponseEntity.ok(result);
    }

    // 5) GET /api/customer/me/profile - Get customer profile
    @GetMapping("/profile")
    public ResponseEntity<CustomerProfileDto> getProfile(Authentication authentication) {
        var result = customerService.getProfile(authentication.getName());
        return ResponseEntity.ok(result);
    }

    // 6) PUT /api/customer/me/profile - Update customer profile
    @PutMapping("/profile")
    public ResponseEntity<CustomerProfileDto> updateProfile(
            @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        var result = customerService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(result);
    }

    // 7) GET /api/customer/me/history - Get order history
    @GetMapping("/history")
    public ResponseEntity<List<OrderHistoryDto>> getOrderHistory(Authentication authentication) {
        var result = customerService.getOrderHistory(authentication.getName());
        return ResponseEntity.ok(result);
    }


}
