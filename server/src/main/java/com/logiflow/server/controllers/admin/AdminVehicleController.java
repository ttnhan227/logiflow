package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.vehicle.CreateVehicleDto;
import com.logiflow.server.dtos.admin.vehicle.UpdateVehicleDto;
import com.logiflow.server.dtos.admin.vehicle.VehicleDto;
import com.logiflow.server.dtos.admin.vehicle.VehicleStatisticsDto;
import com.logiflow.server.services.admin.AdminVehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/vehicles")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminVehicleController {

    private final AdminVehicleService adminVehicleService;

    @GetMapping("/statistics")
    public ResponseEntity<VehicleStatisticsDto> getVehicleStatistics() {
        return ResponseEntity.ok(adminVehicleService.getVehicleStatistics());
    }

    @GetMapping
    public ResponseEntity<List<VehicleDto>> getAllVehicles() {
        return ResponseEntity.ok(adminVehicleService.getAllVehicles());
    }

    @GetMapping("/{vehicleId}")
    public ResponseEntity<VehicleDto> getVehicleById(@PathVariable Integer vehicleId) {
        return ResponseEntity.ok(adminVehicleService.getVehicleById(vehicleId));
    }

    @PostMapping
    public ResponseEntity<VehicleDto> createVehicle(@RequestBody CreateVehicleDto createVehicleDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminVehicleService.createVehicle(createVehicleDto));
    }

    @PutMapping("/{vehicleId}")
    public ResponseEntity<VehicleDto> updateVehicle(
            @PathVariable Integer vehicleId,
            @RequestBody UpdateVehicleDto updateVehicleDto) {
        return ResponseEntity.ok(adminVehicleService.updateVehicle(vehicleId, updateVehicleDto));
    }

    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Integer vehicleId) {
        adminVehicleService.deleteVehicle(vehicleId);
        return ResponseEntity.noContent().build();
    }
}
