package com.logiflow.server.dtos.dispatch;

import com.logiflow.server.models.Order;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderCreateRequest {
    
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
    
    private Integer tripId;
}


