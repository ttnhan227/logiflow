package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.RouteDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.services.dispatch.DispatchRouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dispatch/routes")
public class DispatchRouteController {

    @Autowired
    private DispatchRouteService dispatchRouteService;

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<?> getAllRoutes() {
        try {
            List<?> routes = dispatchRouteService.getAllRoutes();
            return ResponseEntity.ok(routes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{routeId}")
    public ResponseEntity<?> getRouteById(@PathVariable Integer routeId) {
        try {
            RouteDto dto = dispatchRouteService.getRouteById(routeId);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // Legacy route creation - removed for trip route focus
    // @PostMapping
    // public ResponseEntity<?> createRoute(@RequestBody CreateRouteDto request) {
    //     // Implementation removed
    // }

    @PostMapping("/trip")
    public ResponseEntity<?> createTripRoute(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Integer> orderIds = (List<Integer>) request.get("orderIds");
            String routeName = (String) request.get("routeName");

            if (orderIds == null || orderIds.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "orderIds cannot be null or empty"));
            }

            // Get orders from database
            List<Order> orders = orderRepository.findAllById(orderIds);

            if (orders.size() != orderIds.size()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Some orders not found"));
            }

            RouteDto created = dispatchRouteService.createTripRoute(orders, routeName);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", iae.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
