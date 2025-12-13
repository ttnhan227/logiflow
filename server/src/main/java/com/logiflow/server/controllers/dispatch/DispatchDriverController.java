package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.services.dispatch.DispatchDriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispatch/drivers")
public class DispatchDriverController {

    @Autowired
    private DispatchDriverService dispatchDriverService;

    @GetMapping
    public ResponseEntity<?> getAllDrivers() {
        try {
            List<?> drivers = dispatchDriverService.getAllDrivers();
            return ResponseEntity.ok(drivers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/available")
    public ResponseEntity<?> getAvailableDrivers() {
        try {
            List<?> drivers = dispatchDriverService.getAvailableDriversList();
            return ResponseEntity.ok(drivers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
