package com.logiflow.server.models;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Entity
@Table(name = "routes")
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "route_id")
    private Integer routeId;

    @Column(name = "route_name", length = 100, nullable = false)
    private String routeName;

    @Column(name = "route_type", length = 20, nullable = false)
    private String routeType;

    // Trip route fields (combining multiple orders)
    @Column(name = "waypoints", columnDefinition = "TEXT")
    private String waypoints; // JSON array of {lat, lng, type, orderId}

    @Column(name = "distance_km", precision = 10, scale = 2)
    private BigDecimal distanceKm; // Total distance for trip routes

    @Column(name = "total_fee", precision = 12, scale = 2)
    private BigDecimal totalFee; // Total fee for trip routes

    @Column(name = "order_ids", length = 500)
    private String orderIds; // Comma-separated order IDs

    @Column(name = "is_trip_route", nullable = false)
    private Boolean isTripRoute = false;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Trip> trips;
}
