package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.TripCreateRequest;
import com.logiflow.server.dtos.dispatch.TripDto;
import com.logiflow.server.dtos.dispatch.TripListResponse;
import com.logiflow.server.dtos.dispatch.TripAssignRequest;
import com.logiflow.server.dtos.dispatch.TripStatusUpdateRequest;
import com.logiflow.server.dtos.dispatch.TripCancelRequest;
import com.logiflow.server.dtos.dispatch.TripRerouteRequest;
import com.logiflow.server.services.dispatch.TripService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/dispatch")
public class TripController {

    @Autowired
    private TripService tripService;

    @GetMapping("/trips")
    public ResponseEntity<?> getTrips(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            TripListResponse response = tripService.getTrips(status, page, size);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/trips/{tripId}")
    public ResponseEntity<?> getTripById(@PathVariable Integer tripId) {
        try {
            TripDto trip = tripService.getTripById(tripId);
            return ResponseEntity.ok(trip);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // Proof of delivery (POD) / delivery confirmation
    @GetMapping("/trips/{tripId}/delivery-confirmation")
    public ResponseEntity<?> getDeliveryConfirmation(@PathVariable Integer tripId) {
        try {
            var pod = tripService.getDeliveryConfirmation(tripId);
            return ResponseEntity.ok(pod);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/trips")
    public ResponseEntity<?> createTrip(
            @Valid @RequestBody TripCreateRequest request) {
        try {
            TripDto createdTrip = tripService.createTrip(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdTrip);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/trips/{tripId}/assign")
    public ResponseEntity<?> assignTrip(
            @PathVariable Integer tripId,
            @Valid @RequestBody TripAssignRequest request) {
        try {
            TripDto updated = tripService.assignTrip(tripId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/trips/{tripId}/status")
    public ResponseEntity<?> updateTripStatus(
            @PathVariable Integer tripId,
            @Valid @RequestBody TripStatusUpdateRequest request) {
        try {
            TripDto updated = tripService.updateTripStatus(tripId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/trips/{tripId}/reroute")
    public ResponseEntity<?> rerouteTrip(
            @PathVariable Integer tripId,
            @Valid @RequestBody TripRerouteRequest request) {
        try {
            TripDto updated = tripService.rerouteTrip(tripId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/trips/{tripId}/cancel")
    public ResponseEntity<?> cancelTrip(
            @PathVariable Integer tripId,
            @Valid @RequestBody TripCancelRequest request) {
        try {
            TripDto updated = tripService.cancelTrip(tripId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
