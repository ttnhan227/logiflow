package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.RecommendedDriverDto;

import java.util.List;

public interface TripAssignmentMatchingService {
    List<RecommendedDriverDto> recommendDrivers(Integer tripId, Integer limit);
    void validateAssignment(Integer tripId, Integer driverId, Integer vehicleId);
}
