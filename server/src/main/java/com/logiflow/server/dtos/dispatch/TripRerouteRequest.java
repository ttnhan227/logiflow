package com.logiflow.server.dtos.dispatch;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TripRerouteRequest {
    @NotNull(message = "routeId is required")
    private Integer routeId;
}
