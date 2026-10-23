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

    @Version
    @Column(name = "version")
    private Long version;

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

    @Column(name = "pickup_lat", precision = 10, scale = 8, nullable = true)
    private BigDecimal pickupLat;

    @Column(name = "pickup_lng", precision = 11, scale = 8, nullable = true)
    private BigDecimal pickupLng;

    @Column(name = "delivery_lat", precision = 10, scale = 8, nullable = true)
    private BigDecimal deliveryLat;

    @Column(name = "delivery_lng", precision = 11, scale = 8, nullable = true)
    private BigDecimal deliveryLng;

    @Column(name = "package_details", length = 500, nullable = true)
    private String packageDetails;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;
    @Column(name = "distance_km", precision = 10, scale = 2, nullable = true)
    private BigDecimal distanceKm;

    /**
     * Weight in tons (t) - unified measurement for all cargo types.
     */
    @Column(name = "weight_tons", precision = 10, scale = 3, nullable = true)
    private BigDecimal weightTons;




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

    @Column(name = "payment_status", nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "payment_updated_at")
    private LocalDateTime paymentUpdatedAt;

    public static enum PriorityLevel {
        NORMAL, URGENT
    }

    public static enum PickupType {
        STANDARD,
        PORT_TERMINAL,
        WAREHOUSE
    }

    public void transitionTo(OrderStatus newStatus) {
        if (this.orderStatus != null) {
            this.orderStatus.validateTransition(newStatus);
        }
        this.orderStatus = newStatus;
    }

    public static enum OrderStatus {
        PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED;

        public static final java.util.Set<OrderStatus> TERMINAL_STATUSES = java.util.Set.of(DELIVERED, CANCELLED);

        private static final java.util.Map<OrderStatus, java.util.Set<OrderStatus>> VALID_TRANSITIONS = java.util.Map.of(
            PENDING, java.util.Set.of(ASSIGNED, CANCELLED),
            ASSIGNED, java.util.Set.of(IN_TRANSIT, PENDING, CANCELLED),
            IN_TRANSIT, java.util.Set.of(DELIVERED, PENDING, CANCELLED),
            DELIVERED, java.util.Set.of(),
            CANCELLED, java.util.Set.of()
        );

        public boolean isTerminal() {
            return TERMINAL_STATUSES.contains(this);
        }

        public boolean canTransitionTo(OrderStatus target) {
            if (target == null) return false;
            if (this == target) return true; // idempotent
            java.util.Set<OrderStatus> allowed = VALID_TRANSITIONS.get(this);
            return allowed != null && allowed.contains(target);
        }

        public void validateTransition(OrderStatus target) {
            validateTransition(this, target);
        }

        public static void validateTransition(OrderStatus from, OrderStatus to) {
            if (to == null) {
                throw new com.logiflow.server.exceptions.BusinessRuleException("Target order status cannot be null");
            }
            if (from == null) {
                return; // initial state
            }
            if (from == to) {
                return; // idempotent
            }
            if (from == DELIVERED) {
                throw new com.logiflow.server.exceptions.BusinessRuleException("Cannot change status of a delivered order (Order is terminal: DELIVERED)");
            }
            if (from == CANCELLED) {
                throw new com.logiflow.server.exceptions.BusinessRuleException("Cannot change status of a cancelled order (Order is terminal: CANCELLED)");
            }
            if (!from.canTransitionTo(to)) {
                throw new com.logiflow.server.exceptions.BusinessRuleException(String.format(
                    "Invalid order status transition from %s to %s. Allowed transitions from %s: %s",
                    from, to, from, VALID_TRANSITIONS.get(from)
                ));
            }
        }
    }

    public static enum PaymentStatus {
        PENDING, PAID, FAILED, REFUNDED
    }
}
