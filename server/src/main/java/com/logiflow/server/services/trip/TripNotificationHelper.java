package com.logiflow.server.services.trip;

import com.logiflow.server.models.Trip;
import com.logiflow.server.models.TripAssignment;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.websocket.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TripNotificationHelper {
    
    private final NotificationService notificationService;
    private final TripAssignmentRepository tripAssignmentRepository;
    private final TripRepository tripRepository;

    public TripNotificationHelper(NotificationService notificationService, 
                                  TripAssignmentRepository tripAssignmentRepository,
                                  TripRepository tripRepository) {
        this.notificationService = notificationService;
        this.tripAssignmentRepository = tripAssignmentRepository;
        this.tripRepository = tripRepository;
    }

    /**
     * Notify driver when a new trip is assigned
     */
    public void notifyTripAssigned(Integer tripId, Integer driverId) {
        Trip trip = tripRepository.findByIdWithRelations(tripId).orElse(null);
        if (trip != null && driverId != null) {
            String message = "New trip assigned: " + (trip.getRoute() != null ? trip.getRoute().getRouteName() : "Trip #" + tripId);
            String driverUsername = null;
            if (trip.getTripAssignments() != null) {
                var assignment = trip.getTripAssignments().stream()
                        .filter(ta -> ta.getDriver() != null && driverId.equals(ta.getDriver().getDriverId()))
                        .findFirst()
                        .orElse(null);
                if (assignment != null && assignment.getDriver().getUser() != null) {
                    driverUsername = assignment.getDriver().getUser().getUsername();
                }
            }

            if (driverUsername != null && !driverUsername.isBlank()) {
                notificationService.sendTripNotificationByUsername(driverUsername, tripId, "TRIP_ASSIGNED", message, trip.getStatus());
            } else {
                notificationService.sendTripNotification(driverId, tripId, "TRIP_ASSIGNED", message, trip.getStatus());
            }
        }
    }

    /**
     * Notify driver when a trip is rerouted
     */
    public void notifyTripRerouted(Integer tripId, Integer driverId, String newRoute) {
        String message = "Trip #" + tripId + " has been rerouted. New route: " + newRoute;
        Trip trip = tripRepository.findByIdWithRelations(tripId).orElse(null);
        String driverUsername = null;
        if (trip != null && trip.getTripAssignments() != null) {
            var assignment = trip.getTripAssignments().stream()
                    .filter(ta -> ta.getDriver() != null && driverId.equals(ta.getDriver().getDriverId()))
                    .findFirst()
                    .orElse(null);
            if (assignment != null && assignment.getDriver().getUser() != null) {
                driverUsername = assignment.getDriver().getUser().getUsername();
            }
        }

        if (driverUsername != null && !driverUsername.isBlank()) {
            notificationService.sendTripNotificationByUsername(driverUsername, tripId, "TRIP_REROUTED", message, null);
        } else {
            notificationService.sendTripNotification(driverId, tripId, "TRIP_REROUTED", message, null);
        }
    }

    /**
     * Notify driver when a trip is cancelled by dispatcher
     */
    public void notifyTripCancelledByDispatcher(Integer tripId, Integer driverId, String reason) {
        String message = "Trip #" + tripId + " has been cancelled" + (reason != null ? ": " + reason : "");
        Trip trip = tripRepository.findByIdWithRelations(tripId).orElse(null);
        String driverUsername = null;
        if (trip != null && trip.getTripAssignments() != null) {
            var assignment = trip.getTripAssignments().stream()
                    .filter(ta -> ta.getDriver() != null && driverId.equals(ta.getDriver().getDriverId()))
                    .findFirst()
                    .orElse(null);
            if (assignment != null && assignment.getDriver().getUser() != null) {
                driverUsername = assignment.getDriver().getUser().getUsername();
            }
        }

        if (driverUsername != null && !driverUsername.isBlank()) {
            notificationService.sendTripNotificationByUsername(driverUsername, tripId, "TRIP_CANCELLED_BY_DISPATCHER", message, "cancelled");
        } else {
            notificationService.sendTripNotification(driverId, tripId, "TRIP_CANCELLED_BY_DISPATCHER", message, "cancelled");
        }
    }

    /**
     * Notify driver when a trip is updated (time, location, etc.)
     */
    public void notifyTripUpdated(Integer tripId, Integer driverId, String updateDetails) {
        String message = "Trip #" + tripId + " has been updated: " + updateDetails;
        Trip trip = tripRepository.findByIdWithRelations(tripId).orElse(null);
        String driverUsername = null;
        if (trip != null && trip.getTripAssignments() != null) {
            var assignment = trip.getTripAssignments().stream()
                    .filter(ta -> ta.getDriver() != null && driverId.equals(ta.getDriver().getDriverId()))
                    .findFirst()
                    .orElse(null);
            if (assignment != null && assignment.getDriver().getUser() != null) {
                driverUsername = assignment.getDriver().getUser().getUsername();
            }
        }

        if (driverUsername != null && !driverUsername.isBlank()) {
            notificationService.sendTripNotificationByUsername(driverUsername, tripId, "TRIP_UPDATED", message, null);
        } else {
            notificationService.sendTripNotification(driverId, tripId, "TRIP_UPDATED", message, null);
        }
    }
}
