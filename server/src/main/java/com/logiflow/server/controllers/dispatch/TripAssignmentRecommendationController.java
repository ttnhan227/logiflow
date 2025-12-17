package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.RecommendedDriverDto;
import com.logiflow.server.services.dispatch.TripAssignmentMatchingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispatch")
public class TripAssignmentRecommendationController {

    private final TripAssignmentMatchingService matchingService;

    public TripAssignmentRecommendationController(TripAssignmentMatchingService matchingService) {
        this.matchingService = matchingService;
    }

    /**
     * GET /api/dispatch/trips/{tripId}/recommended-drivers?limit=10
     */
    @GetMapping("/trips/{tripId}/recommended-drivers")
    public ResponseEntity<?> getRecommendedDrivers(
            @PathVariable Integer tripId,
            @RequestParam(name = "limit", required = false, defaultValue = "10") Integer limit
    ) {
        try {
            List<RecommendedDriverDto> result = matchingService.recommendDrivers(tripId, limit);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
