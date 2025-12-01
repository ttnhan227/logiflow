package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.route.RouteDto;
import com.logiflow.server.dtos.admin.route.RouteStatisticsDto;
import com.logiflow.server.dtos.admin.route.CreateRouteDto;
import com.logiflow.server.dtos.admin.route.UpdateRouteDto;
import com.logiflow.server.models.Route;
import com.logiflow.server.models.Trip;
import com.logiflow.server.repositories.route.RouteRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminRouteServiceImpl implements AdminRouteService {

    private final RouteRepository routeRepository;
    private final TripRepository tripRepository;
    private final AuditLogService auditLogService;

    public AdminRouteServiceImpl(RouteRepository routeRepository, TripRepository tripRepository, AuditLogService auditLogService) {
        this.routeRepository = routeRepository;
        this.tripRepository = tripRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public RouteStatisticsDto getRouteStatistics() {
        List<Route> allRoutes = routeRepository.findAll();
        
        int totalRoutes = allRoutes.size();
        int activeRoutes = (int) allRoutes.stream()
            .filter(route -> route.getTrips() != null && !route.getTrips().isEmpty())
            .count();
        
        int totalTrips = (int) tripRepository.count();
        int scheduledTrips = (int) tripRepository.countByStatus("scheduled");
        int inProgressTrips = (int) tripRepository.countByStatus("in_progress");
        int completedTrips = (int) tripRepository.countByStatus("completed");
        
        return new RouteStatisticsDto(
            totalRoutes,
            activeRoutes,
            totalTrips,
            scheduledTrips,
            inProgressTrips,
            completedTrips
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<RouteDto> getAllRoutes() {
        return routeRepository.findAll().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RouteDto getRouteById(Integer routeId) {
        Route route = routeRepository.findById(routeId)
            .orElseThrow(() -> new RuntimeException("Route not found with id: " + routeId));
        return convertToDto(route);
    }

    @Override
    @Transactional
    public RouteDto createRoute(CreateRouteDto createRouteDto) {
        Route route = new Route();
        route.setRouteName(createRouteDto.getRouteName());
        route.setOriginAddress(createRouteDto.getOriginAddress());
        route.setOriginLat(createRouteDto.getOriginLat());
        route.setOriginLng(createRouteDto.getOriginLng());
        route.setDestinationAddress(createRouteDto.getDestinationAddress());
        route.setDestinationLat(createRouteDto.getDestinationLat());
        route.setDestinationLng(createRouteDto.getDestinationLng());
        route.setDistanceKm(createRouteDto.getDistanceKm());
        route.setEstimatedDurationHours(createRouteDto.getEstimatedDurationHours());
        route.setRouteType(createRouteDto.getRouteType());
        
        Route savedRoute = routeRepository.save(route);
        
        auditLogService.log(
            "CREATE_ROUTE",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Created route: " + savedRoute.getRouteName() + " (ID: " + savedRoute.getRouteId() + ")"
        );
        
        return convertToDto(savedRoute);
    }

    @Override
    @Transactional
    public RouteDto updateRoute(Integer routeId, UpdateRouteDto updateRouteDto) {
        Route route = routeRepository.findById(routeId)
            .orElseThrow(() -> new RuntimeException("Route not found with id: " + routeId));
        
        route.setRouteName(updateRouteDto.getRouteName());
        route.setOriginAddress(updateRouteDto.getOriginAddress());
        route.setOriginLat(updateRouteDto.getOriginLat());
        route.setOriginLng(updateRouteDto.getOriginLng());
        route.setDestinationAddress(updateRouteDto.getDestinationAddress());
        route.setDestinationLat(updateRouteDto.getDestinationLat());
        route.setDestinationLng(updateRouteDto.getDestinationLng());
        route.setDistanceKm(updateRouteDto.getDistanceKm());
        route.setEstimatedDurationHours(updateRouteDto.getEstimatedDurationHours());
        route.setRouteType(updateRouteDto.getRouteType());
        
        Route updatedRoute = routeRepository.save(route);
        
        auditLogService.log(
            "UPDATE_ROUTE",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Updated route: " + updatedRoute.getRouteName() + " (ID: " + updatedRoute.getRouteId() + ")"
        );
        
        return convertToDto(updatedRoute);
    }

    @Override
    @Transactional
    public void deleteRoute(Integer routeId) {
        Route route = routeRepository.findById(routeId)
            .orElseThrow(() -> new RuntimeException("Route not found with id: " + routeId));
        
        // Check if route has active trips
        if (route.getTrips() != null && !route.getTrips().isEmpty()) {
            long activeTrips = route.getTrips().stream()
                .filter(trip -> "scheduled".equals(trip.getStatus()) || "in_progress".equals(trip.getStatus()))
                .count();
            
            if (activeTrips > 0) {
                throw new RuntimeException("Cannot delete route with active trips. Please complete or cancel all trips first.");
            }
        }
        
        auditLogService.log(
            "DELETE_ROUTE",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Deleted route: " + route.getRouteName() + " (ID: " + route.getRouteId() + ")"
        );
        
        routeRepository.delete(route);
    }

    private RouteDto convertToDto(Route route) {
        int totalTrips = route.getTrips() != null ? route.getTrips().size() : 0;
        int activeTrips = 0;
        
        if (route.getTrips() != null) {
            activeTrips = (int) route.getTrips().stream()
                .filter(trip -> "scheduled".equals(trip.getStatus()) || "in_progress".equals(trip.getStatus()))
                .count();
        }
        
        return new RouteDto(
            route.getRouteId(),
            route.getRouteName(),
            route.getOriginAddress(),
            route.getOriginLat(),
            route.getOriginLng(),
            route.getDestinationAddress(),
            route.getDestinationLat(),
            route.getDestinationLng(),
            route.getDistanceKm(),
            route.getEstimatedDurationHours(),
            route.getRouteType(),
            totalTrips,
            activeTrips
        );
    }
}
