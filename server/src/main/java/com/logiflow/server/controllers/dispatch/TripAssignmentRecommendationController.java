package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.RecommendedDriverDto;
import com.logiflow.server.services.dispatch.TripAssignmentMatchingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/dispatch")
@Validated
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
            @RequestParam(name = "limit", required = false, defaultValue = "10") @Min(1) @Max(50) Integer limit
    ) {
        return ResponseEntity.ok(matchingService.recommendDrivers(tripId, limit));
    }
}
