package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.OrderCreateRequest;
import com.logiflow.server.dtos.dispatch.OrderDto;
import com.logiflow.server.dtos.dispatch.OrderImportResponse;
import com.logiflow.server.dtos.dispatch.OrderListResponse;
import com.logiflow.server.dtos.dispatch.OrderUpdateRequest;
import org.springframework.web.multipart.MultipartFile;

public interface OrderService {
    OrderListResponse getOrders(String status, String date, int page, int size);
    OrderDto createOrder(OrderCreateRequest request, String username);
    OrderImportResponse importOrders(MultipartFile file, String username);
    byte[] downloadTemplate(String format);
    OrderDto getOrderById(Integer orderId);
    OrderDto updateOrder(Integer orderId, OrderUpdateRequest request);
}