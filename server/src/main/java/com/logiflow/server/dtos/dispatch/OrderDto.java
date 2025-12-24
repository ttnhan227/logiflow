package com.logiflow.server.dtos.dispatch;

import com.logiflow.server.models.Order;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderDto {
    private Integer orderId;
    private Integer tripId;
    private Integer customerId;
    private Integer customerUserId;
    private String customerName;
    private String customerPhone;
    private String pickupAddress;
    private java.math.BigDecimal pickupLat;
    private java.math.BigDecimal pickupLng;
    private String deliveryAddress;
    private java.math.BigDecimal deliveryLat;
    private java.math.BigDecimal deliveryLng;
    private String packageDetails;
    private java.math.BigDecimal distanceKm;
    private java.math.BigDecimal weightTons;
    private Order.PickupType pickupType;
    private String containerNumber;
    private String dockInfo;
    private java.math.BigDecimal packageValue;
    private java.math.BigDecimal shippingFee;
    private Integer createdByUserId;
    private String createdByUsername;
    private Order.PriorityLevel priorityLevel;
    private Order.OrderStatus orderStatus;
    private LocalDateTime createdAt;

    public static OrderDto fromOrder(Order order) {
        OrderDto dto = new OrderDto();
        dto.setOrderId(order.getOrderId());
        dto.setTripId(order.getTrip() != null ? order.getTrip().getTripId() : null);
        dto.setCustomerId(order.getCustomer() != null ? order.getCustomer().getUserId() : null);
        dto.setCustomerUserId(order.getCustomer() != null ? order.getCustomer().getUserId() : null);
        dto.setCustomerName(order.getCustomerName());
        dto.setCustomerPhone(order.getCustomerPhone());
        dto.setPickupAddress(order.getPickupAddress());
        dto.setPickupLat(order.getPickupLat());
        dto.setPickupLng(order.getPickupLng());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setDeliveryLat(order.getDeliveryLat());
        dto.setDeliveryLng(order.getDeliveryLng());
        dto.setPackageDetails(order.getPackageDetails());
        dto.setDistanceKm(order.getDistanceKm());
        dto.setWeightTons(order.getWeightTons());
        dto.setPickupType(order.getPickupType());
        dto.setContainerNumber(order.getContainerNumber());
        dto.setDockInfo(order.getDockInfo());
        dto.setPackageValue(order.getPackageValue());
        dto.setShippingFee(order.getShippingFee());
        dto.setCreatedByUserId(order.getCreatedBy() != null ? order.getCreatedBy().getUserId() : null);
        dto.setCreatedByUsername(order.getCreatedBy() != null ? order.getCreatedBy().getUsername() : null);
        dto.setPriorityLevel(order.getPriorityLevel());
        dto.setOrderStatus(order.getOrderStatus());
        dto.setCreatedAt(order.getCreatedAt());
        return dto;
    }
}
