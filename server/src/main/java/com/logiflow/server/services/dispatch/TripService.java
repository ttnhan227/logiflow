package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.TripCreateRequest;
import com.logiflow.server.dtos.dispatch.TripDto;
import com.logiflow.server.dtos.dispatch.TripListResponse;
import com.logiflow.server.dtos.dispatch.TripAssignRequest;
import com.logiflow.server.dtos.dispatch.TripStatusUpdateRequest;
import com.logiflow.server.dtos.dispatch.TripCancelRequest;
import com.logiflow.server.dtos.dispatch.TripRerouteRequest;

public interface TripService {
    TripDto createTrip(TripCreateRequest request);
    TripListResponse getTrips(String status, int page, int size);
    TripDto getTripById(Integer tripId);
    TripDto assignTrip(Integer tripId, TripAssignRequest request);
    TripDto updateTripStatus(Integer tripId, TripStatusUpdateRequest request);

    TripDto rerouteTrip(Integer tripId, TripRerouteRequest request);
    TripDto cancelTrip(Integer tripId, TripCancelRequest request);

    // Proof of delivery (POD)
    com.logiflow.server.dtos.dispatch.DeliveryConfirmationResponseDto getDeliveryConfirmation(Integer tripId);
}
