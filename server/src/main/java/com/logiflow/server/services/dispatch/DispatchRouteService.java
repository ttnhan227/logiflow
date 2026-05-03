package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.RouteDto;
import java.util.List;

public interface DispatchRouteService {
    RouteDto getRouteById(Integer routeId);
    List<RouteDto> getAllRoutes();
    RouteDto createTripRoute(List<Integer> orderIds, String routeName);
}
