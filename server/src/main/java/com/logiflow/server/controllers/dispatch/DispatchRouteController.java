package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.RouteDto;
import com.logiflow.server.services.dispatch.DispatchRouteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispatch/routes")
public class DispatchRouteController {

    private final DispatchRouteService dispatchRouteService;

    public DispatchRouteController(DispatchRouteService dispatchRouteService) {
        this.dispatchRouteService = dispatchRouteService;
    }

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

            RouteDto created = dispatchRouteService.createTripRoute(orderIds, routeName);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", iae.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
