package com.logiflow.server.services.dispatch;

import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DispatchVehicleServiceImpl implements DispatchVehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Override
    public List<?> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(this::toVehicleDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<?> getAvailableVehicles() {
        return vehicleRepository.findByStatus("available").stream()
                .map(this::toVehicleDto)
                .collect(Collectors.toList());
    }

    private VehicleDto toVehicleDto(Vehicle v) {
        return new VehicleDto(v.getVehicleId(), v.getVehicleType(), v.getLicensePlate(), v.getCapacity(), v.getStatus());
    }

    @Getter
    public static class VehicleDto {
        private Integer vehicleId;
        private String vehicleType;
        private String licensePlate;
        private Integer capacity;
        private String status;

        public VehicleDto(Integer vehicleId, String vehicleType, String licensePlate, Integer capacity, String status) {
            this.vehicleId = vehicleId;
            this.vehicleType = vehicleType;
            this.licensePlate = licensePlate;
            this.capacity = capacity;
            this.status = status;
        }

    }
}
