package com.logiflow.server.dtos.dispatch;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecommendedDriverDto {
    private Integer driverId;
    private String fullName;
    private String phone;
    private String licenseType;
    private String status;

    // Explainable scoring
    private double score;
    private List<String> reasons = new ArrayList<>();

    // Useful diagnostics
    private Boolean eligible;
    private BigDecimal restRequiredHours;
    private java.time.LocalDateTime nextAvailableTime;

    // Proximity
    private Double distanceToPickupKm;
    private Integer distanceToPickupMeters;
    private Integer etaToPickupSeconds;
}
