package com.logiflow.server.controllers.maps;

import com.logiflow.server.controllers.maps.GpsTrackingController.LocationMessage;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maps/gps")
public class GpsLocationController {

    private final TripAssignmentRepository tripAssignmentRepository;
    private final OrderRepository orderRepository;

    public GpsLocationController(
            TripAssignmentRepository tripAssignmentRepository,
            OrderRepository orderRepository) {
        this.tripAssignmentRepository = tripAssignmentRepository;
        this.orderRepository = orderRepository;
    }

    // Get the latest location for a driver/trip
    @GetMapping("/latest")
    public ResponseEntity<LocationMessage> getLatestLocation(
            @RequestParam String driverId,
            @RequestParam String tripId,
            Authentication authentication) {
        enforceAccess(driverId, tripId, authentication);
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
            @RequestParam String tripId,
            Authentication authentication) {
        enforceAccess(driverId, tripId, authentication);
        List<LocationMessage> history = GpsTrackingController.getLocationHistory(driverId, tripId);
        return ResponseEntity.ok(history);
    }

    private void enforceAccess(String driverId, String tripId, Authentication authentication) {
        if (!GpsTrackingController.isValidTripId(tripId) || driverId == null || driverId.isBlank()) {
            throw new IllegalArgumentException("Invalid driverId or tripId");
        }
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }

        boolean isOps = hasRole(authentication, "ROLE_ADMIN") || hasRole(authentication, "ROLE_DISPATCHER");
        if (isOps) {
            return;
        }

        String username = authentication.getName();
        Integer numericTripId = parsePositiveInt(tripId);
        if (numericTripId == null) {
            throw new AccessDeniedException("Not authorized to access GPS data for this trip");
        }

        if (hasRole(authentication, "ROLE_DRIVER")
                && driverId.equals(username)
                && tripAssignmentRepository.existsAssignedTrip(username, numericTripId)) {
            return;
        }

        if (hasRole(authentication, "ROLE_CUSTOMER")
                && orderRepository.existsByTrip_TripIdAndCustomer_Username(numericTripId, username)
                && tripAssignmentRepository.existsAssignedTrip(driverId, numericTripId)) {
            return;
        }

        throw new AccessDeniedException("Not authorized to access GPS data for this driver or trip");
    }

    private static boolean hasRole(Authentication authentication, String roleAuthority) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> roleAuthority.equals(a.getAuthority()));
    }

    private static Integer parsePositiveInt(String raw) {
        try {
            int val = Integer.parseInt(raw);
            return val > 0 ? val : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
