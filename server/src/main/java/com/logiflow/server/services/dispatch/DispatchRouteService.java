package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.admin.route.CreateRouteDto;
import com.logiflow.server.dtos.admin.route.RouteDto;
import java.util.List;

public interface DispatchRouteService {
    RouteDto getRouteById(Integer routeId);
    List<?> getAllRoutes();
    RouteDto createRoute(CreateRouteDto request);
}
