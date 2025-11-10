package com.logiflow.server.dtos.notification;

import java.time.LocalDateTime;

public class TripNotificationDto {
    private String type; // TRIP_ASSIGNED, TRIP_UPDATED, TRIP_CANCELLED, TRIP_REROUTED, STATUS_CHANGED
    private String message;
    private Integer tripId;
    private String tripStatus;
    private LocalDateTime timestamp;
    private Object additionalData; // For route changes, etc.

    public TripNotificationDto() {
        this.timestamp = LocalDateTime.now();
    }

    public TripNotificationDto(String type, String message, Integer tripId, String tripStatus) {
        this.type = type;
        this.message = message;
        this.tripId = tripId;
        this.tripStatus = tripStatus;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getTripId() {
        return tripId;
    }

    public void setTripId(Integer tripId) {
        this.tripId = tripId;
    }

    public String getTripStatus() {
        return tripStatus;
    }

    public void setTripStatus(String tripStatus) {
        this.tripStatus = tripStatus;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Object getAdditionalData() {
        return additionalData;
    }

    public void setAdditionalData(Object additionalData) {
        this.additionalData = additionalData;
    }
}
