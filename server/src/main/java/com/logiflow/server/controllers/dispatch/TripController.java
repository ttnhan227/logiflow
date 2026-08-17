package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.DeliveryConfirmationResponseDto;
import com.logiflow.server.dtos.dispatch.TripCreateRequest;
import com.logiflow.server.dtos.dispatch.TripDto;
import com.logiflow.server.dtos.dispatch.TripListResponse;
import com.logiflow.server.dtos.dispatch.TripAssignRequest;
import com.logiflow.server.dtos.dispatch.TripStatusUpdateRequest;
import com.logiflow.server.dtos.dispatch.TripCancelRequest;
import com.logiflow.server.dtos.dispatch.TripRerouteRequest;
import com.logiflow.server.services.dispatch.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dispatch")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @GetMapping("/trips")
    public ResponseEntity<TripListResponse> getTrips(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        TripListResponse response = tripService.getTrips(status, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trips/{tripId}")
    public ResponseEntity<TripDto> getTripById(@PathVariable Integer tripId) {
        TripDto trip = tripService.getTripById(tripId);
        return ResponseEntity.ok(trip);
    }

    // Proof of delivery (POD) / delivery confirmation
    @GetMapping("/trips/{tripId}/delivery-confirmation")
    public ResponseEntity<DeliveryConfirmationResponseDto> getDeliveryConfirmation(@PathVariable Integer tripId) {
        DeliveryConfirmationResponseDto pod = tripService.getDeliveryConfirmation(tripId);
        return ResponseEntity.ok(pod);
    }

    @PostMapping("/trips")
    public ResponseEntity<TripDto> createTrip(
            @Valid @RequestBody TripCreateRequest request) {
        TripDto createdTrip = tripService.createTrip(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTrip);
    }

    @PutMapping("/trips/{tripId}/assign")
    public ResponseEntity<TripDto> assignTrip(
            @PathVariable Integer tripId,
            @Valid @RequestBody TripAssignRequest request) {
        TripDto updated = tripService.assignTrip(tripId, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/trips/{tripId}/status")
    public ResponseEntity<TripDto> updateTripStatus(
            @PathVariable Integer tripId,
            @Valid @RequestBody TripStatusUpdateRequest request) {
        TripDto updated = tripService.updateTripStatus(tripId, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/trips/{tripId}/reroute")
    public ResponseEntity<TripDto> rerouteTrip(
            @PathVariable Integer tripId,
            @Valid @RequestBody TripRerouteRequest request) {
        TripDto updated = tripService.rerouteTrip(tripId, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/trips/{tripId}/cancel")
    public ResponseEntity<TripDto> cancelTrip(
            @PathVariable Integer tripId,
            @Valid @RequestBody TripCancelRequest request) {
        TripDto updated = tripService.cancelTrip(tripId, request);
        return ResponseEntity.ok(updated);
    }
}
