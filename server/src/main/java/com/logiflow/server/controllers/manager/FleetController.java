package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.fleet.FleetStatusDto;
import com.logiflow.server.services.manager.fleet.FleetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/operations/fleet")
public class FleetController {

    private final FleetService fleetService;

    public FleetController(FleetService fleetService) {
        this.fleetService = fleetService;
    }

    // 4) Trạng thái đội xe (và hook lịch bảo trì)
    @GetMapping("/status")
    public ResponseEntity<FleetStatusDto> status() {
        return ResponseEntity.ok(fleetService.getStatus());
    }
}
