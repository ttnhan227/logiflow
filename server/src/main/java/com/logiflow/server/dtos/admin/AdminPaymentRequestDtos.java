package com.logiflow.server.dtos.admin;

import com.logiflow.server.models.Order;
import com.logiflow.server.models.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class AdminPaymentRequestDtos {

    public static class DeliveredOrderDto {
        private Integer orderId;
        private String customerName;
        private String customerPhone;
        private String pickupAddress;
        private String deliveryAddress;
        private String packageDetails;
        private BigDecimal weightTons;
        private BigDecimal distanceKm;
        private BigDecimal shippingFee;
        private LocalDateTime createdAt;
        private String paymentStatus;
        private String priorityLevel;

        // Getters and Setters
        public Integer getOrderId() { return orderId; }
        public void setOrderId(Integer orderId) { this.orderId = orderId; }

        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }

        public String getCustomerPhone() { return customerPhone; }
        public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

        public String getPickupAddress() { return pickupAddress; }
        public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

        public String getDeliveryAddress() { return deliveryAddress; }
        public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

        public String getPackageDetails() { return packageDetails; }
        public void setPackageDetails(String packageDetails) { this.packageDetails = packageDetails; }

        public BigDecimal getWeightTons() { return weightTons; }
        public void setWeightTons(BigDecimal weightTons) { this.weightTons = weightTons; }

        public BigDecimal getDistanceKm() { return distanceKm; }
        public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }

        public BigDecimal getShippingFee() { return shippingFee; }
        public void setShippingFee(BigDecimal shippingFee) { this.shippingFee = shippingFee; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

        public String getPaymentStatus() { return paymentStatus; }
        public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

        public String getPriorityLevel() { return priorityLevel; }
        public void setPriorityLevel(String priorityLevel) { this.priorityLevel = priorityLevel; }
    }

    public static class PaymentStatisticsDto {
        private int totalOrders;
        private int paidOrders;
        private int pendingOrders;
        private BigDecimal totalAmount;
        private BigDecimal pendingAmount;

        // Getters and Setters
        public int getTotalOrders() { return totalOrders; }
        public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

        public int getPaidOrders() { return paidOrders; }
        public void setPaidOrders(int paidOrders) { this.paidOrders = paidOrders; }

        public int getPendingOrders() { return pendingOrders; }
        public void setPendingOrders(int pendingOrders) { this.pendingOrders = pendingOrders; }

        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

        public BigDecimal getPendingAmount() { return pendingAmount; }
        public void setPendingAmount(BigDecimal pendingAmount) { this.pendingAmount = pendingAmount; }
    }

    public static class PaymentHistoryDto {
        private Integer paymentId;
        private BigDecimal amount;
        private String status;
        private String paypalOrderId;
        private String transactionId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        // Getters and Setters
        public Integer getPaymentId() { return paymentId; }
        public void setPaymentId(Integer paymentId) { this.paymentId = paymentId; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getPaypalOrderId() { return paypalOrderId; }
        public void setPaypalOrderId(String paypalOrderId) { this.paypalOrderId = paypalOrderId; }

        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class PaymentRequestDto {
        private Integer orderId;
        private String customerName;
        private BigDecimal amount;
        private String customerEmail;

        // Getters and Setters
        public Integer getOrderId() { return orderId; }
        public void setOrderId(Integer orderId) { this.orderId = orderId; }

        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public String getCustomerEmail() { return customerEmail; }
        public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    }

    public static class PaymentRequestSummaryDto {
        private int totalOrders;
        private int selectedOrders;
        private BigDecimal totalAmount;
        private List<PaymentRequestDto> orders;

        // Getters and Setters
        public int getTotalOrders() { return totalOrders; }
        public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

        public int getSelectedOrders() { return selectedOrders; }
        public void setSelectedOrders(int selectedOrders) { this.selectedOrders = selectedOrders; }

        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

        public List<PaymentRequestDto> getOrders() { return orders; }
        public void setOrders(List<PaymentRequestDto> orders) { this.orders = orders; }
    }

    public static class CustomerOrderDto {
        private Integer orderId;
        private String pickupAddress;
        private BigDecimal weightTons;
        private BigDecimal shippingFee;
        private LocalDateTime createdAt;
        private String paymentStatus;

        // Getters and Setters
        public Integer getOrderId() { return orderId; }
        public void setOrderId(Integer orderId) { this.orderId = orderId; }

        public String getPickupAddress() { return pickupAddress; }
        public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

        public BigDecimal getWeightTons() { return weightTons; }
        public void setWeightTons(BigDecimal weightTons) { this.weightTons = weightTons; }

        public BigDecimal getShippingFee() { return shippingFee; }
        public void setShippingFee(BigDecimal shippingFee) { this.shippingFee = shippingFee; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

        public String getPaymentStatus() { return paymentStatus; }
        public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    }

    public static class CustomerOrdersDto {
        private String customerName;
        private String customerPhone;
        private int totalOrders;
        private int pendingOrders;
        private BigDecimal totalAmount;
        private BigDecimal pendingAmount;
        private List<CustomerOrderDto> orders;

        // Getters and Setters
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }

        public String getCustomerPhone() { return customerPhone; }
        public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

        public int getTotalOrders() { return totalOrders; }
        public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

        public int getPendingOrders() { return pendingOrders; }
        public void setPendingOrders(int pendingOrders) { this.pendingOrders = pendingOrders; }

        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

        public BigDecimal getPendingAmount() { return pendingAmount; }
        public void setPendingAmount(BigDecimal pendingAmount) { this.pendingAmount = pendingAmount; }

        public List<CustomerOrderDto> getOrders() { return orders; }
        public void setOrders(List<CustomerOrderDto> orders) { this.orders = orders; }
    }
}
