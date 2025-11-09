package com.logiflow.server.dtos.dispatch;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripCreateRequest {
    
    @NotNull(message = "Vehicle ID is required")
    private Integer vehicleId;
    
    @NotNull(message = "Route ID is required")
    private Integer routeId;
    
    @NotBlank(message = "Trip type is required")
    private String tripType;
    
    @NotNull(message = "Scheduled departure is required")
    private LocalDateTime scheduledDeparture;
    
    @NotNull(message = "Scheduled arrival is required")
    private LocalDateTime scheduledArrival;
    
    @NotEmpty(message = "At least one order ID is required")
    private List<Integer> orderIds;
}



