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

    @Column(name = "pickup_type", length = 20, nullable = true)
    @Enumerated(EnumType.STRING)
    private PickupType pickupType;

    @Column(name = "container_number", length = 50, nullable = true)
    private String containerNumber;

    @Column(name = "terminal_name", length = 100, nullable = true)
    private String terminalName;

    @Column(name = "warehouse_name", length = 100, nullable = true)
    private String warehouseName;

    @Column(name = "dock_number", length = 50, nullable = true)
    private String dockNumber;

    @Column(name = "delivery_address", length = 255, nullable = false)
    private String deliveryAddress;

    @Column(name = "package_details", length = 500, nullable = true)
    private String packageDetails;



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

    public static enum PriorityLevel {
        NORMAL, URGENT
    }

    public static enum PickupType {
        PORT, WAREHOUSE
    }

    public static enum OrderStatus {
        PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED
    }
}
