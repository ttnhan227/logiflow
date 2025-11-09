package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.analytics.RouteSummaryDto;
import com.logiflow.server.services.manager.analytics.RouteAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/analytics")
public class AnalyticsController {

    private final RouteAnalyticsService routeAnalyticsService;

    public AnalyticsController(RouteAnalyticsService routeAnalyticsService) {
        this.routeAnalyticsService = routeAnalyticsService;
    }

    // 8) Phân tích lộ trình
    @GetMapping("/route-summary")
    public ResponseEntity<RouteSummaryDto> routeSummary() {
        return ResponseEntity.ok(routeAnalyticsService.routeSummary());
    }
}
