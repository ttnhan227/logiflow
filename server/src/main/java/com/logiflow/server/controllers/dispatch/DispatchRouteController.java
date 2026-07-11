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
    public ResponseEntity<List<?>> getAllRoutes() {
        return ResponseEntity.ok(dispatchRouteService.getAllRoutes());
    }

    @GetMapping("/{routeId}")
    public ResponseEntity<RouteDto> getRouteById(@PathVariable Integer routeId) {
        return ResponseEntity.ok(dispatchRouteService.getRouteById(routeId));
    }

    @PostMapping("/trip")
    public ResponseEntity<?> createTripRoute(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Integer> orderIds = (List<Integer>) request.get("orderIds");
        String routeName = (String) request.get("routeName");

        if (orderIds == null || orderIds.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "orderIds cannot be null or empty"));
        }

        RouteDto created = dispatchRouteService.createTripRoute(orderIds, routeName);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
