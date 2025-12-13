package com.logiflow.server.dtos.admin.route;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRouteDto {
    private String routeName;
    private String originAddress;
    private BigDecimal originLat;
    private BigDecimal originLng;
    private String destinationAddress;
    private BigDecimal destinationLat;
    private BigDecimal destinationLng;
    private BigDecimal distanceKm;
    private BigDecimal estimatedDurationHours;
    private String routeType;
}
