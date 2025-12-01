package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO for active driver location data on admin dashboard map.
 */
@Data
@Builder
@AllArgsConstructor
public class ActiveDriverLocationDto {
    private final Integer driverId;
    private final String driverName;
    private final String driverPhone;
    private final Integer tripId;
    private final String tripStatus;
    private final BigDecimal latitude;
    private final BigDecimal longitude;
    private final String vehiclePlate;
    private final String routeName;
    
    public static ActiveDriverLocationDto of(
            Integer driverId,
            String driverName,
            String driverPhone,
            Integer tripId,
            String tripStatus,
            BigDecimal latitude,
            BigDecimal longitude,
            String vehiclePlate,
            String routeName) {
        return ActiveDriverLocationDto.builder()
                .driverId(driverId)
                .driverName(driverName)
                .driverPhone(driverPhone)
                .tripId(tripId)
                .tripStatus(tripStatus)
                .latitude(latitude)
                .longitude(longitude)
                .vehiclePlate(vehiclePlate)
                .routeName(routeName)
                .build();
    }
}
