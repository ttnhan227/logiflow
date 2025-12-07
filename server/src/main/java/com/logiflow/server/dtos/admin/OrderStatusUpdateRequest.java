package com.logiflow.server.dtos.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrderStatusUpdateRequest {
    @NotBlank
    private String status;
}
