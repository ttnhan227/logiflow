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
import org.springframework.beans.factory.annotation.Autowired;
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
    private final SimpMessagingTemplate messagingTemplate;
    private final DriverService driverService;

    @Autowired
    public GpsTrackingController(SimpMessagingTemplate messagingTemplate, DriverService driverService) {
        this.messagingTemplate = messagingTemplate;
        this.driverService = driverService;
    }
    // In-memory storage for latest driver/trip locations: driverId_tripId -> LocationMessage
    private static final Map<String, LocationMessage> latestLocations = new ConcurrentHashMap<>();
    // In-memory storage for location history: driverId_tripId -> List<LocationMessage>
    private static final Map<String, java.util.List<LocationMessage>> locationHistory = new ConcurrentHashMap<>();

    @MessageMapping("/tracking") // Client sends to /app/tracking
    @SendTo("/topic/locations")  // Broadcast to /topic/locations
    public LocationMessage receiveLocation(LocationMessage message, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("DEBUG: GPS WebSocket message received: " + message);

        // Get authenticated driverId from session attributes (set by JwtHandshakeInterceptor as "userId")
        String driverId = (String) headerAccessor.getSessionAttributes().get("userId");
        System.out.println("DEBUG: Authenticated driverId from session: " + driverId);

        if (driverId != null && message != null && message.getTripId() != null) {
            System.out.println("DEBUG: Processing GPS update - driver: " + driverId + ", trip: " + message.getTripId() +
                             ", lat: " + message.getLatitude() + ", lng: " + message.getLongitude());

            // Ignore driverId from client, use authenticated one
            LocationMessage serverMessage = new LocationMessage(driverId, message.getTripId(), message.getLatitude(), message.getLongitude());

            // Use a composite key: driverId_tripId
            String key = driverId + "_" + message.getTripId();
            latestLocations.put(key, serverMessage);
            // Add to location history
            locationHistory.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(serverMessage);

            // Update database for consistency (don't let DB errors break WebSocket)
            try {
                System.out.println("DEBUG: Updating database for driver " + driverId);
                // Get driver by username first, then update location
                com.logiflow.server.models.Driver driver = driverService.getCurrentDriver(driverId);
                if (driver != null) {
                    Integer driverIntId = driver.getDriverId();
                    String driverUsername = driver.getUser().getUsername();
                    System.out.println("DEBUG: Found driver - ID: " + driverIntId + ", Username: " + driverUsername);

                    driverService.updateMyLocation(
                        driverIntId,  // Use integer driver ID
                        BigDecimal.valueOf(message.getLatitude()),
                        BigDecimal.valueOf(message.getLongitude())
                    );
                    System.out.println("DEBUG: Database updated successfully for driver: " + driverUsername);
                } else {
                    System.err.println("ERROR: Driver lookup returned null for username: " + driverId);
                }
            } catch (Exception e) {
                // Log error but don't fail the WebSocket response
                System.err.println("ERROR: Failed to update driver location in database: " + e.getMessage());
                // Don't print full stack trace for LazyInitializationException
                if (!e.getMessage().contains("LazyInitializationException")) {
                    e.printStackTrace();
                }
            }

            // Also publish to trip-scoped topic so dispatch can subscribe by trip
            messagingTemplate.convertAndSend("/topic/trips/" + message.getTripId() + "/location", serverMessage);

            return serverMessage; // Broadcast to /topic/locations
        } else {
            System.out.println("WARN: Invalid GPS message - driverId: " + driverId + ", message: " + message);
        }
        return null;
    }
    // Get location history for a driver/trip
    public static java.util.List<LocationMessage> getLocationHistory(String driverId, String tripId) {
        String key = driverId + "_" + tripId;
        return locationHistory.getOrDefault(key, java.util.Collections.emptyList());
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
