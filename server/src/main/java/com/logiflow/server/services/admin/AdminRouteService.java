package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.route.RouteDto;
import com.logiflow.server.dtos.admin.route.RouteStatisticsDto;
import com.logiflow.server.dtos.admin.route.CreateRouteDto;
import com.logiflow.server.dtos.admin.route.UpdateRouteDto;

import java.util.List;

public interface AdminRouteService {
    RouteStatisticsDto getRouteStatistics();
    List<RouteDto> getAllRoutes();
    RouteDto getRouteById(Integer routeId);
    RouteDto createRoute(CreateRouteDto createRouteDto);
    RouteDto updateRoute(Integer routeId, UpdateRouteDto updateRouteDto);
    void deleteRoute(Integer routeId);
}
