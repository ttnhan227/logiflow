package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.AdminPaymentRequestDtos.*;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Payment;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.payment.PaymentRepository;
import com.logiflow.server.services.payment.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageImpl;

@Service
@Transactional
public class AdminPaymentRequestService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentService paymentService;

    /**
     * Get all delivered orders that need payment review
     */
    public Page<DeliveredOrderDto> getDeliveredOrdersForPaymentReview(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByOrderStatusWithoutRelations(Order.OrderStatus.DELIVERED, pageable);
        return orders.map(this::toDeliveredOrderDto);
    }

    /**
     * Get delivered orders by customer
     */
    public Page<DeliveredOrderDto> getDeliveredOrdersByCustomer(String customerName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByOrderStatusWithoutRelations(Order.OrderStatus.DELIVERED, pageable);
        // Filter by customer name in memory since we don't have a direct query for this
        List<Order> filteredOrders = orders.stream()
            .filter(order -> order.getCustomerName() != null &&
                order.getCustomerName().toLowerCase().contains(customerName.toLowerCase()))
            .collect(Collectors.toList());
        return new PageImpl<>(filteredOrders, pageable, filteredOrders.size())
            .map(this::toDeliveredOrderDto);
    }

    /**
     * Get delivered orders by date range
     */
    public Page<DeliveredOrderDto> getDeliveredOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByOrderStatusAndCreatedAtDateWithoutRelations(
            Order.OrderStatus.DELIVERED, startDate, endDate, pageable);
        return orders.map(this::toDeliveredOrderDto);
    }

    /**
     * Get delivered orders by priority
     */
    public Page<DeliveredOrderDto> getDeliveredOrdersByPriority(String priority, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByOrderStatusWithoutRelations(Order.OrderStatus.DELIVERED, pageable);
        // Filter by priority in memory since we don't have a direct query for this
        List<Order> filteredOrders = orders.stream()
            .filter(order -> order.getPriorityLevel() != null &&
                order.getPriorityLevel().name().equalsIgnoreCase(priority))
            .collect(Collectors.toList());
        return new PageImpl<>(filteredOrders, pageable, filteredOrders.size())
            .map(this::toDeliveredOrderDto);
    }

    /**
     * Send payment request for a specific order
     */
    public void sendPaymentRequest(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getOrderStatus() != Order.OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot send payment request: Order is not delivered yet");
        }

        if (order.getPaymentStatus() != Order.PaymentStatus.PENDING) {
            throw new RuntimeException("Cannot send payment request: Order payment status is not pending");
        }

        // Send payment request email
        paymentService.sendPaymentRequest(orderId);
    }

    /**
     * Send payment requests for multiple orders
     */
    public void sendPaymentRequests(List<Integer> orderIds) {
        for (Integer orderId : orderIds) {
            try {
                sendPaymentRequest(orderId);
            } catch (Exception e) {
                // Log error but continue with other orders
                System.err.println("Failed to send payment request for order " + orderId + ": " + e.getMessage());
            }
        }
    }

    /**
     * Get payment statistics for delivered orders
     */
    public PaymentStatisticsDto getPaymentStatistics() {
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> deliveredOrdersPage = orderRepository.findByOrderStatusWithoutRelations(Order.OrderStatus.DELIVERED, pageable);
        List<Order> deliveredOrders = deliveredOrdersPage.getContent();

        // Get all payments for delivered orders
        List<Payment> payments = deliveredOrders.stream()
            .flatMap(order -> paymentRepository.findByOrder(order).stream())
            .collect(Collectors.toList());

        PaymentStatisticsDto stats = new PaymentStatisticsDto();
        stats.setTotalOrders(deliveredOrders.size());

        long paidOrders = payments.stream()
                .filter(p -> Payment.PaymentStatus.PAID.equals(p.getPaymentStatus()))
                .count();
        stats.setPaidOrders((int) paidOrders);
        stats.setPendingOrders(deliveredOrders.size() - (int) paidOrders);

        // Total revenue from only paid orders
        stats.setTotalAmount(payments.stream()
                .filter(p -> Payment.PaymentStatus.PAID.equals(p.getPaymentStatus()))
                .map(Payment::getAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        // Total amount from pending unpaid orders
        BigDecimal pendingAmount = deliveredOrders.stream()
                .filter(order -> Order.PaymentStatus.PENDING.equals(order.getPaymentStatus()))
                .map(Order::getShippingFee)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setPendingAmount(pendingAmount);

        return stats;
    }

    /**
     * Get payment history for an order
     */
    public List<PaymentHistoryDto> getPaymentHistory(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        List<Payment> payments = paymentRepository.findByOrder(order);
        // Sort by created date descending
        payments.sort((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()));

        return payments.stream()
                .map(this::toPaymentHistoryDto)
                .collect(Collectors.toList());
    }

    /**
     * Get payment history for a customer (all their orders)
     */
    public List<PaymentHistoryDto> getCustomerPaymentHistory(String customerName) {
        // Find all orders for this customer by filtering all orders
        List<Order> allOrders = orderRepository.findAll();
        List<Order> customerOrders = allOrders.stream()
                .filter(order -> order.getCustomerName() != null &&
                        order.getCustomerName().equalsIgnoreCase(customerName))
                .collect(Collectors.toList());

        // Get all payments for these orders
        List<Payment> allPayments = customerOrders.stream()
                .flatMap(order -> paymentRepository.findByOrder(order).stream())
                .collect(Collectors.toList());

        // Sort by created date descending
        allPayments.sort((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()));

        return allPayments.stream()
                .map(this::toPaymentHistoryDto)
                .collect(Collectors.toList());
    }

    /**
     * Get customers with their delivered orders for payment management
     */
    public List<CustomerOrdersDto> getCustomersWithOrders() {
        // Get all orders and filter by DELIVERED status to avoid Hibernate collection fetch warnings
        List<Order> allOrders = orderRepository.findAll();
        List<Order> deliveredOrders = allOrders.stream()
                .filter(order -> Order.OrderStatus.DELIVERED.equals(order.getOrderStatus()))
                .collect(Collectors.toList());

        // Group by customer name
        Map<String, List<Order>> ordersByCustomer = deliveredOrders.stream()
                .filter(order -> order.getCustomerName() != null && !order.getCustomerName().trim().isEmpty())
                .collect(Collectors.groupingBy(Order::getCustomerName));

        return ordersByCustomer.entrySet().stream()
                .map(entry -> {
                    String customerName = entry.getKey();
                    List<Order> customerOrders = entry.getValue();

                    CustomerOrdersDto dto = new CustomerOrdersDto();
                    dto.setCustomerName(customerName);

                    // Set customer phone (take from first order)
                    dto.setCustomerPhone(customerOrders.get(0).getCustomerPhone());

                    // Calculate totals
                    dto.setTotalOrders(customerOrders.size());
                    dto.setTotalAmount(customerOrders.stream()
                            .map(Order::getShippingFee)
                            .filter(java.util.Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));

                    // Calculate pending orders and amounts
                    List<Order> pendingOrders = customerOrders.stream()
                            .filter(order -> Order.PaymentStatus.PENDING.equals(order.getPaymentStatus()))
                            .collect(Collectors.toList());

                    dto.setPendingOrders(pendingOrders.size());
                    dto.setPendingAmount(pendingOrders.stream()
                            .map(Order::getShippingFee)
                            .filter(java.util.Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));

                    // Convert orders to DTOs
                    List<CustomerOrderDto> orderDtos = customerOrders.stream()
                            .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt())) // Most recent first
                            .map(this::toCustomerOrderDto)
                            .collect(Collectors.toList());

                    dto.setOrders(orderDtos);
                    return dto;
                })
                .sorted((c1, c2) -> Integer.compare(c2.getPendingOrders(), c1.getPendingOrders())) // Sort by pending orders descending
                .collect(Collectors.toList());
    }

    // ======= mapping =======

    private DeliveredOrderDto toDeliveredOrderDto(Order order) {
        DeliveredOrderDto dto = new DeliveredOrderDto();
        dto.setOrderId(order.getOrderId());
        dto.setCustomerName(order.getCustomerName());
        dto.setCustomerPhone(order.getCustomerPhone());
        dto.setPickupAddress(order.getPickupAddress());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setPackageDetails(order.getPackageDetails());
        dto.setWeightTons(order.getWeightTons());
        dto.setDistanceKm(order.getDistanceKm());
        dto.setShippingFee(order.getShippingFee());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null);
        dto.setPriorityLevel(order.getPriorityLevel() != null ? order.getPriorityLevel().name() : null);
        return dto;
    }

    private PaymentHistoryDto toPaymentHistoryDto(Payment payment) {
        PaymentHistoryDto dto = new PaymentHistoryDto();
        dto.setPaymentId(payment.getPaymentId().intValue());
        dto.setAmount(payment.getAmount());
        dto.setStatus(payment.getPaymentStatus() != null ? payment.getPaymentStatus().name() : null);
        dto.setPaypalOrderId(payment.getPaypalOrderId());
        dto.setTransactionId(payment.getPaypalTransactionId());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setUpdatedAt(payment.getUpdatedAt());
        return dto;
    }

    private CustomerOrderDto toCustomerOrderDto(Order order) {
        CustomerOrderDto dto = new CustomerOrderDto();
        dto.setOrderId(order.getOrderId());
        dto.setPickupAddress(order.getPickupAddress());
        dto.setWeightTons(order.getWeightTons());
        dto.setShippingFee(order.getShippingFee());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null);
        return dto;
    }
}
