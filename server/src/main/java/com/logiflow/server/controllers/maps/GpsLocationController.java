package com.logiflow.server.controllers.maps;

import com.logiflow.server.controllers.maps.GpsTrackingController.LocationMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/maps/gps")
public class GpsLocationController {

    // Get the latest location for a driver/trip
    @GetMapping("/latest")
    public ResponseEntity<LocationMessage> getLatestLocation(
            @RequestParam String driverId,
            @RequestParam String tripId) {
        LocationMessage latest = GpsTrackingController.getLatestLocation(driverId, tripId);
        if (latest == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(latest);
    }

    // Get location history for a driver/trip
    @GetMapping("/history")
    public ResponseEntity<List<LocationMessage>> getLocationHistory(
            @RequestParam String driverId,
            @RequestParam String tripId) {
        List<LocationMessage> history = GpsTrackingController.getLocationHistory(driverId, tripId);
        return ResponseEntity.ok(history);
    }
}
