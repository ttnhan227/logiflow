package com.logiflow.server.dtos.admin.trip;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TripStatusUpdateRequest {
    @NotBlank
    private String status;
}
