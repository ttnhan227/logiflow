package com.logiflow.server.dtos.customer;

import com.logiflow.server.models.Order;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class CustomerDtos {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CreateOrderRequest {
        private String customerName;
        private String customerPhone;
        private String pickupAddress;
        private Order.PickupType pickupType;
        private String containerNumber;
        private String terminalName;
        private String warehouseName;
        private String dockNumber;
        private String deliveryAddress;
        private String packageDetails;
        private BigDecimal pickupLat;
        private BigDecimal pickupLng;
        private BigDecimal deliveryLat;
        private BigDecimal deliveryLng;
        private BigDecimal weightTonnes;
        private String priority; // "NORMAL" or "URGENT"
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class OrderDto {
        private Integer orderId;
        private Integer tripId;
        private String customerName;
        private String customerPhone;
        private String pickupAddress;
        private String pickupType;
        private String containerNumber;
        private String terminalName;
        private String warehouseName;
        private String dockNumber;
        private String deliveryAddress;
        private String packageDetails;
        private BigDecimal weightTons;
        private BigDecimal packageValue;
        private BigDecimal distanceKm;
        private BigDecimal shippingFee;
        private String priorityLevel;
        private String orderStatus;
        private String paymentStatus;
        private String tripStatus; // if assigned to trip
        private LocalDateTime createdAt;
        private LocalDateTime estimatedPickupTime;
        private LocalDateTime estimatedDeliveryTime;
        private LocalDateTime actualPickupTime;
        private LocalDateTime actualDeliveryTime;
        private String driverName;
        private String driverPhone;
        private String vehiclePlate;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class OrderSummaryDto {
        private Integer orderId;
        private String customerName;
        private String pickupAddress;
        private String pickupType;
        private String containerNumber;
        private String terminalName;
        private String warehouseName;
        private String dockNumber;
        private String deliveryAddress;
        private String packageDetails;
        private BigDecimal weightTons;
        private BigDecimal packageValue;
        private BigDecimal distanceKm;
        private BigDecimal shippingFee;
        private String orderStatus;
        private String paymentStatus;
        private String tripStatus;
        private LocalDateTime createdAt;
        private LocalDateTime estimatedDeliveryTime;
        private Integer slaExtensionMinutes;
        private String delayReason;
        private String delayStatus;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TrackOrderResponse {
        private Integer orderId;
        private String orderStatus;
        private String tripStatus;
        private LocalDateTime estimatedPickupTime;
        private LocalDateTime estimatedDeliveryTime;
        private LocalDateTime actualPickupTime;
        private LocalDateTime actualDeliveryTime;
        private BigDecimal currentLat;
        private BigDecimal currentLng;
        private String driverName;
        private String driverPhone;
        private String vehiclePlate;
        private String vehicleType;
        private List<StatusUpdateDto> statusHistory;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class StatusUpdateDto {
        private String status;
        private LocalDateTime timestamp;
        private String notes;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class OrderHistoryDto {
        private Integer orderId;
        private String pickupAddress;
        private String pickupType;
        private String containerNumber;
        private String terminalName;
        private String warehouseName;
        private String dockNumber;
        private String deliveryAddress;
        private String packageDetails;
        private BigDecimal weightTons;
        private BigDecimal packageValue;
        private BigDecimal distanceKm;
        private BigDecimal shippingFee;
        private String orderStatus;
        private String paymentStatus;
        private LocalDateTime createdAt;
        private LocalDateTime deliveredAt;
        private String driverName;
        private Integer driverRating; // if we add rating system
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CustomerProfileDto {
        private Integer userId;
        private String username;
        private String email;
        private String fullName;
        private String phone;
        private String address;
        private String companyName; // for B2B customers
        private String companyCode; // for B2B customers
        private String paymentMethod; // optional: credit card, cash, etc.
        private String profilePictureUrl; // from User model
        private LocalDateTime createdAt;
        private Integer totalOrders;
        private BigDecimal totalSpent;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class UpdateProfileRequest {
        private String fullName;
        private String phone;
        private String address;
        private String companyName; // for B2B customers
        private String companyCode; // for B2B customers
        private String paymentMethod;
        private String profilePictureUrl; // for profile image updates
    }


}
