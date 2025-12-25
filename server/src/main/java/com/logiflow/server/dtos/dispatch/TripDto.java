package com.logiflow.server.dtos.dispatch;

import com.logiflow.server.models.Trip;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.logiflow.server.controllers.maps.GpsTrackingController;
import com.logiflow.server.dtos.dispatch.TripProgressEventDto;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripDto {
    private Integer tripId;
    private Integer driverId;
    private String driverName;
    private String driverPhone;
    private Integer vehicleId;
    private String vehicleLicensePlate;
    private String vehicleType;
    private String vehicleRequiredLicense;
    private Integer routeId;
    private String routeName;
    private RouteDto route;
    private String tripType;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime actualDeparture;
    private LocalDateTime scheduledArrival;
    private LocalDateTime actualArrival;
    private String status;
    private LocalDateTime createdAt;
    private List<OrderDto> orders;

    // Live tracking (from in-memory GPS storage)
    private Double currentLat;
    private Double currentLng;

    // Progress timeline
    private List<TripProgressEventDto> progressEvents;

    public static TripDto fromTrip(Trip trip) {
        TripDto dto = new TripDto();
        dto.setTripId(trip.getTripId());
        dto.setVehicleId(trip.getVehicle() != null ? trip.getVehicle().getVehicleId() : null);
        dto.setVehicleLicensePlate(trip.getVehicle() != null ? trip.getVehicle().getLicensePlate() : null);
        dto.setVehicleType(trip.getVehicle() != null ? trip.getVehicle().getVehicleType() : null);
        dto.setVehicleRequiredLicense(trip.getVehicle() != null ? trip.getVehicle().getRequiredLicense() : null);
        dto.setRouteId(trip.getRoute() != null ? trip.getRoute().getRouteId() : null);
        dto.setRouteName(trip.getRoute() != null ? trip.getRoute().getRouteName() : null);
        dto.setRoute(trip.getRoute() != null ? RouteDto.fromRoute(trip.getRoute()) : null);
        dto.setTripType(trip.getTripType());
        dto.setScheduledDeparture(trip.getScheduledDeparture());
        dto.setActualDeparture(trip.getActualDeparture());
        dto.setScheduledArrival(trip.getScheduledArrival());
        dto.setActualArrival(trip.getActualArrival());
        dto.setStatus(trip.getStatus());
        dto.setCreatedAt(trip.getCreatedAt());

        // pick the first driver assignment (role=driver) if exists
        if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
            trip.getTripAssignments().stream()
                    .filter(ta -> ta.getDriver() != null)
                    .findFirst()
                    .ifPresent(ta -> {
                        dto.setDriverId(ta.getDriver().getDriverId());
                        dto.setDriverName(ta.getDriver().getUser().getFullName());
                        dto.setDriverPhone(ta.getDriver().getUser().getPhone());
                    });
        }

        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
            dto.setOrders(trip.getOrders().stream()
                    .map(OrderDto::fromOrder)
                    .collect(Collectors.toList()));
        } else {
            dto.setOrders(new java.util.ArrayList<>());
        }

        // Progress timeline
        if (trip.getProgressEvents() != null && !trip.getProgressEvents().isEmpty()) {
            dto.setProgressEvents(trip.getProgressEvents().stream()
                    .map(TripProgressEventDto::fromEntity)
                    .collect(Collectors.toList()));
        } else {
            dto.setProgressEvents(new java.util.ArrayList<>());
        }

        // Live location (latest) - only if we have a driver assignment
        if (dto.getDriverId() != null) {
            GpsTrackingController.LocationMessage latest = GpsTrackingController.getLatestLocation(
                    String.valueOf(dto.getDriverId()),
                    String.valueOf(dto.getTripId())
            );
            if (latest != null) {
                dto.setCurrentLat(latest.getLatitude());
                dto.setCurrentLng(latest.getLongitude());
            }
        }

        return dto;
    }
}
