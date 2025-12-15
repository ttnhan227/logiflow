package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.trip.TripOversightDto;
import com.logiflow.server.dtos.admin.trip.TripOversightListResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface TripOversightService {
    TripOversightListResponse getTripsOversight(String status, int page, int size);
    TripOversightDto getTripOversight(Integer tripId);
    TripOversightDto updateTripStatus(Integer tripId, String status);
    TripOversightDto respondToTripDelayReport(Integer tripId, String responseType, Integer extensionMinutes);
    // Add more admin-specific methods as needed
}
