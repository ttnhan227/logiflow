package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.AdminPaymentRequestDtos.*;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Payment;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.payment.PaymentRepository;
import com.logiflow.server.services.payment.PaymentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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

@Service
@Transactional
public class AdminPaymentRequestServiceImpl implements AdminPaymentRequestService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    public AdminPaymentRequestServiceImpl(
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
    }

    @Override
    public Page<DeliveredOrderDto> getDeliveredOrdersForPaymentReview(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByOrderStatusWithoutRelations(Order.OrderStatus.DELIVERED, pageable);
        return orders.map(this::toDeliveredOrderDto);
    }

    @Override
    public Page<DeliveredOrderDto> getDeliveredOrdersByCustomer(String customerName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByOrderStatusWithoutRelations(Order.OrderStatus.DELIVERED, pageable);
        List<Order> filteredOrders = orders.stream()
            .filter(order -> order.getCustomerName() != null &&
                order.getCustomerName().toLowerCase().contains(customerName.toLowerCase()))
            .collect(Collectors.toList());
        return new PageImpl<>(filteredOrders, pageable, filteredOrders.size())
            .map(this::toDeliveredOrderDto);
    }

    @Override
    public Page<DeliveredOrderDto> getDeliveredOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByOrderStatusAndCreatedAtDateWithoutRelations(
            Order.OrderStatus.DELIVERED, startDate, endDate, pageable);
        return orders.map(this::toDeliveredOrderDto);
    }

    @Override
    public Page<DeliveredOrderDto> getDeliveredOrdersByPriority(String priority, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByOrderStatusWithoutRelations(Order.OrderStatus.DELIVERED, pageable);
        List<Order> filteredOrders = orders.stream()
            .filter(order -> order.getPriorityLevel() != null &&
                order.getPriorityLevel().name().equalsIgnoreCase(priority))
            .collect(Collectors.toList());
        return new PageImpl<>(filteredOrders, pageable, filteredOrders.size())
            .map(this::toDeliveredOrderDto);
    }

    @Override
    public void sendPaymentRequest(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getOrderStatus() != Order.OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot send payment request: Order is not delivered yet");
        }

        if (order.getPaymentStatus() != Order.PaymentStatus.PENDING) {
            throw new RuntimeException("Cannot send payment request: Order payment status is not pending");
        }

        paymentService.sendPaymentRequest(orderId);
    }

    @Override
    public void sendPaymentRequests(List<Integer> orderIds) {
        for (Integer orderId : orderIds) {
            try {
                sendPaymentRequest(orderId);
            } catch (Exception e) {
                System.err.println("Failed to send payment request for order " + orderId + ": " + e.getMessage());
            }
        }
    }

    @Override
    public PaymentStatisticsDto getPaymentStatistics() {
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> deliveredOrdersPage = orderRepository.findByOrderStatusWithoutRelations(Order.OrderStatus.DELIVERED, pageable);
        List<Order> deliveredOrders = deliveredOrdersPage.getContent();

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

        stats.setTotalAmount(payments.stream()
                .filter(p -> Payment.PaymentStatus.PAID.equals(p.getPaymentStatus()))
                .map(Payment::getAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        BigDecimal pendingAmount = deliveredOrders.stream()
                .filter(order -> Order.PaymentStatus.PENDING.equals(order.getPaymentStatus()))
                .map(Order::getShippingFee)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setPendingAmount(pendingAmount);

        return stats;
    }

    @Override
    public List<PaymentHistoryDto> getPaymentHistory(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        List<Payment> payments = paymentRepository.findByOrder(order);
        payments.sort((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()));

        return payments.stream()
                .map(this::toPaymentHistoryDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<PaymentHistoryDto> getCustomerPaymentHistory(String customerName) {
        List<Order> allOrders = orderRepository.findAll();
        List<Order> customerOrders = allOrders.stream()
                .filter(order -> order.getCustomerName() != null &&
                        order.getCustomerName().equalsIgnoreCase(customerName))
                .collect(Collectors.toList());

        List<Payment> allPayments = customerOrders.stream()
                .flatMap(order -> paymentRepository.findByOrder(order).stream())
                .collect(Collectors.toList());

        allPayments.sort((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()));

        return allPayments.stream()
                .map(this::toPaymentHistoryDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CustomerOrdersDto> getCustomersWithOrders() {
        List<Order> allOrders = orderRepository.findAll();
        List<Order> deliveredOrders = allOrders.stream()
                .filter(order -> Order.OrderStatus.DELIVERED.equals(order.getOrderStatus()))
                .collect(Collectors.toList());

        Map<String, List<Order>> ordersByCustomer = deliveredOrders.stream()
                .filter(order -> order.getCustomerName() != null && !order.getCustomerName().trim().isEmpty())
                .collect(Collectors.groupingBy(Order::getCustomerName));

        return ordersByCustomer.entrySet().stream()
                .map(entry -> {
                    String customerName = entry.getKey();
                    List<Order> customerOrders = entry.getValue();

                    CustomerOrdersDto dto = new CustomerOrdersDto();
                    dto.setCustomerName(customerName);
                    dto.setCustomerPhone(customerOrders.get(0).getCustomerPhone());
                    dto.setTotalOrders(customerOrders.size());
                    dto.setTotalAmount(customerOrders.stream()
                            .map(Order::getShippingFee)
                            .filter(java.util.Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));

                    List<Order> pendingOrders = customerOrders.stream()
                            .filter(order -> Order.PaymentStatus.PENDING.equals(order.getPaymentStatus()))
                            .collect(Collectors.toList());

                    dto.setPendingOrders(pendingOrders.size());
                    dto.setPendingAmount(pendingOrders.stream()
                            .map(Order::getShippingFee)
                            .filter(java.util.Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));

                    List<CustomerOrderDto> orderDtos = customerOrders.stream()
                            .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                            .map(this::toCustomerOrderDto)
                            .collect(Collectors.toList());

                    dto.setOrders(orderDtos);
                    return dto;
                })
                .sorted((c1, c2) -> Integer.compare(c2.getPendingOrders(), c1.getPendingOrders()))
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
