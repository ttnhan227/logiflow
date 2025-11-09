package com.logiflow.server.services.manager.analytics;

import com.logiflow.server.dtos.manager.analytics.RouteSummaryDto;
import com.logiflow.server.repositories.manager.analytics.RouteAnalyticsRepository;
import org.springframework.stereotype.Service;

@Service
public class RouteAnalyticsServiceImpl implements RouteAnalyticsService {

    private final RouteAnalyticsRepository routeAnalyticsRepository;

    public RouteAnalyticsServiceImpl(RouteAnalyticsRepository routeAnalyticsRepository) {
        this.routeAnalyticsRepository = routeAnalyticsRepository;
    }

    @Override
    public RouteSummaryDto routeSummary() {
        long totalRoutes = routeAnalyticsRepository.countDistinctRoutesUsed();
        Double avgKm = routeAnalyticsRepository.avgDistanceKm();
        Double avgPlan = routeAnalyticsRepository.avgPlannedHours();

        double km = avgKm == null ? 0.0 : Math.round(avgKm * 100.0) / 100.0;
        double plan = avgPlan == null ? 0.0 : Math.round(avgPlan * 100.0) / 100.0;

        String suggestion = plan > 5.0 ? "Xem xét chia chặng cho tuyến > 5h." : "Các tuyến ngắn đang vận hành tốt.";

        return new RouteSummaryDto(totalRoutes, km, plan, suggestion);
    }
}
