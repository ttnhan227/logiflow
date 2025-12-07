package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.admin.route.RouteDto;
import com.logiflow.server.models.Route;
import com.logiflow.server.repositories.route.RouteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DispatchRouteServiceImpl implements DispatchRouteService {

    @Autowired
    private RouteRepository routeRepository;

    @Override
    public RouteDto getRouteById(Integer routeId) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found with id: " + routeId));

        int totalTrips = route.getTrips() != null ? route.getTrips().size() : 0;
        int activeTrips = route.getTrips() != null ?
                (int) route.getTrips().stream()
                        .filter(t -> isActiveStatus(t.getStatus()))
                        .count()
                : 0;

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

    @Override
    public List<?> getAllRoutes() {
        return routeRepository.findAll().stream()
                .map(r -> new SimpleRouteDto(r.getRouteId(), r.getRouteName()))
                .collect(Collectors.toList());
    }

    private boolean isActiveStatus(String status) {
        if (status == null) return false;
        String s = status.toUpperCase();
        return s.equals("PENDING") || s.equals("ASSIGNED") || s.equals("IN_PROGRESS") || s.equals("SCHEDULED");
    }

    public static class SimpleRouteDto {
        private Integer routeId;
        private String routeName;

        public SimpleRouteDto(Integer routeId, String routeName) {
            this.routeId = routeId;
            this.routeName = routeName;
        }

        public Integer getRouteId() { return routeId; }
        public String getRouteName() { return routeName; }
    }
}
