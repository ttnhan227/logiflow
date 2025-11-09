package com.logiflow.server.services.manager.fleet;

import com.logiflow.server.dtos.manager.fleet.FleetStatusDto;

public interface FleetService {
    FleetStatusDto getStatus();
}
