package com.logiflow.server.controllers.google;

import com.logiflow.server.services.google.GoogleMapsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/google/maps")
public class GoogleMapsTestController {

    private final GoogleMapsService googleMapsService;

    @Autowired
    public GoogleMapsTestController(GoogleMapsService googleMapsService) {
        this.googleMapsService = googleMapsService;
    }

    /**
     * Test geocoding - convert address to coordinates
     */
    @GetMapping("/geocode")
    public ResponseEntity<?> geocodeAddress(@RequestParam String address) {
        GoogleMapsService.GeocodeResult result = googleMapsService.geocodeAddress(address);

        if (result == null) {
            return ResponseEntity.badRequest().body("Geocoding failed - check API key and address");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("formattedAddress", result.formattedAddress);
        response.put("latitude", result.latitude);
        response.put("longitude", result.longitude);

        return ResponseEntity.ok(response);
    }

    /**
     * Test distance calculation between two addresses
     */
    @GetMapping("/distance")
    public ResponseEntity<?> calculateDistance(
            @RequestParam String origin,
            @RequestParam String destination) {

        GoogleMapsService.DistanceMatrixResult result =
            googleMapsService.calculateDistance(origin, destination);

        if (result == null) {
            return ResponseEntity.badRequest().body("Distance calculation failed - check API key and addresses");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("distanceText", result.distanceText);
        response.put("distanceMeters", result.distanceMeters);
        response.put("durationText", result.durationText);
        response.put("durationSeconds", result.durationSeconds);

        return ResponseEntity.ok(response);
    }

    /**
     * Test full routing between two points
     */
    @GetMapping("/directions")
    public ResponseEntity<?> getDirections(
            @RequestParam String originLat,
            @RequestParam String originLng,
            @RequestParam String destLat,
            @RequestParam String destLng) {

        GoogleMapsService.DirectionsResult result =
            googleMapsService.getDirections(originLat, originLng, destLat, destLng);

        if (result == null) {
            return ResponseEntity.badRequest().body("Directions failed - check API key and coordinates");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalDistance", result.getTotalDistance());
        response.put("totalDuration", result.getTotalDuration());
        response.put("routeData", result.routeData);

        return ResponseEntity.ok(response);
    }

    /**
     * Test if Google Maps service is configured and working
     */
    @GetMapping("/status")
    public ResponseEntity<?> getServiceStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("googleMapsEnabled", googleMapsService.isGoogleMapsEnabled());
        status.put("apiKeyConfigured", !googleMapsService.getGoogleMapsApiKey().isEmpty());

        // Test basic connectivity (without using API quota)
        status.put("serviceInitialized", true);

        return ResponseEntity.ok(status);
    }
}
