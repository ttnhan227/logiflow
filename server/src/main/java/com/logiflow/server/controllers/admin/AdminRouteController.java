package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.route.RouteDto;
import com.logiflow.server.dtos.admin.route.RouteStatisticsDto;
import com.logiflow.server.dtos.admin.route.CreateRouteDto;
import com.logiflow.server.dtos.admin.route.UpdateRouteDto;
import com.logiflow.server.services.admin.AdminRouteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/routes")
public class AdminRouteController {

    private final AdminRouteService adminRouteService;

    public AdminRouteController(AdminRouteService adminRouteService) {
        this.adminRouteService = adminRouteService;
    }

    @GetMapping("/statistics")
    public ResponseEntity<RouteStatisticsDto> getRouteStatistics() {
        return ResponseEntity.ok(adminRouteService.getRouteStatistics());
    }

    @GetMapping
    public ResponseEntity<List<RouteDto>> getAllRoutes() {
        return ResponseEntity.ok(adminRouteService.getAllRoutes());
    }

    @GetMapping("/{routeId}")
    public ResponseEntity<RouteDto> getRouteById(@PathVariable Integer routeId) {
        return ResponseEntity.ok(adminRouteService.getRouteById(routeId));
    }

    @PostMapping
    public ResponseEntity<RouteDto> createRoute(@RequestBody CreateRouteDto createRouteDto) {
        RouteDto createdRoute = adminRouteService.createRoute(createRouteDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRoute);
    }

    @PutMapping("/{routeId}")
    public ResponseEntity<RouteDto> updateRoute(
            @PathVariable Integer routeId,
            @RequestBody UpdateRouteDto updateRouteDto) {
        return ResponseEntity.ok(adminRouteService.updateRoute(routeId, updateRouteDto));
    }

    @DeleteMapping("/{routeId}")
    public ResponseEntity<Void> deleteRoute(@PathVariable Integer routeId) {
        adminRouteService.deleteRoute(routeId);
        return ResponseEntity.noContent().build();
    }
}
