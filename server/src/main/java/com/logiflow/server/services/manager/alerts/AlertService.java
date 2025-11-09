package com.logiflow.server.services.manager.alerts;

import com.logiflow.server.dtos.manager.alerts.AlertDto;

import java.util.List;

public interface AlertService {
    List<AlertDto> list(String level);
}
