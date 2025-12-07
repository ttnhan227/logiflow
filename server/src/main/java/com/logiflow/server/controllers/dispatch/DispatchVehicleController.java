package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.services.dispatch.DispatchVehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispatch/vehicles")
public class DispatchVehicleController {

    @Autowired
    private DispatchVehicleService dispatchVehicleService;

    @GetMapping
    public ResponseEntity<?> getAllVehicles() {
        try {
            List<?> vehicles = dispatchVehicleService.getAllVehicles();
            return ResponseEntity.ok(vehicles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/available")
    public ResponseEntity<?> getAvailableVehicles() {
        try {
            List<?> vehicles = dispatchVehicleService.getAvailableVehicles();
            return ResponseEntity.ok(vehicles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
