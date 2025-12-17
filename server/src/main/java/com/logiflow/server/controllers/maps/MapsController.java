package com.logiflow.server.controllers.maps;

import com.logiflow.server.dtos.maps.GeocodeResultDto;
import com.logiflow.server.dtos.maps.DirectionsResultDto;
import com.logiflow.server.dtos.maps.DistanceResultDto;
import com.logiflow.server.dtos.maps.OptimizeRequestDto;
import com.logiflow.server.dtos.maps.OptimizedRouteDto;
import com.logiflow.server.services.maps.MapsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controller for map-related operations using OpenStreetMap services.
 * Provides endpoints for geocoding, routing, and distance calculation.
 */
@RestController
@RequestMapping("/api/maps")
public class MapsController {

    private final MapsService mapsService;

    public MapsController(MapsService mapsService) {
        this.mapsService = mapsService;
    }

    /**
     * Geocode an address to coordinates
     * GET /api/maps/geocode?address=...
     */
    @GetMapping("/geocode")
    public ResponseEntity<GeocodeResultDto> geocodeAddress(@RequestParam String address) {
        try {
            GeocodeResultDto result = mapsService.geocodeAddress(address);
            if (result == null) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Calculate distance and duration between two addresses
     * GET /api/maps/distance?origin=...&destination=...
     */
    @GetMapping("/distance")
    public ResponseEntity<DistanceResultDto> calculateDistance(
            @RequestParam String origin,
            @RequestParam String destination) {
        try {
            DistanceResultDto result = mapsService.calculateDistance(origin, destination);
            if (result == null) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get basic address suggestions based on common Vietnamese locations
     * GET /api/maps/suggest-addresses?query=...&limit=10
     *
     * @param query Partial address string to search for (ignored in basic implementation)
     * @param limit Optional maximum number of suggestions (default 10)
     */
    @GetMapping("/suggest-addresses")
    public ResponseEntity<List<String>> suggestAddresses(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        try {
            List<String> suggestions = mapsService.getBasicAddressSuggestions(query, limit);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get route directions between two points
     * GET /api/maps/directions?originLat=...&originLng=...&destLat=...&destLng=...&includeGeometry=false&profile=truck
     *
     * @param includeGeometry Optional. Set to false to exclude geometry (reduces response size). Default: true
     * @param profile Optional routing profile (driving|truck). Default: driving
     */
    @GetMapping("/directions")
    public ResponseEntity<DirectionsResultDto> getDirections(
            @RequestParam String originLat,
            @RequestParam String originLng,
            @RequestParam String destLat,
            @RequestParam String destLng,
            @RequestParam(required = false, defaultValue = "true") boolean includeGeometry,
            @RequestParam(required = false, defaultValue = "driving") String profile) {
        try {
            DirectionsResultDto result = mapsService.getDirections(originLat, originLng, destLat, destLng, includeGeometry, profile);
            if (result == null) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Optimize a route for multiple waypoints (solves TSP)
     * POST /api/maps/optimize-route
     * 
     * @param request Contains list of points to visit in "latitude,longitude" format
     * @return Optimized route with total distance, duration, waypoint order and route geometry
     */
    @PostMapping("/optimize-route")
    public ResponseEntity<?> optimizeRoute(@RequestBody OptimizeRequestDto request) {
        try {
            OptimizedRouteDto result = mapsService.optimizeRoute(request);
            if (result == null) {
                return ResponseEntity.badRequest().body("Failed to optimize route. Please check your input points.");
            }
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException iae) {
            // Return specific parsing/geocoding errors back to the client
            return ResponseEntity.badRequest().body(iae.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal server error during route optimization: " + e.getMessage());
        }
    }
}
