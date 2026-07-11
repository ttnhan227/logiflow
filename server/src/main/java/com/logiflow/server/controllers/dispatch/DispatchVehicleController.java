package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.services.dispatch.DispatchVehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispatch/vehicles")
public class DispatchVehicleController {

    private final DispatchVehicleService dispatchVehicleService;

    public DispatchVehicleController(DispatchVehicleService dispatchVehicleService) {
        this.dispatchVehicleService = dispatchVehicleService;
    }

    @GetMapping
    public ResponseEntity<List<?>> getAllVehicles() {
        return ResponseEntity.ok(dispatchVehicleService.getAllVehicles());
    }

    @GetMapping("/available")
    public ResponseEntity<List<?>> getAvailableVehicles() {
        return ResponseEntity.ok(dispatchVehicleService.getAvailableVehicles());
    }
}
