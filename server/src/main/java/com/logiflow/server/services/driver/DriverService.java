package com.logiflow.server.services.driver;

import com.logiflow.server.dtos.delivery.DeliveryConfirmationDto;
import com.logiflow.server.dtos.driver.DriverDtos.*;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Trip;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface DriverService {
    Driver getCurrentDriver(String authName);
    List<TripSummaryDto> getMyTrips(Integer driverId, String status);
    TripDetailDto getMyTripDetail(Integer driverId, Integer tripId);
    void updateMyLocation(Integer driverId, BigDecimal lat, BigDecimal lng);
    List<ScheduleItemDto> getMySchedule(Integer driverId, LocalDate start, LocalDate end);
    ComplianceDto getMyCompliance(Integer driverId);

    void acceptTripAssignment(Integer driverId, Integer tripId);
    void declineTripAssignment(Integer driverId, Integer tripId);
    void cancelTripAssignment(Integer driverId, Integer tripId);
    void updateTripStatus(Integer driverId, Integer tripId, String status);
    void confirmDelivery(Integer driverId, Integer tripId, DeliveryConfirmationDto confirmationDto);

    DriverProfileDto getProfile(String username);
    DriverProfileDto updateProfile(String username, UpdateDriverProfileRequest request);
}
