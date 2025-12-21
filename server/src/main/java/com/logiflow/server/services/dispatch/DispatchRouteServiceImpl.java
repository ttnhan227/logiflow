package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.admin.route.CreateRouteDto;
import com.logiflow.server.dtos.admin.route.RouteDto;
import com.logiflow.server.dtos.maps.DirectionsResultDto;
import com.logiflow.server.dtos.maps.GeocodeResultDto;
import com.logiflow.server.models.Route;
import com.logiflow.server.repositories.route.RouteRepository;
import com.logiflow.server.services.maps.MapsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DispatchRouteServiceImpl implements DispatchRouteService {

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private MapsService mapsService;

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

    @Override
    public RouteDto createRoute(CreateRouteDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }

        // Ensure coordinates: if missing, geocode addresses
        BigDecimal oLat = request.getOriginLat();
        BigDecimal oLng = request.getOriginLng();
        BigDecimal dLat = request.getDestinationLat();
        BigDecimal dLng = request.getDestinationLng();

        if (oLat == null || oLng == null) {
            GeocodeResultDto origin = mapsService.geocodeAddress(request.getOriginAddress());
            if (origin == null) throw new IllegalArgumentException("Failed to geocode origin address");
            oLat = BigDecimal.valueOf(origin.getLatitude());
            oLng = BigDecimal.valueOf(origin.getLongitude());
        }
        if (dLat == null || dLng == null) {
            GeocodeResultDto dest = mapsService.geocodeAddress(request.getDestinationAddress());
            if (dest == null) throw new IllegalArgumentException("Failed to geocode destination address");
            dLat = BigDecimal.valueOf(dest.getLatitude());
            dLng = BigDecimal.valueOf(dest.getLongitude());
        }

        // Compute distance/duration if missing using OSRM
        BigDecimal distanceKm = request.getDistanceKm();
        BigDecimal durationHours = request.getEstimatedDurationHours();
        if (distanceKm == null || durationHours == null) {
            DirectionsResultDto dir = mapsService.getDirections(
                    oLat.toString(), oLng.toString(), dLat.toString(), dLng.toString(), false);
            if (dir != null) {
                double km = dir.getDistanceMeters() / 1000.0;
                double hours = dir.getDurationSeconds() / 3600.0;
                distanceKm = BigDecimal.valueOf(Math.round(km * 100.0) / 100.0);
                durationHours = BigDecimal.valueOf(Math.round(hours * 100.0) / 100.0);
            } else {
                // fallback minimal values to satisfy not-null constraints
                distanceKm = BigDecimal.valueOf(1.00);
                durationHours = BigDecimal.valueOf(0.50);
            }
        }

        String routeType = request.getRouteType() != null ? request.getRouteType() : "standard";
        String routeName = request.getRouteName() != null ? request.getRouteName() : "Auto Route";

        Route entity = new Route();
        entity.setRouteName(routeName);
        entity.setOriginAddress(request.getOriginAddress());
        entity.setOriginLat(oLat);
        entity.setOriginLng(oLng);
        entity.setDestinationAddress(request.getDestinationAddress());
        entity.setDestinationLat(dLat);
        entity.setDestinationLng(dLng);
        entity.setDistanceKm(distanceKm);
        entity.setEstimatedDurationHours(durationHours);
        entity.setRouteType(routeType);

        Route saved = routeRepository.save(entity);
        return getRouteById(saved.getRouteId());
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
