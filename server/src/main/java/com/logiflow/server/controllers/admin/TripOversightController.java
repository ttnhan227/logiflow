package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.trip.TripStatusUpdateRequest;
import com.logiflow.server.dtos.admin.trip.TripOversightDto;
import com.logiflow.server.dtos.admin.trip.TripOversightListResponse;
import com.logiflow.server.services.admin.TripOversightService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/trips")
public class TripOversightController {

    private final TripOversightService tripOversightService;

    public TripOversightController(TripOversightService tripOversightService) {
        this.tripOversightService = tripOversightService;
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<TripOversightDto> getTripOversight(@PathVariable Integer tripId) {
        TripOversightDto dto = tripOversightService.getTripOversight(tripId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/oversight")
    public ResponseEntity<TripOversightListResponse> getTripsOversight(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        TripOversightListResponse response = tripOversightService.getTripsOversight(status, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/delay-reports")
    public ResponseEntity<List<TripOversightDto>> getTripsWithDelayReports() {
        List<TripOversightDto> delayedTrips = tripOversightService.getTripsWithDelayReports();
        return ResponseEntity.ok(delayedTrips);
    }

    @PutMapping("/{tripId}/status")
    public ResponseEntity<TripOversightDto> updateTripStatus(
            @PathVariable Integer tripId,
            @Valid @RequestBody TripStatusUpdateRequest request) {
        TripOversightDto dto = tripOversightService.updateTripStatus(tripId, request.getStatus());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{tripId}/delay-response")
    public ResponseEntity<TripOversightDto> respondToTripDelayReport(
            @PathVariable Integer tripId,
            @RequestBody DelayResponseRequest request) {
        TripOversightDto dto = tripOversightService.respondToTripDelayReport(
            tripId,
            request.getResponseType(),
            request.getExtensionMinutes()
        );
        return ResponseEntity.ok(dto);
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
