package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.alerts.AlertDto;
import com.logiflow.server.services.manager.alerts.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/alerts")
public class AlertsController {

    private final AlertService alertService;

    public AlertsController(AlertService alertService) {
        this.alertService = alertService;
    }

    // 9) Danh sách cảnh báo (lọc theo mức độ)
    @GetMapping
    public ResponseEntity<List<AlertDto>> list(@RequestParam(required = false) String level) {
        return ResponseEntity.ok(alertService.list(level));
    }
}
