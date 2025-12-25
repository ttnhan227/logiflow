package com.logiflow.server.dtos.dispatch;

import com.logiflow.server.models.Order;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderUpdateRequest {
    
    @NotBlank(message = "Customer name is required")
    private String customerName;
    
    private String customerPhone;
    
    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;
    
    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;
    
    private String packageDetails;
    
    @NotNull(message = "Priority level is required")
    private Order.PriorityLevel priorityLevel;
    
    private BigDecimal distanceKm;

    // Weight in tons (t)
    private BigDecimal weightTons;

    @NotNull(message = "Pickup type is required")
    private Order.PickupType pickupType;

    // Conditional: required if pickupType == PORT_TERMINAL
    private String containerNumber;
    private String terminalName;

    // Conditional: required if pickupType == WAREHOUSE
    private String warehouseName;
    private String dockNumber;

    private BigDecimal packageValue;
}
