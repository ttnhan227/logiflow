package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.TripCreateRequest;
import com.logiflow.server.dtos.dispatch.TripDto;

public interface TripService {
    TripDto createTrip(TripCreateRequest request);
import com.logiflow.server.dtos.dispatch.TripListResponse;
import com.logiflow.server.dtos.dispatch.TripAssignRequest;
import com.logiflow.server.dtos.dispatch.TripStatusUpdateRequest;

public interface TripService {
    TripDto createTrip(TripCreateRequest request);
    TripListResponse getTrips(String status);
    TripDto assignTrip(Integer tripId, TripAssignRequest request);
    TripDto updateTripStatus(Integer tripId, TripStatusUpdateRequest request);
}




