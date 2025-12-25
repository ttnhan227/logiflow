package com.logiflow.server.dtos.dispatch;

import com.logiflow.server.models.Route;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RouteDto {
    private Integer routeId;
    private String routeName;
    private String routeType;
    private String waypoints; // JSON array of {lat, lng, type, orderId}
    private BigDecimal distanceKm; // Total distance for trip routes
    private BigDecimal totalFee; // Total fee for trip routes
    private String orderIds; // Comma-separated order IDs
    private Boolean isTripRoute;

    public static RouteDto fromRoute(Route route) {
        RouteDto dto = new RouteDto();
        dto.setRouteId(route.getRouteId());
        dto.setRouteName(route.getRouteName());
        dto.setRouteType(route.getRouteType());
        dto.setWaypoints(route.getWaypoints());
        dto.setDistanceKm(route.getDistanceKm());
        dto.setTotalFee(route.getTotalFee());
        dto.setOrderIds(route.getOrderIds());
        dto.setIsTripRoute(route.getIsTripRoute());
        return dto;
    }
}
