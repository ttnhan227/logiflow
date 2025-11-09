package com.logiflow.server.dtos.dispatch;

import com.logiflow.server.models.Trip;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripDto {
    private Integer tripId;
    private Integer vehicleId;
    private String vehicleLicensePlate;
    private Integer routeId;
    private String routeName;
    private String tripType;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime actualDeparture;
    private LocalDateTime scheduledArrival;
    private LocalDateTime actualArrival;
    private String status;
    private LocalDateTime createdAt;
    private List<OrderDto> orders;

    public static TripDto fromTrip(Trip trip) {
        TripDto dto = new TripDto();
        dto.setTripId(trip.getTripId());
        dto.setVehicleId(trip.getVehicle() != null ? trip.getVehicle().getVehicleId() : null);
        dto.setVehicleLicensePlate(trip.getVehicle() != null ? trip.getVehicle().getLicensePlate() : null);
        dto.setRouteId(trip.getRoute() != null ? trip.getRoute().getRouteId() : null);
        dto.setRouteName(trip.getRoute() != null ? trip.getRoute().getRouteName() : null);
        dto.setTripType(trip.getTripType());
        dto.setScheduledDeparture(trip.getScheduledDeparture());
        dto.setActualDeparture(trip.getActualDeparture());
        dto.setScheduledArrival(trip.getScheduledArrival());
        dto.setActualArrival(trip.getActualArrival());
        dto.setStatus(trip.getStatus());
        dto.setCreatedAt(trip.getCreatedAt());

        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
            dto.setOrders(trip.getOrders().stream()
                    .map(OrderDto::fromOrder)
                    .collect(Collectors.toList()));
        } else {

            dto.setOrders(new java.util.ArrayList<>());
        }
        
        return dto;
    }
}

