package com.logiflow.server.controllers.maps;

import com.logiflow.server.dtos.maps.GeocodeResultDto;
import com.logiflow.server.dtos.maps.DirectionsResultDto;
import com.logiflow.server.dtos.maps.DistanceResultDto;
import com.logiflow.server.services.maps.MapsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
     * Get route directions between two points
     * GET /api/maps/directions?originLat=...&originLng=...&destLat=...&destLng=...&includeGeometry=false
     * 
     * @param includeGeometry Optional. Set to false to exclude geometry (reduces response size). Default: true
     */
    @GetMapping("/directions")
    public ResponseEntity<DirectionsResultDto> getDirections(
            @RequestParam String originLat,
            @RequestParam String originLng,
            @RequestParam String destLat,
            @RequestParam String destLng,
            @RequestParam(required = false, defaultValue = "true") boolean includeGeometry) {
        try {
            DirectionsResultDto result = mapsService.getDirections(originLat, originLng, destLat, destLng, includeGeometry);
            if (result == null) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

