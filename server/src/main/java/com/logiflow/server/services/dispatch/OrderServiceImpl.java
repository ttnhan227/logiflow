package com.logiflow.server.services.dispatch;

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
import com.logiflow.server.websocket.NotificationService;
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
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private ShippingFeeCalculator shippingFeeCalculator;

    @Autowired(required = false)
    private MapsService mapsService;

    @Autowired
    private NotificationService notificationService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    @Override
    public OrderListResponse getOrders(String status, String date, int page, int size) {
        if (page < 0) page = 0;
        if (size < 1) size = 10;
        if (size > 100) size = 100;

        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage;


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


        List<OrderDto> orderDtos = orderPage.getContent().stream()
                .map(OrderDto::fromOrder)
                .collect(Collectors.toList());
        OrderListResponse response = new OrderListResponse();
        response.setOrders(orderDtos);
        response.setCurrentPage(orderPage.getNumber());
        response.setPageSize(orderPage.getSize());
        response.setTotalItems(orderPage.getTotalElements());
        response.setTotalPages(orderPage.getTotalPages());
        response.setHasNext(orderPage.hasNext());
        response.setHasPrevious(orderPage.hasPrevious());

        return response;
    }

    @Override
    public OrderDto createOrder(OrderCreateRequest request, String username) {
        User createdBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setPickupAddress(request.getPickupAddress());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setPackageDetails(request.getPackageDetails());
        order.setPriorityLevel(request.getPriorityLevel());
        order.setOrderStatus(Order.OrderStatus.PENDING);
        order.setCreatedBy(createdBy);
        order.setCreatedAt(LocalDateTime.now());

        // Set distance, weight, and package value
        order.setDistanceKm(request.getDistanceKm());
        order.setWeightKg(request.getWeightKg());
        order.setPackageValue(request.getPackageValue());

        // Calculate distance automatically if not provided and MapsService is available
        if (order.getDistanceKm() == null && mapsService != null) {
            try {
                var distanceResult = mapsService.calculateDistance(
                        request.getPickupAddress(),
                        request.getDeliveryAddress()
                );
                if (distanceResult != null && distanceResult.getDistanceMeters() != null) {
                    java.math.BigDecimal distanceKm = new java.math.BigDecimal(distanceResult.getDistanceMeters())
                            .divide(new java.math.BigDecimal("1000"), 2, java.math.RoundingMode.HALF_UP);
                    order.setDistanceKm(distanceKm);
                }
            } catch (Exception e) {
                System.err.println("Failed to calculate distance: " + e.getMessage());
            }
        }

        // Calculate shipping fee
        java.math.BigDecimal shippingFee = shippingFeeCalculator.calculateShippingFee(
                order.getDistanceKm(),
                order.getWeightKg(),
                order.getPackageValue(),
                order.getPriorityLevel()
        );
        order.setShippingFee(shippingFee);

        if (request.getTripId() != null) {
            Trip trip = tripRepository.findById(request.getTripId())
                    .orElseThrow(() -> new RuntimeException("Trip not found with id: " + request.getTripId()));
            order.setTrip(trip);
        }

        Order savedOrder = orderRepository.save(order);

        Order orderWithRelations = orderRepository.findByIdWithRelations(savedOrder.getOrderId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve saved order"));

        // Send notification to dispatchers about new order
        try {
            notificationService.notifyNewOrder(
                savedOrder.getOrderId(),
                request.getCustomerName(),
                request.getPriorityLevel().name()
            );

            // Extra urgent haul alert (hard-coded rule)
            if (request.getPriorityLevel() == Order.PriorityLevel.URGENT) {
                notificationService.broadcastToAdmins(
                    "URGENT_HAUL",
                    "CRITICAL",
                    "URGENT haul needs attention",
                    "Order #" + savedOrder.getOrderId() + " (" + request.getCustomerName() + ") is URGENT. Please dispatch ASAP."
                );
            }
        } catch (Exception e) {
            // Log error but don't fail the order creation
            System.err.println("Failed to send notification for new order: " + e.getMessage());
        }

        return OrderDto.fromOrder(orderWithRelations);
    }

    @Override
    public OrderImportResponse importOrders(MultipartFile file, String username) {
        User createdBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        List<OrderCreateRequest> requests = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        String fileName = file.getOriginalFilename();
        String fileExtension = fileName != null && fileName.contains(".")
                ? fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase()
                : "";

        try {
            if ("csv".equals(fileExtension)) {
                requests = OrderFileParser.parseCSV(file.getInputStream());
            } else if ("xlsx".equals(fileExtension) || "xls".equals(fileExtension)) {
                requests = OrderFileParser.parseExcel(file.getInputStream());
            } else {
                throw new RuntimeException("Unsupported file format. Please use CSV or Excel (.xlsx, .xls)");
            }
        } catch (IOException | CsvException e) {
            errors.add("Error parsing file: " + e.getMessage());
            return new OrderImportResponse(0, 0, 0, new ArrayList<>(), errors);
        }

        int totalRows = requests.size();
        int successCount = 0;
        int failureCount = 0;
        List<OrderDto> createdOrders = new ArrayList<>();

        for (int i = 0; i < requests.size(); i++) {
            OrderCreateRequest request = requests.get(i);
            int rowNumber = i + 2; // +2 because row 1 is header, and we start from index 0

            try {
                if (request.getCustomerName() == null || request.getCustomerName().trim().isEmpty()) {
                    errors.add("Row " + rowNumber + ": Customer name is required");
                    failureCount++;
                    continue;
                }

                if (request.getPickupAddress() == null || request.getPickupAddress().trim().isEmpty()) {
                    errors.add("Row " + rowNumber + ": Pickup address is required");
                    failureCount++;
                    continue;
                }

                if (request.getDeliveryAddress() == null || request.getDeliveryAddress().trim().isEmpty()) {
                    errors.add("Row " + rowNumber + ": Delivery address is required");
                    failureCount++;
                    continue;
                }

                if (request.getPriorityLevel() == null) {
                    request.setPriorityLevel(Order.PriorityLevel.NORMAL);
                }

                Order order = new Order();
                order.setCustomerName(request.getCustomerName().trim());
                order.setCustomerPhone(request.getCustomerPhone() != null ? request.getCustomerPhone().trim() : null);
                order.setPickupAddress(request.getPickupAddress().trim());
                order.setDeliveryAddress(request.getDeliveryAddress().trim());
                order.setPackageDetails(request.getPackageDetails() != null ? request.getPackageDetails().trim() : null);
                order.setPriorityLevel(request.getPriorityLevel());
                order.setOrderStatus(Order.OrderStatus.PENDING);
                order.setCreatedBy(createdBy);
                order.setCreatedAt(LocalDateTime.now());

                order.setDistanceKm(request.getDistanceKm());
                order.setWeightKg(request.getWeightKg());
                order.setPackageValue(request.getPackageValue());


                if (order.getDistanceKm() == null && mapsService != null) {
                    try {
                        var distanceResult = mapsService.calculateDistance(
                                request.getPickupAddress(),
                                request.getDeliveryAddress()
                        );
                        if (distanceResult != null && distanceResult.getDistanceMeters() != null) {
                            BigDecimal distanceKm = new BigDecimal(distanceResult.getDistanceMeters())
                                    .divide(new BigDecimal("1000"), 2, RoundingMode.HALF_UP);
                            order.setDistanceKm(distanceKm);
                        }
                    } catch (Exception e) {
                        System.err.println("Row " + rowNumber + ": Failed to calculate distance: " + e.getMessage());
                    }
                }


                BigDecimal shippingFee = shippingFeeCalculator.calculateShippingFee(
                        order.getDistanceKm(),
                        order.getWeightKg(),
                        order.getPackageValue(),
                        order.getPriorityLevel()
                );
                order.setShippingFee(shippingFee);

                if (request.getTripId() != null) {
                    Trip trip = tripRepository.findById(request.getTripId()).orElse(null);
                    if (trip != null) {
                        order.setTrip(trip);
                    }
                }

                Order savedOrder = orderRepository.save(order);
                Order orderWithRelations = orderRepository.findByIdWithRelations(savedOrder.getOrderId())
                        .orElse(savedOrder);
                createdOrders.add(OrderDto.fromOrder(orderWithRelations));
                successCount++;

            } catch (Exception e) {
                errors.add("Row " + rowNumber + ": " + e.getMessage());
                failureCount++;
            }
        }

        return new OrderImportResponse(totalRows, successCount, failureCount, createdOrders, errors);
    }

    @Override
    public byte[] downloadTemplate(String format) {
        try {
            if ("csv".equalsIgnoreCase(format)) {
                return generateCSVTemplate();
            } else if ("xlsx".equalsIgnoreCase(format) || "excel".equalsIgnoreCase(format)) {
                return generateExcelTemplate();
            } else {
                throw new RuntimeException("Unsupported format. Use 'csv' or 'xlsx'");
            }
        } catch (IOException e) {
            throw new RuntimeException("Error generating template: " + e.getMessage());
        }
    }

    private byte[] generateCSVTemplate() throws IOException {
        StringWriter writer = new StringWriter();
        try (CSVWriter csvWriter = new CSVWriter(writer)) {

            csvWriter.writeNext(new String[]{
                    "Customer Name",
                    "Customer Phone",
                    "Pickup Address",
                    "Delivery Address",
                    "Package Details",
                    "Priority Level",
                    "Distance (km)",
                    "Weight (kg)",
                    "Package Value (VND)",
                    "Trip ID"
            });

            csvWriter.writeNext(new String[]{
                    "Nguyen Van A",
                    "+84-912-345-678",
                    "123 Le Loi, District 1, Ho Chi Minh City",
                    "456 Nguyen Hue, District 1, Ho Chi Minh City",
                    "5kg documents",
                    "NORMAL",
                    "10.5",
                    "5.0",
                    "500000",
                    ""
            });

            return writer.toString().getBytes("UTF-8");
        }
    }

    private byte[] generateExcelTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Orders Template");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            String[] headers = {
                    "Customer Name",
                    "Customer Phone",
                    "Pickup Address",
                    "Delivery Address",
                    "Package Details",
                    "Priority Level",
                    "Distance (km)",
                    "Weight (kg)",
                    "Package Value (VND)",
                    "Trip ID"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("Nguyen Van A");
            exampleRow.createCell(1).setCellValue("+84-912-345-678");
            exampleRow.createCell(2).setCellValue("123 Le Loi, District 1, Ho Chi Minh City");
            exampleRow.createCell(3).setCellValue("456 Nguyen Hue, District 1, Ho Chi Minh City");
            exampleRow.createCell(4).setCellValue("5kg documents");
            exampleRow.createCell(5).setCellValue("NORMAL");
            exampleRow.createCell(6).setCellValue(10.5); // Distance in km
            exampleRow.createCell(7).setCellValue(5.0); // Weight in kg
            exampleRow.createCell(8).setCellValue(500000); // Package value in VND
            exampleRow.createCell(9).setCellValue("");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    @Override
    public OrderDto getOrderById(Integer orderId) {
        Order order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        return OrderDto.fromOrder(order);
    }

    @Override
    public OrderDto updateOrder(Integer orderId, OrderUpdateRequest request) {
        Order order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (order.getOrderStatus() != Order.OrderStatus.PENDING) {
            throw new RuntimeException("Order can only be updated when status is PENDING. Current status: " + order.getOrderStatus());
        }

        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setPickupAddress(request.getPickupAddress());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setPackageDetails(request.getPackageDetails());
        order.setPriorityLevel(request.getPriorityLevel());

        order.setDistanceKm(request.getDistanceKm());
        order.setWeightKg(request.getWeightKg());
        order.setPackageValue(request.getPackageValue());

        if (order.getDistanceKm() == null && mapsService != null) {
            try {
                var distanceResult = mapsService.calculateDistance(
                        request.getPickupAddress(),
                        request.getDeliveryAddress()
                );
                if (distanceResult != null && distanceResult.getDistanceMeters() != null) {
                    java.math.BigDecimal distanceKm = new java.math.BigDecimal(distanceResult.getDistanceMeters())
                            .divide(new java.math.BigDecimal("1000"), 2, java.math.RoundingMode.HALF_UP);
                    order.setDistanceKm(distanceKm);
                }
            } catch (Exception e) {
                System.err.println("Failed to calculate distance: " + e.getMessage());
            }
        }

        BigDecimal shippingFee = shippingFeeCalculator.calculateShippingFee(
                order.getDistanceKm(),
                order.getWeightKg(),
                order.getPackageValue(),
                order.getPriorityLevel()
        );
        order.setShippingFee(shippingFee);


        Order updatedOrder = orderRepository.save(order);

        Order orderWithRelations = orderRepository.findByIdWithRelations(updatedOrder.getOrderId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve updated order"));

        return OrderDto.fromOrder(orderWithRelations);
    }

}
