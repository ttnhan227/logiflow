package com.logiflow.server.services.dispatch;

import java.util.List;

public interface DispatchVehicleService {
    List<?> getAllVehicles();
    List<?> getAvailableVehicles();
}
