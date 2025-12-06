package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.AvailableDriverDto;

import java.time.LocalDateTime;
import java.util.List;

public interface DispatchDriverService {
    List<AvailableDriverDto> getAvailableDrivers(LocalDateTime at);
}
