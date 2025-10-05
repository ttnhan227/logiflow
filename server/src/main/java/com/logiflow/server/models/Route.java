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

    @Column(name = "origin_address", length = 255, nullable = false)
    private String originAddress;

    @Column(name = "origin_lat", precision = 10, scale = 8, nullable = false)
    private BigDecimal originLat;

    @Column(name = "origin_lng", precision = 11, scale = 8, nullable = false)
    private BigDecimal originLng;

    @Column(name = "destination_address", length = 255, nullable = false)
    private String destinationAddress;

    @Column(name = "destination_lat", precision = 10, scale = 8, nullable = false)
    private BigDecimal destinationLat;

    @Column(name = "destination_lng", precision = 11, scale = 8, nullable = false)
    private BigDecimal destinationLng;

    @Column(name = "distance_km", precision = 10, scale = 2, nullable = false)
    private BigDecimal distanceKm;

    @Column(name = "estimated_duration_hours", precision = 5, scale = 2, nullable = false)
    private BigDecimal estimatedDurationHours;

    @Column(name = "route_type", length = 20, nullable = false)
    private String routeType;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Trip> trips;
}
