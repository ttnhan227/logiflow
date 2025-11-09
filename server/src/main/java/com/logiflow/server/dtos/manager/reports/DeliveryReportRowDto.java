package com.logiflow.server.dtos.manager.reports;

import java.time.LocalDateTime;

public class DeliveryReportRowDto {
    private Integer orderId;
    private String customerName;
    private String pickupAddress;
    private String deliveryAddress;
    private String priority;  // từ enum PriorityLevel
    private String status;    // từ enum OrderStatus
    private LocalDateTime createdAt;

    public DeliveryReportRowDto() {
    }

    public DeliveryReportRowDto(Integer orderId, String customerName, String pickupAddress,
                                String deliveryAddress, String priority, String status,
                                LocalDateTime createdAt) {
        this.orderId = orderId;
        this.customerName = customerName;
        this.pickupAddress = pickupAddress;
        this.deliveryAddress = deliveryAddress;
        this.priority = priority;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
