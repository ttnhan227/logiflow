package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.trip.TripStatusUpdateRequest;
import com.logiflow.server.dtos.admin.trip.TripOversightDto;
import com.logiflow.server.dtos.admin.trip.TripOversightListResponse;
import com.logiflow.server.services.admin.TripOversightService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/trips")
public class TripOversightController {

    @Autowired
    private TripOversightService tripOversightService;

    @GetMapping("/{tripId}")
    public ResponseEntity<TripOversightDto> getTripOversight(@PathVariable Integer tripId) {
        try {
            TripOversightDto dto = tripOversightService.getTripOversight(tripId);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException ex) {
            // Check if it's a "not found" error
            if (ex.getMessage() != null && ex.getMessage().contains("Trip not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/oversight")
    public ResponseEntity<TripOversightListResponse> getTripsOversight(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            TripOversightListResponse response = tripOversightService.getTripsOversight(status, page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/delay-reports")
    public ResponseEntity<List<TripOversightDto>> getTripsWithDelayReports() {
        try {
            List<TripOversightDto> delayedTrips = tripOversightService.getTripsWithDelayReports();
            return ResponseEntity.ok(delayedTrips);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{tripId}/status")
    public ResponseEntity<TripOversightDto> updateTripStatus(
            @PathVariable Integer tripId,
            @Valid @RequestBody TripStatusUpdateRequest request) {
        try {
            TripOversightDto dto = tripOversightService.updateTripStatus(tripId, request.getStatus());
            return ResponseEntity.ok(dto);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{tripId}/delay-response")
    public ResponseEntity<TripOversightDto> respondToTripDelayReport(
            @PathVariable Integer tripId,
            @RequestBody DelayResponseRequest request) {
        try {
            TripOversightDto dto = tripOversightService.respondToTripDelayReport(
                tripId,
                request.getResponseType(),
                request.getExtensionMinutes()
            );
            return ResponseEntity.ok(dto);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }



    // Inner DTO for delay responses
    public static class DelayResponseRequest {
        private String responseType;
        private Integer extensionMinutes;

        public DelayResponseRequest() {}

        public DelayResponseRequest(String responseType, Integer extensionMinutes) {
            this.responseType = responseType;
            this.extensionMinutes = extensionMinutes;
        }

        public String getResponseType() {
            return responseType;
        }
        public void setResponseType(String responseType) {
            this.responseType = responseType;
        }

        public Integer getExtensionMinutes() {
            return extensionMinutes;
        }
        public void setExtensionMinutes(Integer extensionMinutes) {
            this.extensionMinutes = extensionMinutes;
        }
    }
}
