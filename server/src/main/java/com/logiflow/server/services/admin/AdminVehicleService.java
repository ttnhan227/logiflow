package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.vehicle.CreateVehicleDto;
import com.logiflow.server.dtos.admin.vehicle.UpdateVehicleDto;
import com.logiflow.server.dtos.admin.vehicle.VehicleDto;
import com.logiflow.server.dtos.admin.vehicle.VehicleStatisticsDto;

import java.util.List;

public interface AdminVehicleService {
    VehicleStatisticsDto getVehicleStatistics();
    List<VehicleDto> getAllVehicles();
    VehicleDto getVehicleById(Integer vehicleId);
    VehicleDto createVehicle(CreateVehicleDto createVehicleDto);
    VehicleDto updateVehicle(Integer vehicleId, UpdateVehicleDto updateVehicleDto);
    void deleteVehicle(Integer vehicleId);
}
