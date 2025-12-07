package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.order.OrderOversightDto;
import com.logiflow.server.dtos.admin.order.OrderOversightListResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface AdminOrderService {
    OrderOversightListResponse getOversightOrders(String status, int page, int size);
    OrderOversightDto updateStatus(Integer orderId, String status);
    OrderOversightDto updateOrderDelay(Integer orderId, String delayReason, Integer delayMinutesExtension);
    // Add more admin-specific methods as needed
}
