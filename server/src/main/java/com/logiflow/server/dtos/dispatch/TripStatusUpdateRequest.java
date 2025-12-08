package com.logiflow.server.dtos.dispatch;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripStatusUpdateRequest {
    @NotBlank(message = "Status is required")
    private String status;
}

