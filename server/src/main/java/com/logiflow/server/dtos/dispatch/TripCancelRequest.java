package com.logiflow.server.dtos.dispatch;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TripCancelRequest {
    @NotBlank(message = "Cancellation reason is required")
    private String reason;
}
