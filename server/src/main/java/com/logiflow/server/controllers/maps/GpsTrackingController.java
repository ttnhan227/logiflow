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
 * In-memory storage provides latest and historical locations per driver/trip.
 *
 * See also: /api/maps/gps/latest and /api/maps/gps/history for REST access.
 */
package com.logiflow.server.controllers.maps;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class GpsTrackingController {
    private final SimpMessagingTemplate messagingTemplate;

    public GpsTrackingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    // In-memory storage for latest driver/trip locations: driverId_tripId -> LocationMessage
    private static final Map<String, LocationMessage> latestLocations = new ConcurrentHashMap<>();
    // In-memory storage for location history: driverId_tripId -> List<LocationMessage>
    private static final Map<String, java.util.List<LocationMessage>> locationHistory = new ConcurrentHashMap<>();

    @MessageMapping("/tracking") // Client sends to /app/tracking
    @SendTo("/topic/locations")  // Broadcast to /topic/locations
    public LocationMessage receiveLocation(LocationMessage message, SimpMessageHeaderAccessor headerAccessor) {
        // Get authenticated driverId from session attributes
        String driverId = (String) headerAccessor.getSessionAttributes().get("driverId");
        if (driverId != null && message != null && message.getTripId() != null) {
            // Ignore driverId from client, use authenticated one
            LocationMessage serverMessage = new LocationMessage(driverId, message.getTripId(), message.getLatitude(), message.getLongitude());
            // Use a composite key: driverId_tripId
            String key = driverId + "_" + message.getTripId();
            latestLocations.put(key, serverMessage);
            // Add to location history
            locationHistory.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(serverMessage);

            // Broadcast to global topic (existing)
            // return serverMessage; // still sent to /topic/locations via @SendTo

            // Also publish to trip-scoped topic so dispatch can subscribe by trip
            messagingTemplate.convertAndSend("/topic/trips/" + message.getTripId() + "/location", serverMessage);

            return serverMessage; // Broadcast to /topic/locations
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
    }
}
