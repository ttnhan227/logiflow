package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.admin.route.RouteDto;
import com.logiflow.server.services.dispatch.DispatchRouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispatch/routes")
public class DispatchRouteController {

    @Autowired
    private DispatchRouteService dispatchRouteService;

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
}
