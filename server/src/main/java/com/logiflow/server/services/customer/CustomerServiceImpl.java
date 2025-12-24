package com.logiflow.server.services.customer;

import com.logiflow.server.dtos.customer.CustomerDtos.*;
import com.logiflow.server.dtos.maps.DistanceResultDto;
import com.logiflow.server.models.*;
import com.logiflow.server.repositories.customer.CustomerRepository;
import com.logiflow.server.repositories.notification.NotificationRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.services.maps.MapsService;
import com.logiflow.server.websocket.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Map;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final NotificationRepository notificationRepository;
    private final MapsService mapsService;
    private final NotificationService notificationService;

    public CustomerServiceImpl(UserRepository userRepository,
                             CustomerRepository customerRepository,
                             OrderRepository orderRepository,
                             NotificationRepository notificationRepository,
                             MapsService mapsService,
                             NotificationService notificationService) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.notificationRepository = notificationRepository;
        this.mapsService = mapsService;
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
        order.setPickupType(request.getPickupType());
        order.setContainerNumber(request.getContainerNumber());
        order.setTerminalName(request.getTerminalName());
        order.setWarehouseName(request.getWarehouseName());
        order.setDockNumber(request.getDockNumber());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setPickupLat(request.getPickupLat());
        order.setPickupLng(request.getPickupLng());
        order.setDeliveryLat(request.getDeliveryLat());
        order.setDeliveryLng(request.getDeliveryLng());
        order.setPackageDetails(request.getPackageDetails());
        order.setWeightTons(request.getWeightTonnes());
        order.setPackageValue(request.getPackageValue()); // For insurance calculation
        order.setCreatedBy(customer);
        order.setCustomer(customer);

        // Set priority level
        if ("URGENT".equalsIgnoreCase(request.getPriority())) {
            order.setPriorityLevel(Order.PriorityLevel.URGENT);
        } else {
            order.setPriorityLevel(Order.PriorityLevel.NORMAL);
        }

        // Set default status
        order.setOrderStatus(Order.OrderStatus.PENDING);

        // Calculate distance and shipping fee
        calculateOrderDistanceAndFee(order);

        Order savedOrder = orderRepository.save(order);

        // Send notification to customer
        notificationService.sendOrderNotification(
            customer.getUserId(),
            savedOrder.getOrderId(),
            "ORDER_CREATED",
            "Your order #" + savedOrder.getOrderId() + " has been created successfully",
            "PENDING"
        );

        // Send notification to dispatcher about new order from customer
        try {
            notificationService.notifyNewOrder(
                savedOrder.getOrderId(),
                savedOrder.getCustomerName(),
                savedOrder.getPriorityLevel().toString()
            );
        } catch (Exception e) {
            System.err.println("Failed to send dispatcher notification for new order: " + e.getMessage());
        }

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
        // Get all orders and sort by creation date (newest first)
        List<Order> orders = orderRepository.findByCustomerId(customer.getUserId());

        return orders.stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // Newest first
            .map(this::mapToOrderSummaryDto)
            .collect(Collectors.toList());
    }

    @Override
    public TrackOrderResponse trackOrder(String customerUsername, Integer orderId) {
        User customer = getCurrentCustomer(customerUsername);
        Order order = orderRepository.findByCustomerIdAndOrderId(customer.getUserId(), orderId)
                .orElseThrow(() -> new RuntimeException("Order not found or doesn't belong to you"));

        TrackOrderResponse response = new TrackOrderResponse();
        response.setOrderId(order.getOrderId());
        response.setOrderStatus(order.getOrderStatus().name());
        response.setTripStatus(null); // Will set if trip exists

        // Build proper status history based on actual order status and timeline
        List<StatusUpdateDto> statusHistory = buildOrderStatusHistory(order);

        // Only set trip-related info if order is assigned and trip exists
        if (order.getTrip() != null) {
            Trip trip = order.getTrip();
            response.setTripStatus(trip.getStatus());
            response.setEstimatedPickupTime(trip.getScheduledDeparture());
            response.setEstimatedDeliveryTime(trip.getScheduledArrival());
            response.setActualPickupTime(trip.getActualDeparture());
            response.setActualDeliveryTime(trip.getActualArrival());

            // Get driver and vehicle info only if assignment is active
            if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
                // Find the first ACTIVE assignment (not completed/declined)
                TripAssignment activeAssignment = trip.getTripAssignments().stream()
                    .filter(ta -> !"completed".equalsIgnoreCase(ta.getStatus()) &&
                                  !"declined".equalsIgnoreCase(ta.getStatus()))
                    .findFirst()
                    .orElse(null);

                if (activeAssignment != null && activeAssignment.getDriver() != null) {
                    Driver driver = activeAssignment.getDriver();
                    response.setDriverName(driver.getUser().getUsername());
                    response.setDriverPhone(driver.getUser().getPhone());
                    response.setVehiclePlate(trip.getVehicle() != null ? trip.getVehicle().getLicensePlate() : null);
                    response.setVehicleType(trip.getVehicle() != null ? trip.getVehicle().getVehicleType() : null);
                    response.setCurrentLat(driver.getCurrentLocationLat());
                    response.setCurrentLng(driver.getCurrentLocationLng());
                }
            }
        }

        response.setStatusHistory(statusHistory);
        return response;
    }

    /**
     * Build proper status history based on order status and timeline
     * Follows the same logic as driver service for consistency
     */
    private List<StatusUpdateDto> buildOrderStatusHistory(Order order) {
        String status = order.getOrderStatus().name();
        List<StatusUpdateDto> history = new java.util.ArrayList<>();

        // Always start with creation
        history.add(new StatusUpdateDto("CREATED", order.getCreatedAt(), "Order created"));

        // Add progress statuses based on order status
        switch (status) {
            case "ASSIGNED":
                if (order.getTrip() != null) {
                    history.add(new StatusUpdateDto("ASSIGNED",
                        order.getTrip().getCreatedAt() != null ? order.getTrip().getCreatedAt() : order.getCreatedAt(),
                        "Order assigned to driver"));
                }
                break;

            case "IN_TRANSIT":
                if (order.getTrip() != null) {
                    history.add(new StatusUpdateDto("ASSIGNED",
                        order.getTrip().getCreatedAt() != null ? order.getTrip().getCreatedAt() : order.getCreatedAt(),
                        "Order assigned to driver"));
                    if (order.getTrip().getActualDeparture() != null) {
                        history.add(new StatusUpdateDto("IN_TRANSIT",
                            order.getTrip().getActualDeparture(), "Driver picked up the order"));
                    }
                }
                break;

            case "DELIVERED":
                if (order.getTrip() != null) {
                    history.add(new StatusUpdateDto("ASSIGNED",
                        order.getTrip().getCreatedAt() != null ? order.getTrip().getCreatedAt() : order.getCreatedAt(),
                        "Order assigned to driver"));
                    if (order.getTrip().getActualDeparture() != null) {
                        history.add(new StatusUpdateDto("IN_TRANSIT",
                            order.getTrip().getActualDeparture(), "Driver picked up the order"));
                    }
                    if (order.getTrip().getActualArrival() != null) {
                        history.add(new StatusUpdateDto("DELIVERED",
                            order.getTrip().getActualArrival(), "Order delivered successfully"));
                    }
                }
                break;

            case "CANCELLED":
                history.add(new StatusUpdateDto("CANCELLED",
                    LocalDateTime.now(), "Order was cancelled"));
                break;

            case "PENDING":
            default:
                // No additional status updates for pending orders
                break;
        }

        return history;
    }

    @Override
    public CustomerProfileDto getProfile(String customerUsername) {
        Customer customer = getCurrentCustomerEntity(customerUsername);

        CustomerProfileDto profile = new CustomerProfileDto();
        profile.setUserId(customer.getUser().getUserId());
        profile.setUsername(customer.getUser().getUsername());
        profile.setEmail(customer.getUser().getEmail());
        profile.setFullName(customer.getUser().getFullName());
        profile.setPhone(customer.getUser().getPhone());
        profile.setAddress(customer.getDefaultDeliveryAddress());
        profile.setCompanyName(customer.getCompanyName()); // ✅ Add company fields
        profile.setCompanyCode(customer.getCompanyCode()); // ✅ Add company fields
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
            customer.getUser().setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            customer.setDefaultDeliveryAddress(request.getAddress());
        }
        if (request.getCompanyName() != null) {
            customer.setCompanyName(request.getCompanyName());
        }
        if (request.getCompanyCode() != null) {
            customer.setCompanyCode(request.getCompanyCode());
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
                    history.setPickupType(order.getPickupType() != null ? order.getPickupType().name() : null);
                    history.setContainerNumber(order.getContainerNumber());
                    history.setTerminalName(order.getTerminalName());
                    history.setWarehouseName(order.getWarehouseName());
                    history.setDockNumber(order.getDockNumber());
                    history.setDeliveryAddress(order.getDeliveryAddress());
                    history.setPackageDetails(order.getPackageDetails());
                    history.setWeightTons(order.getWeightTons());
                    history.setPackageValue(order.getPackageValue());
                    history.setDistanceKm(order.getDistanceKm());
                    history.setShippingFee(order.getShippingFee());
                    history.setPriorityLevel(order.getPriorityLevel().name()); // Add priority level
                    history.setOrderStatus(order.getOrderStatus().name());
                    history.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING");
                    history.setCreatedAt(order.getCreatedAt());
                    if (order.getTrip() != null && order.getTrip().getActualArrival() != null) {
                        history.setDeliveredAt(order.getTrip().getActualArrival());
                    }

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
        dto.setPickupType(order.getPickupType() != null ? order.getPickupType().name() : null);
        dto.setContainerNumber(order.getContainerNumber());
        dto.setTerminalName(order.getTerminalName());
        dto.setWarehouseName(order.getWarehouseName());
        dto.setDockNumber(order.getDockNumber());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setPackageDetails(order.getPackageDetails());
        dto.setPickupLat(order.getPickupLat());
        dto.setPickupLng(order.getPickupLng());
        dto.setDeliveryLat(order.getDeliveryLat());
        dto.setDeliveryLng(order.getDeliveryLng());
        dto.setWeightTons(order.getWeightTons());
        dto.setPackageValue(order.getPackageValue());
        dto.setDistanceKm(order.getDistanceKm());
        dto.setShippingFee(order.getShippingFee());
        dto.setPriorityLevel(order.getPriorityLevel().name());
        dto.setOrderStatus(order.getOrderStatus().name());
        dto.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING");
        dto.setCreatedAt(order.getCreatedAt());

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
                    dto.setDriverPhone(assignment.getDriver().getUser().getPhone());
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
        dto.setCustomerName(order.getCustomerName());
        dto.setPickupAddress(order.getPickupAddress());
        dto.setPickupType(order.getPickupType() != null ? order.getPickupType().name() : null);
        dto.setContainerNumber(order.getContainerNumber());
        dto.setTerminalName(order.getTerminalName());
        dto.setWarehouseName(order.getWarehouseName());
        dto.setDockNumber(order.getDockNumber());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setPackageDetails(order.getPackageDetails());
        dto.setPickupLat(order.getPickupLat());
        dto.setPickupLng(order.getPickupLng());
        dto.setDeliveryLat(order.getDeliveryLat());
        dto.setDeliveryLng(order.getDeliveryLng());
        dto.setWeightTons(order.getWeightTons());
        dto.setPackageValue(order.getPackageValue());
        dto.setDistanceKm(order.getDistanceKm());
        dto.setShippingFee(order.getShippingFee());
        dto.setOrderStatus(order.getOrderStatus().name());
        dto.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING");
        dto.setCreatedAt(order.getCreatedAt());

        // Trip delay-related fields (delays affect entire trips, not individual orders)
        if (order.getTrip() != null) {
            dto.setDelayReason(order.getTrip().getDelayReason());
            dto.setDelayStatus(order.getTrip().getDelayStatus());
            dto.setSlaExtensionMinutes(order.getTrip().getSlaExtensionMinutes());
        }

        if (order.getTrip() != null) {
            dto.setTripStatus(order.getTrip().getStatus());
            dto.setEstimatedDeliveryTime(order.getTrip().getScheduledArrival());
        }

        return dto;
    }

    /**
     * Calculate the distance and shipping fee for an order
     * Prioritizes coordinate-based calculation over address-based geocoding
     */
    private void calculateOrderDistanceAndFee(Order order) {
        try {
            BigDecimal distanceKm = null;

            // Option 1: Use coordinates if available (from map selection)
            if (order.getPickupLat() != null && order.getPickupLng() != null &&
                order.getDeliveryLat() != null && order.getDeliveryLng() != null) {

                // Calculate distance using Haversine formula with coordinates
                double distance = calculateHaversineDistance(
                    order.getPickupLat().doubleValue(), order.getPickupLng().doubleValue(),
                    order.getDeliveryLat().doubleValue(), order.getDeliveryLng().doubleValue()
                );
                distanceKm = BigDecimal.valueOf(distance);
                System.out.println("Calculated distance using coordinates: " + distanceKm + " km");
            }
            // Option 2: Fallback to address-based geocoding if coordinates not available
            else if (order.getPickupAddress() != null && !order.getPickupAddress().trim().isEmpty() &&
                     order.getDeliveryAddress() != null && !order.getDeliveryAddress().trim().isEmpty()) {

                DistanceResultDto distanceResult = mapsService.calculateDistance(
                    order.getPickupAddress(),
                    order.getDeliveryAddress()
                );

                if (distanceResult != null) {
                    // Convert meters to km
                    distanceKm = BigDecimal.valueOf(distanceResult.getDistanceMeters())
                        .divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
                    System.out.println("Calculated distance using addresses: " + distanceKm + " km");
                } else {
                    System.err.println("Failed to geocode addresses for distance calculation: " +
                        order.getPickupAddress() + " -> " + order.getDeliveryAddress());
                }
            }

            // Calculate shipping fee if we have distance
            if (distanceKm != null) {
                order.setDistanceKm(distanceKm);

                BigDecimal fee = calculateShippingFee(
                    distanceKm,
                    order.getWeightTons() != null ? order.getWeightTons() : BigDecimal.ZERO,
                    order
                );
                order.setShippingFee(fee);
                System.out.println("Calculated shipping fee: " + fee + " VND");
            } else {
                // No distance calculation possible
                order.setDistanceKm(null);
                order.setShippingFee(null);
                System.err.println("No distance calculation method available for order");
            }

        } catch (Exception e) {
            System.err.println("Error calculating distance and fee: " + e.getMessage());
            e.printStackTrace();
            // Leave distance and fee as null if calculation fails
            order.setDistanceKm(null);
            order.setShippingFee(null);
        }
    }

    /**
     * Calculate Haversine distance between two coordinate points
     * @param lat1 Latitude of first point
     * @param lng1 Longitude of first point
     * @param lat2 Latitude of second point
     * @param lng2 Longitude of second point
     * @return Distance in kilometers
     */
    private double calculateHaversineDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371; // Earth's radius in kilometers

        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Calculate shipping fee based on distance, weight, package value, and priority
     * Includes insurance premium for declared package value
     */
    private BigDecimal calculateShippingFee(BigDecimal distanceKm, BigDecimal weightTons, Order order) {
        // Rate constants (should match frontend calculations)
        BigDecimal baseFee = BigDecimal.valueOf(30000); // VND base fee (reduced for local delivery)
        BigDecimal distanceRate = BigDecimal.valueOf(1500); // VND per km (reduced for local delivery)
        BigDecimal weightRatePerTon = BigDecimal.valueOf(700000); // VND per ton (reduced from 2M to 700k for local delivery)
        BigDecimal insuranceRate = BigDecimal.valueOf(0.005); // 0.5% insurance premium on declared value

        // Calculate distance and weight components
        BigDecimal distanceFee = distanceKm.multiply(distanceRate);
        BigDecimal weightFee = weightTons.multiply(weightRatePerTon);

        // Calculate insurance premium if package value is declared
        BigDecimal insurancePremium = BigDecimal.ZERO;
        if (order.getPackageValue() != null && order.getPackageValue().compareTo(BigDecimal.ZERO) > 0) {
            insurancePremium = order.getPackageValue().multiply(insuranceRate);
        }

        // Total fee before priority multiplier
        BigDecimal totalFee = baseFee.add(distanceFee).add(weightFee).add(insurancePremium);

        // Apply urgent multiplier if needed
        if (order.getPriorityLevel() == Order.PriorityLevel.URGENT) {
            totalFee = totalFee.multiply(BigDecimal.valueOf(1.3));
        }

        // Round to whole VND
        return totalFee.setScale(0, RoundingMode.HALF_UP);
    }

    @Override
    public List<Map<String, Object>> getNotifications(String customerUsername) {
        List<Notification> notifications = notificationRepository.findAllForCustomer(customerUsername);
        return notifications.stream()
                .map(notification -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("notificationId", notification.getNotificationId());
                    map.put("message", notification.getMessage());
                    map.put("type", notification.getNotificationType().toString());
                    map.put("createdAt", notification.getCreatedAt().toString());
                    map.put("relatedEntityId", notification.getRelatedEntityId());
                    map.put("isRead", notification.getIsRead());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Override
    public void markAllNotificationsAsRead(String customerUsername) {
        notificationRepository.markAllAsReadForCustomer(customerUsername);
    }
}
