package com.logiflow.server.dtos.dispatch;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripAssignRequest {
    @NotNull(message = "Driver ID is required")
    private Integer driverId;
    private Integer vehicleId;
}

