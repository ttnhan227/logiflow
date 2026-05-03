package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.AdminPaymentRequestDtos.*;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

public interface AdminPaymentRequestService {

    Page<DeliveredOrderDto> getDeliveredOrdersForPaymentReview(int page, int size);

    Page<DeliveredOrderDto> getDeliveredOrdersByCustomer(String customerName, int page, int size);

    Page<DeliveredOrderDto> getDeliveredOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate, int page, int size);

    Page<DeliveredOrderDto> getDeliveredOrdersByPriority(String priority, int page, int size);

    void sendPaymentRequest(Integer orderId);

    void sendPaymentRequests(List<Integer> orderIds);

    PaymentStatisticsDto getPaymentStatistics();

    List<PaymentHistoryDto> getPaymentHistory(Integer orderId);

    List<PaymentHistoryDto> getCustomerPaymentHistory(String customerName);

    List<CustomerOrdersDto> getCustomersWithOrders();
}
