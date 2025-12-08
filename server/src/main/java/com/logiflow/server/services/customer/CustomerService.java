package com.logiflow.server.services.customer;

import com.logiflow.server.dtos.customer.CustomerDtos.*;
import com.logiflow.server.models.User;

import java.util.List;

public interface CustomerService {
    User getCurrentCustomer(String authName);

    // Order management
    OrderDto createOrder(String customerUsername, CreateOrderRequest request);
    OrderDto getOrderById(String customerUsername, Integer orderId);
    List<OrderSummaryDto> getMyOrders(String customerUsername);
    TrackOrderResponse trackOrder(String customerUsername, Integer orderId);

    // Profile management
    CustomerProfileDto getProfile(String customerUsername);
    CustomerProfileDto updateProfile(String customerUsername, UpdateProfileRequest request);

    // History
    List<OrderHistoryDto> getOrderHistory(String customerUsername);
}
