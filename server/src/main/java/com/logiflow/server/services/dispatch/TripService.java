package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.TripCreateRequest;
import com.logiflow.server.dtos.dispatch.TripDto;

public interface TripService {
    TripDto createTrip(TripCreateRequest request);
}



