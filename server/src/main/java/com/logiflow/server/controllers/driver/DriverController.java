/**
 * DriverController REST endpoints
 *
 * Real-time location updates are handled via WebSocket:
 *   - Driver client connects to ws://localhost:8080/ws/tracking?token=JWT
 *   - Sends location messages to /app/tracking (STOMP)
 *   - Receives live location updates from /topic/locations
 *
 * See GpsTrackingController for message format and in-memory storage.
 */
package com.logiflow.server.controllers.driver;

import com.logiflow.server.dtos.driver.DriverDtos.*;
import com.logiflow.server.services.driver.DriverService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/driver/me")
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    // 1) GET /api/driver/me/trips?status={status}
    @GetMapping("/trips")
    public ResponseEntity<List<TripSummaryDto>> getMyTrips(
            @RequestParam(required = false) String status,
            Authentication authentication
    ) {
        var driver = driverService.getCurrentDriver(authentication.getName());
        var result = driverService.getMyTrips(driver.getDriverId(), status);
        return ResponseEntity.ok(result);
    }

    // 2) GET /api/driver/me/trips/{tripId}
    @GetMapping("/trips/{tripId}")
    public ResponseEntity<TripDetailDto> getMyTripDetail(
            @PathVariable Integer tripId,
            Authentication authentication
    ) {
        var driver = driverService.getCurrentDriver(authentication.getName());
        var result = driverService.getMyTripDetail(driver.getDriverId(), tripId);
        return ResponseEntity.ok(result);
    }

    // 3) POST /api/driver/me/location
    @PostMapping("/location")
    public ResponseEntity<Void> updateMyLocation(
            @RequestBody UpdateLocationRequest body,
            Authentication authentication
    ) {
        if (body == null || body.getLatitude() == null || body.getLongitude() == null) {
            return ResponseEntity.badRequest().build();
        }
        var driver = driverService.getCurrentDriver(authentication.getName());
        driverService.updateMyLocation(driver.getDriverId(), body.getLatitude(), body.getLongitude());
        return ResponseEntity.ok().build();
    }

    // 4) GET /api/driver/me/schedule?startDate=&endDate=
    @GetMapping("/schedule")
    public ResponseEntity<List<ScheduleItemDto>> getMySchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        if (endDate.isBefore(startDate)) {
            return ResponseEntity.badRequest().build();
        }
        var driver = driverService.getCurrentDriver(authentication.getName());
        var result = driverService.getMySchedule(driver.getDriverId(), startDate, endDate);
        return ResponseEntity.ok(result);
    }

    // 5) GET /api/driver/me/compliance/rest-periods
    @GetMapping("/compliance/rest-periods")
    public ResponseEntity<ComplianceDto> getMyCompliance(Authentication authentication) {
        var driver = driverService.getCurrentDriver(authentication.getName());
        var result = driverService.getMyCompliance(driver.getDriverId());
        return ResponseEntity.ok(result);
    }
}
