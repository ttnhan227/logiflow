package com.logiflow.server.models;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Integer customerId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    // Contact information (using User phone)

    // Company information for B2B customers
    @Column(name = "company_name", length = 100)
    private String companyName;

    @Column(name = "company_code", length = 50)
    private String companyCode;

    // Address information
    @Column(name = "default_delivery_address", columnDefinition = "TEXT")
    private String defaultDeliveryAddress;

    // Payment preferences
    @Column(name = "preferred_payment_method", length = 50)
    private String preferredPaymentMethod;

    // Statistics
    @Column(name = "total_orders", nullable = false)
    private Integer totalOrders = 0;

    @Column(name = "total_spent", precision = 10, scale = 2)
    private BigDecimal totalSpent = BigDecimal.ZERO;

    // Activity tracking
    @Column(name = "last_order_date")
    private LocalDateTime lastOrderDate;
}
