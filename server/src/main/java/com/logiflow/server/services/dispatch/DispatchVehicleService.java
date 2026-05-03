package com.logiflow.server.services.dispatch;

import java.util.List;

public interface DispatchVehicleService {
    List<DispatchVehicleServiceImpl.VehicleDto> getAllVehicles();
    List<DispatchVehicleServiceImpl.VehicleDto> getAvailableVehicles();
}
