package com.logiflow.server.services.customer;

import com.logiflow.server.dtos.customer.CustomerDtos.*;
import com.logiflow.server.models.*;
import com.logiflow.server.repositories.customer.CustomerRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.websocket.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final TripRepository tripRepository;
    private final NotificationService notificationService;

    public CustomerServiceImpl(UserRepository userRepository,
                             CustomerRepository customerRepository,
                             OrderRepository orderRepository,
                             TripRepository tripRepository,
                             NotificationService notificationService) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.tripRepository = tripRepository;
        this.notificationService = notificationService;
    }

    @Override
    public User getCurrentCustomer(String authName) {
        Optional<User> userOpt;
        try {
            Integer id = Integer.parseInt(authName);
            userOpt = userRepository.findById(id);
        } catch (NumberFormatException ex) {
            userOpt = userRepository.findByUsername(authName);
        }
        return userOpt.orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    @Override
    public OrderDto createOrder(String customerUsername, CreateOrderRequest request) {
        User customer = getCurrentCustomer(customerUsername);

        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setPickupAddress(request.getPickupAddress());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setPackageDetails(request.getPackageDetails());
        order.setCreatedBy(customer);

        // Set priority level
        if ("URGENT".equalsIgnoreCase(request.getPriority())) {
            order.setPriorityLevel(Order.PriorityLevel.URGENT);
        } else {
            order.setPriorityLevel(Order.PriorityLevel.NORMAL);
        }

        // Set default status
        order.setOrderStatus(Order.OrderStatus.PENDING);

        Order savedOrder = orderRepository.save(order);

        // Send notification to customer
        notificationService.sendOrderNotification(
            customer.getUserId(),
            savedOrder.getOrderId(),
            "ORDER_CREATED",
            "Your order #" + savedOrder.getOrderId() + " has been created successfully",
            "PENDING"
        );

        return mapToOrderDto(savedOrder);
    }

    @Override
    public OrderDto getOrderById(String customerUsername, Integer orderId) {
        User customer = getCurrentCustomer(customerUsername);
        Order order = orderRepository.findByCustomerIdAndOrderId(customer.getUserId(), orderId)
                .orElseThrow(() -> new RuntimeException("Order not found or doesn't belong to you"));

        return mapToOrderDto(order);
    }

    @Override
    public List<OrderSummaryDto> getMyOrders(String customerUsername) {
        User customer = getCurrentCustomer(customerUsername);
        List<Order> orders = orderRepository.findByCustomerId(customer.getUserId());

        return orders.stream().map(this::mapToOrderSummaryDto).collect(Collectors.toList());
    }

    @Override
    public TrackOrderResponse trackOrder(String customerUsername, Integer orderId) {
        User customer = getCurrentCustomer(customerUsername);
        Order order = orderRepository.findByCustomerIdAndOrderId(customer.getUserId(), orderId)
                .orElseThrow(() -> new RuntimeException("Order not found or doesn't belong to you"));

        TrackOrderResponse response = new TrackOrderResponse();
        response.setOrderId(order.getOrderId());
        response.setOrderStatus(order.getOrderStatus().name());

        // Get trip status if order is assigned to a trip
        List<StatusUpdateDto> statusHistory = List.of(
            new StatusUpdateDto(order.getOrderStatus().name(), order.getCreatedAt(), "Order created")
        );

        if (order.getTrip() != null) {
            Trip trip = order.getTrip();
            response.setTripStatus(trip.getStatus());
            response.setEstimatedPickupTime(trip.getScheduledDeparture());
            response.setEstimatedDeliveryTime(trip.getScheduledArrival());
            response.setActualPickupTime(trip.getActualDeparture());
            response.setActualDeliveryTime(trip.getActualArrival());

            // Get driver info if trip has assignments
            if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
                TripAssignment assignment = trip.getTripAssignments().get(0);
                if (assignment.getDriver() != null) {
                    Driver driver = assignment.getDriver();
                    response.setDriverName(driver.getUser().getUsername());
                    response.setDriverPhone(driver.getPhone());
                    response.setVehiclePlate(trip.getVehicle() != null ? trip.getVehicle().getLicensePlate() : null);
                    response.setVehicleType(trip.getVehicle() != null ? trip.getVehicle().getVehicleType() : null);
                    response.setCurrentLat(driver.getCurrentLocationLat());
                    response.setCurrentLng(driver.getCurrentLocationLng());
                }
            }

            // Add trip status updates
            statusHistory = List.of(
                new StatusUpdateDto("CREATED", order.getCreatedAt(), "Order created"),
                new StatusUpdateDto("ASSIGNED", trip.getCreatedAt(), "Order assigned to driver"),
                new StatusUpdateDto("IN_TRANSIT", trip.getActualDeparture(), "Driver picked up the order"),
                new StatusUpdateDto("DELIVERED", trip.getActualArrival(), "Order delivered successfully")
            );
        }

        response.setStatusHistory(statusHistory);
        return response;
    }

    @Override
    public CustomerProfileDto getProfile(String customerUsername) {
        Customer customer = getCurrentCustomerEntity(customerUsername);

        CustomerProfileDto profile = new CustomerProfileDto();
        profile.setUserId(customer.getUser().getUserId());
        profile.setUsername(customer.getUser().getUsername());
        profile.setEmail(customer.getUser().getEmail());
        profile.setFullName(customer.getUser().getFullName());
        profile.setPhone(customer.getBusinessPhone());
        profile.setAddress(customer.getDefaultDeliveryAddress());
        profile.setPaymentMethod(customer.getPreferredPaymentMethod());
        profile.setProfilePictureUrl(customer.getUser().getProfilePictureUrl());
        profile.setCreatedAt(customer.getUser().getCreatedAt());
        profile.setTotalOrders(customer.getTotalOrders());
        profile.setTotalSpent(customer.getTotalSpent());

        return profile;
    }

    private Customer getCurrentCustomerEntity(String authName) {
        User user = getCurrentCustomer(authName);
        return customerRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Customer profile not found"));
    }

    @Override
    public CustomerProfileDto updateProfile(String customerUsername, UpdateProfileRequest request) {
        Customer customer = getCurrentCustomerEntity(customerUsername);

        // Update Customer entity fields
        if (request.getFullName() != null) {
            customer.getUser().setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            customer.setBusinessPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            customer.setDefaultDeliveryAddress(request.getAddress());
        }
        if (request.getPaymentMethod() != null) {
            customer.setPreferredPaymentMethod(request.getPaymentMethod());
        }
        if (request.getProfilePictureUrl() != null) {
            customer.getUser().setProfilePictureUrl(request.getProfilePictureUrl());
        }

        // Save both User and Customer
        userRepository.save(customer.getUser());
        customerRepository.save(customer);

        return getProfile(customerUsername);
    }

    @Override
    public List<OrderHistoryDto> getOrderHistory(String customerUsername) {
        User customer = getCurrentCustomer(customerUsername);
        List<Order> orders = orderRepository.findByCustomerId(customer.getUserId());

        return orders.stream()
                .filter(order -> order.getOrderStatus() == Order.OrderStatus.DELIVERED
                              || order.getOrderStatus() == Order.OrderStatus.CANCELLED)
                .map(order -> {
                    OrderHistoryDto history = new OrderHistoryDto();
                    history.setOrderId(order.getOrderId());
                    history.setPickupAddress(order.getPickupAddress());
                    history.setDeliveryAddress(order.getDeliveryAddress());
                    history.setOrderStatus(order.getOrderStatus().name());
                    history.setCreatedAt(order.getCreatedAt());
                    if (order.getTrip() != null && order.getTrip().getActualArrival() != null) {
                        history.setDeliveredAt(order.getTrip().getActualArrival());
                    }
                    history.setDeliveryFee(BigDecimal.ZERO); // Fee calculation not implemented yet

                    // Get driver info
                    if (order.getTrip() != null && order.getTrip().getTripAssignments() != null
                        && !order.getTrip().getTripAssignments().isEmpty()) {
                        Driver driver = order.getTrip().getTripAssignments().get(0).getDriver();
                        if (driver != null) {
                            history.setDriverName(driver.getUser().getUsername());
                        }
                    }

                    return history;
                })
                .collect(Collectors.toList());
    }

    private OrderDto mapToOrderDto(Order order) {
        OrderDto dto = new OrderDto();
        dto.setOrderId(order.getOrderId());
        dto.setCustomerName(order.getCustomerName());
        dto.setCustomerPhone(order.getCustomerPhone());
        dto.setPickupAddress(order.getPickupAddress());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setPackageDetails(order.getPackageDetails());
        dto.setPriorityLevel(order.getPriorityLevel().name());
        dto.setOrderStatus(order.getOrderStatus().name());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setDeliveryFee(BigDecimal.ZERO); // Fee calculation not implemented

        if (order.getTrip() != null) {
            Trip trip = order.getTrip();
            dto.setTripId(trip.getTripId());
            dto.setTripStatus(trip.getStatus());
            dto.setEstimatedPickupTime(trip.getScheduledDeparture());
            dto.setEstimatedDeliveryTime(trip.getScheduledArrival());
            dto.setActualPickupTime(trip.getActualDeparture());
            dto.setActualDeliveryTime(trip.getActualArrival());

            // Get driver and vehicle info
            if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
                TripAssignment assignment = trip.getTripAssignments().get(0);
                if (assignment.getDriver() != null) {
                    dto.setDriverName(assignment.getDriver().getUser().getUsername());
                    dto.setDriverPhone(assignment.getDriver().getPhone());
                }
            }
            if (trip.getVehicle() != null) {
                dto.setVehiclePlate(trip.getVehicle().getLicensePlate());
            }
        }

        return dto;
    }

    private OrderSummaryDto mapToOrderSummaryDto(Order order) {
        OrderSummaryDto dto = new OrderSummaryDto();
        dto.setOrderId(order.getOrderId());
        dto.setPickupAddress(order.getPickupAddress());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setOrderStatus(order.getOrderStatus().name());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setDeliveryFee(BigDecimal.ZERO); // Fee calculation not implemented

        if (order.getTrip() != null) {
            dto.setTripStatus(order.getTrip().getStatus());
            dto.setEstimatedDeliveryTime(order.getTrip().getScheduledArrival());
        }

        return dto;
    }
}
