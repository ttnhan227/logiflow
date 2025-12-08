package com.logiflow.server.dtos.dispatch;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripListResponse {
    private List<TripDto> trips;
    private int totalTrips;
    private Map<String, Long> statusSummary;
}

