 package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.order.OrderOversightDto;
import com.logiflow.server.dtos.admin.order.OrderOversightListResponse;
import com.logiflow.server.dtos.dispatch.OrderCreateRequest;
import com.logiflow.server.dtos.dispatch.OrderDto;
import com.logiflow.server.dtos.dispatch.OrderImportResponse;
import com.logiflow.server.dtos.dispatch.OrderListResponse;
import com.logiflow.server.dtos.dispatch.OrderUpdateRequest;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.services.dispatch.ShippingFeeCalculator;
import com.logiflow.server.services.maps.MapsService;
import com.logiflow.server.utils.OrderFileParser;
// import removed: DriverComplianceService
import com.opencsv.CSVWriter;
import com.opencsv.exceptions.CsvException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class AdminOrderServiceImpl implements AdminOrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired(required = false)
    private MapsService mapsService;


    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    @Override
    public OrderOversightListResponse getOversightOrders(String status, int page, int size) {
        if (page < 0) page = 0;
        if (size < 1) size = 10;
        if (size > 100) size = 100;

        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage;

        // Add date parameter for filtering
        String date = null; // TODO: Pass date from controller if needed

        Order.OrderStatus orderStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                orderStatus = null;
            }
        }

        LocalDateTime startDate = null;
        LocalDateTime endDate = null;
        if (date != null && !date.trim().isEmpty()) {
            try {
                LocalDate filterDate = LocalDate.parse(date, DATE_FORMATTER);
                startDate = filterDate.atStartOfDay();
                endDate = filterDate.plusDays(1).atStartOfDay();
            } catch (DateTimeParseException e) {
                startDate = null;
                endDate = null;
            }
        }

        if (orderStatus != null && startDate != null && endDate != null) {
            orderPage = orderRepository.findByOrderStatusAndCreatedAtDate(orderStatus, startDate, endDate, pageable);
        } else if (orderStatus != null) {
            orderPage = orderRepository.findByOrderStatus(orderStatus, pageable);
        } else if (startDate != null && endDate != null) {
            orderPage = orderRepository.findByCreatedAtDate(startDate, endDate, pageable);
        } else {
            orderPage = orderRepository.findAllWithRelations(pageable);
        }

        List<OrderOversightDto> orderDtos = orderPage.getContent().stream()
                .map(OrderOversightDto::fromOrder)
                .collect(Collectors.toList());
        OrderOversightListResponse response = new OrderOversightListResponse();
        response.setOrders(orderDtos);
        response.setCurrentPage(orderPage.getNumber());
        response.setPageSize(orderPage.getSize());
        response.setTotalItems(orderPage.getTotalElements());
        response.setTotalPages(orderPage.getTotalPages());
        response.setHasNext(orderPage.hasNext());
        response.setHasPrevious(orderPage.hasPrevious());

        return response;
    }

    public OrderOversightDto updateStatus(Integer orderId, String status) {
        com.logiflow.server.models.Order order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (status == null || status.isBlank()) {
            throw new RuntimeException("Status is required");
        }

        com.logiflow.server.models.Order.OrderStatus parsedStatus;
        try {
            parsedStatus = com.logiflow.server.models.Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid status: " + status);
        }

        order.setOrderStatus(parsedStatus);
        com.logiflow.server.models.Order saved = orderRepository.save(order);

        com.logiflow.server.models.Order orderWithRelations = orderRepository.findByIdWithRelations(saved.getOrderId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated order"));
        return OrderOversightDto.fromOrder(orderWithRelations);
    }

    @Override
    public OrderOversightDto updateOrderDelay(Integer orderId, String delayReason, Integer delayMinutesExtension) {
        com.logiflow.server.models.Order order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (delayReason == null || delayReason.isBlank()) {
            throw new RuntimeException("Delay reason is required");
        }
        if (delayMinutesExtension == null || delayMinutesExtension < 0) {
            throw new RuntimeException("Delay minutes must be non-negative");
        }

        // Store delay reason and accumulate SLA extension
        order.setDelayReason(delayReason);
        // Extend SLA by the specified minutes (accumulate existing extensions)
        Integer currentExtension = order.getSlaExtensionMinutes() != null ? order.getSlaExtensionMinutes() : 0;
        order.setSlaExtensionMinutes(currentExtension + delayMinutesExtension);

        com.logiflow.server.models.Order saved = orderRepository.save(order);
        com.logiflow.server.models.Order orderWithRelations = orderRepository.findByIdWithRelations(saved.getOrderId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated order"));
        return OrderOversightDto.fromOrder(orderWithRelations);
    }

}

