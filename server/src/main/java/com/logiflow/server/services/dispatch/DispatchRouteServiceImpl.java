package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.RouteDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Route;
import com.logiflow.server.repositories.route.RouteRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DispatchRouteServiceImpl implements DispatchRouteService {

    @Autowired
    private RouteRepository routeRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public RouteDto getRouteById(Integer routeId) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found with id: " + routeId));
        return RouteDto.fromRoute(route);
    }

    @Override
    public List<RouteDto> getAllRoutes() {
        return routeRepository.findAll().stream()
                .map(RouteDto::fromRoute)
                .collect(Collectors.toList());
    }

    @Override
    public RouteDto createTripRoute(List<Order> orders, String routeName) {
        if (orders == null || orders.isEmpty()) {
            throw new IllegalArgumentException("Orders cannot be null or empty");
        }

        // Create waypoints from all order coordinates
        List<Map<String, Object>> waypoints = new ArrayList<>();
        BigDecimal totalFee = BigDecimal.ZERO;
        List<String> orderIds = new ArrayList<>();

        // Sort orders by ID for consistent sequence
        orders.sort(Comparator.comparing(Order::getOrderId));

        for (Order order : orders) {
            // Add pickup waypoint
            if (order.getPickupLat() != null && order.getPickupLng() != null) {
                Map<String, Object> pickupPoint = new HashMap<>();
                pickupPoint.put("lat", order.getPickupLat());
                pickupPoint.put("lng", order.getPickupLng());
                pickupPoint.put("type", "pickup");
                pickupPoint.put("orderId", order.getOrderId());
                pickupPoint.put("address", order.getPickupAddress());
                pickupPoint.put("customerName", order.getCustomerName());
                waypoints.add(pickupPoint);
            }

            // Add delivery waypoint
            if (order.getDeliveryLat() != null && order.getDeliveryLng() != null) {
                Map<String, Object> deliveryPoint = new HashMap<>();
                deliveryPoint.put("lat", order.getDeliveryLat());
                deliveryPoint.put("lng", order.getDeliveryLng());
                deliveryPoint.put("type", "delivery");
                deliveryPoint.put("orderId", order.getOrderId());
                deliveryPoint.put("address", order.getDeliveryAddress());
                deliveryPoint.put("customerName", order.getCustomerName());
                waypoints.add(deliveryPoint);
            }

            // Accumulate fees
            if (order.getShippingFee() != null) {
                totalFee = totalFee.add(order.getShippingFee());
            }

            orderIds.add(order.getOrderId().toString());
        }

        // Calculate total distance (sum of all individual order distances)
        BigDecimal totalDistance = BigDecimal.ZERO;
        for (Order order : orders) {
            if (order.getDistanceKm() != null) {
                totalDistance = totalDistance.add(order.getDistanceKm());
            }
        }

        // Create route entity
        Route route = new Route();
        route.setRouteName(routeName != null ? routeName : "Trip Route");
        route.setRouteType("trip");
        route.setDistanceKm(totalDistance); // Total distance from all orders

        try {
            route.setWaypoints(objectMapper.writeValueAsString(waypoints));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize waypoints", e);
        }

        route.setTotalFee(totalFee); // Total fee from all orders
        route.setOrderIds(String.join(",", orderIds));
        route.setIsTripRoute(true);

        Route saved = routeRepository.save(route);
        return RouteDto.fromRoute(saved);
    }
}
