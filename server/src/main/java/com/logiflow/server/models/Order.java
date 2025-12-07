package com.logiflow.server.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Data
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Column(name = "customer_name", length = 100, nullable = false)
    private String customerName;

    @Column(name = "customer_phone", length = 20, nullable = true)
    private String customerPhone;

    @Column(name = "pickup_address", length = 255, nullable = false)
    private String pickupAddress;

    @Column(name = "delivery_address", length = 255, nullable = false)
    private String deliveryAddress;

    @Column(name = "package_details", length = 500, nullable = true)
    private String packageDetails;

    @Column(name = "delivery_fee", precision = 10, scale = 2)
    private java.math.BigDecimal deliveryFee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;
    @Column(name = "distance_km", precision = 10, scale = 2, nullable = true)
    private BigDecimal distanceKm;

    @Column(name = "weight_kg", precision = 10, scale = 2, nullable = true)
    private BigDecimal weightKg;

    @Column(name = "package_value", precision = 15, scale = 2, nullable = true)
    private BigDecimal packageValue;

    @Column(name = "shipping_fee", precision = 15, scale = 2, nullable = true)
    private BigDecimal shippingFee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "priority_level", nullable = false)
    @Enumerated(EnumType.STRING)
    private PriorityLevel priorityLevel = PriorityLevel.NORMAL;

    @Column(name = "order_status", nullable = false)
    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus = OrderStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "delay_reason", length = 500, nullable = true)
    private String delayReason;

    @Column(name = "sla_extension_minutes", nullable = true)
    private Integer slaExtensionMinutes = 0;

    public static enum PriorityLevel {
        NORMAL, URGENT
    }

    public static enum OrderStatus {
        PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED
    }
}
