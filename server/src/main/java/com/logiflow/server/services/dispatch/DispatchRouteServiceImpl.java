package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.RouteDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Route;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.route.RouteRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DispatchRouteServiceImpl implements DispatchRouteService {

    private final RouteRepository routeRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DispatchRouteServiceImpl(RouteRepository routeRepository, OrderRepository orderRepository) {
        this.routeRepository = routeRepository;
        this.orderRepository = orderRepository;
    }

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
    public RouteDto createTripRoute(List<Integer> orderIds, String routeName) {
        if (orderIds == null || orderIds.isEmpty()) {
            throw new IllegalArgumentException("orderIds cannot be null or empty");
        }

        List<Order> orders = orderRepository.findAllById(orderIds);
        if (orders.size() != orderIds.size()) {
            throw new IllegalArgumentException("Some orders not found");
        }

        List<Map<String, Object>> waypoints = new ArrayList<>();
        BigDecimal totalFee = BigDecimal.ZERO;
        List<String> idStrings = new ArrayList<>();

        orders.sort(Comparator.comparing(Order::getOrderId));

        for (Order order : orders) {
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

            if (order.getShippingFee() != null) {
                totalFee = totalFee.add(order.getShippingFee());
            }

            idStrings.add(order.getOrderId().toString());
        }

        BigDecimal totalDistance = BigDecimal.ZERO;
        for (Order order : orders) {
            if (order.getDistanceKm() != null) {
                totalDistance = totalDistance.add(order.getDistanceKm());
            }
        }

        Route route = new Route();
        route.setRouteName(routeName != null ? routeName : "Trip Route");
        route.setRouteType("trip");
        route.setDistanceKm(totalDistance);

        try {
            route.setWaypoints(objectMapper.writeValueAsString(waypoints));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize waypoints", e);
        }

        route.setTotalFee(totalFee);
        route.setOrderIds(String.join(",", idStrings));
        route.setIsTripRoute(true);

        return RouteDto.fromRoute(routeRepository.save(route));
    }
}
