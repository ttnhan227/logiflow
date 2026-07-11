package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.services.dispatch.DispatchDriverService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispatch/drivers")
public class DispatchDriverController {

    private final DispatchDriverService dispatchDriverService;

    public DispatchDriverController(DispatchDriverService dispatchDriverService) {
        this.dispatchDriverService = dispatchDriverService;
    }

    @GetMapping
    public ResponseEntity<List<?>> getAllDrivers() {
        return ResponseEntity.ok(dispatchDriverService.getAllDrivers());
    }

    @GetMapping("/available")
    public ResponseEntity<List<?>> getAvailableDrivers() {
        return ResponseEntity.ok(dispatchDriverService.getAvailableDriversList());
    }
}
