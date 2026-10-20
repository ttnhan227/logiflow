/**
 * WebSocket controller for real-time GPS tracking.
 *
 * Usage:
 *   - Client connects to ws://localhost:8080/ws/tracking?token=JWT (STOMP)
 *   - Sends LocationMessage to /app/tracking
 *   - Receives broadcast updates from /topic/locations
 *
 * LocationMessage fields: driverId (ignored, set by backend), tripId, latitude, longitude
 *
 * Updates both in-memory storage (real-time) and database (consistency).
 *
 * See also: /api/maps/gps/latest and /api/maps/gps/history for REST access.
 */
package com.logiflow.server.controllers.maps;

import com.logiflow.server.services.driver.DriverService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class GpsTrackingController {
    private static final Logger log = LoggerFactory.getLogger(GpsTrackingController.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final DriverService driverService;

    public GpsTrackingController(SimpMessagingTemplate messagingTemplate, DriverService driverService) {
        this.messagingTemplate = messagingTemplate;
        this.driverService = driverService;
    }
    public static final int MAX_HISTORY_PER_TRIP = 100;

    // In-memory storage for latest driver/trip locations: driverId_tripId -> LocationMessage
    private static final Map<String, LocationMessage> latestLocations = new ConcurrentHashMap<>();
    // In-memory storage for location history: driverId_tripId -> List<LocationMessage>
    private static final Map<String, java.util.List<LocationMessage>> locationHistory = new ConcurrentHashMap<>();

    public static boolean isValidCoordinate(double latitude, double longitude) {
        if (Double.isNaN(latitude) || Double.isInfinite(latitude) ||
            Double.isNaN(longitude) || Double.isInfinite(longitude)) {
            return false;
        }
        return latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0;
    }

    public static boolean isValidTripId(String tripId) {
        return tripId != null && !tripId.isBlank() && tripId.matches("^[a-zA-Z0-9_-]{1,64}$");
    }

    public static void appendLocationHistory(String key, LocationMessage message) {
        locationHistory.compute(key, (k, list) -> {
            if (list == null) {
                list = java.util.Collections.synchronizedList(new java.util.ArrayList<>());
            }
            synchronized (list) {
                if (list.size() >= MAX_HISTORY_PER_TRIP) {
                    list.remove(0);
                }
                list.add(message);
            }
            return list;
        });
    }

    public static void clearHistoryForTest() {
        latestLocations.clear();
        locationHistory.clear();
    }

    @MessageMapping("/tracking") // Client sends to /app/tracking
    @SendTo("/topic/locations")  // Broadcast to /topic/locations
    public LocationMessage receiveLocation(LocationMessage message, SimpMessageHeaderAccessor headerAccessor) {
        log.debug("GPS WebSocket message received: {}", message);

        // Get authenticated driverId from session attributes (set by JwtHandshakeInterceptor as "userId")
        String driverId = headerAccessor != null && headerAccessor.getSessionAttributes() != null
                ? (String) headerAccessor.getSessionAttributes().get("userId")
                : null;
        log.debug("Authenticated driverId from session: {}", driverId);

        if (driverId != null && message != null && isValidTripId(message.getTripId())) {
            if (!isValidCoordinate(message.getLatitude(), message.getLongitude())) {
                log.warn("Invalid GPS coordinates received - driver: {}, lat: {}, lng: {}",
                    driverId, message.getLatitude(), message.getLongitude());
                return null;
            }

            log.debug("Processing GPS update - driver: {}, trip: {}, lat: {}, lng: {}",
                driverId, message.getTripId(), message.getLatitude(), message.getLongitude());

            // Ignore driverId from client, use authenticated one
            LocationMessage serverMessage = new LocationMessage(driverId, message.getTripId(), message.getLatitude(), message.getLongitude());

            // Use a composite key: driverId_tripId
            String key = driverId + "_" + message.getTripId();
            latestLocations.put(key, serverMessage);
            // Add to bounded location history
            appendLocationHistory(key, serverMessage);

            // Update database for consistency (don't let DB errors break WebSocket)
            try {
                log.debug("Updating database for driver {}", driverId);
                // Get driver by username first, then update location
                com.logiflow.server.models.Driver driver = driverService.getCurrentDriver(driverId);
                if (driver != null) {
                    Integer driverIntId = driver.getDriverId();
                    log.debug("Found driver - ID: {}, Username: {}", driverIntId, driverId);

                    driverService.updateMyLocation(
                        driverIntId,  // Use integer driver ID
                        BigDecimal.valueOf(message.getLatitude()),
                        BigDecimal.valueOf(message.getLongitude())
                    );
                    log.debug("Database updated successfully for driver: {}", driverId);
                } else {
                    log.warn("Driver lookup returned null for username: {}", driverId);
                }
            } catch (Exception e) {
                // Log error but don't fail the WebSocket response
                log.error("Failed to update driver location in database: {}", e.getMessage());
                // Don't print full stack trace for LazyInitializationException
                if (e.getMessage() != null && !e.getMessage().contains("LazyInitializationException")) {
                    log.error("Stack trace:", e);
                }
            }

            // Also publish to trip-scoped topic so dispatch can subscribe by trip
            messagingTemplate.convertAndSend("/topic/trips/" + message.getTripId() + "/location", serverMessage);

            return serverMessage; // Broadcast to /topic/locations
        } else {
            log.warn("Invalid GPS message - driverId: {}, message: {}", driverId, message);
        }
        return null;
    }
    // Get location history for a driver/trip
    public static java.util.List<LocationMessage> getLocationHistory(String driverId, String tripId) {
        String key = driverId + "_" + tripId;
        java.util.List<LocationMessage> history = locationHistory.get(key);
        if (history == null) {
            return java.util.Collections.emptyList();
        }
        synchronized (history) {
            return new java.util.ArrayList<>(history);
        }
    }

    // Optionally, add a method to get the latest location for a driver/trip
    public static LocationMessage getLatestLocation(String driverId, String tripId) {
        String key = driverId + "_" + tripId;
        return latestLocations.get(key);
    }

    // DTO for location messages
    public static class LocationMessage {
        private String driverId;
        private String tripId;
        private double latitude;
        private double longitude;

        public LocationMessage() {}
        public LocationMessage(String driverId, String tripId, double latitude, double longitude) {
            this.driverId = driverId;
            this.tripId = tripId;
            this.latitude = latitude;
            this.longitude = longitude;
        }

        public String getDriverId() { return driverId; }
        public void setDriverId(String driverId) { this.driverId = driverId; }
        public String getTripId() { return tripId; }
        public void setTripId(String tripId) { this.tripId = tripId; }
        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }
        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }

        @Override
        public String toString() {
            return "LocationMessage{" +
                    "driverId='" + driverId + '\'' +
                    ", tripId='" + tripId + '\'' +
                    ", latitude=" + latitude +
                    ", longitude=" + longitude +
                    '}';
        }
    }
}
