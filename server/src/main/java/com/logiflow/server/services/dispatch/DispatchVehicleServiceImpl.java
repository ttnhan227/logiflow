package com.logiflow.server.services.dispatch;

import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.driver.DriverRepository;
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

    @Autowired
    private DriverRepository driverRepository;

    @Override
    public List<?> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(this::toVehicleDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<?> getAvailableVehicles() {
        // Return all vehicles so frontend can display them and grey out unavailable ones
        return vehicleRepository.findAll().stream()
                .map(this::toVehicleDto)
                .collect(Collectors.toList());
    }

    private boolean hasCompatibleDriver(Vehicle vehicle, List<Driver> availableDrivers) {
        String requiredLicense = vehicle.getRequiredLicense();
        if (requiredLicense == null || requiredLicense.trim().isEmpty()) {
            return true; // No license requirement, so any driver can operate
        }

        return availableDrivers.stream()
                .anyMatch(driver -> isLicenseCompatible(driver.getLicenseType(), requiredLicense));
    }

    private boolean isLicenseCompatible(String driverLicense, String requiredLicense) {
        if (driverLicense == null || requiredLicense == null) {
            return false;
        }
        return driverLicense.trim().equalsIgnoreCase(requiredLicense.trim());
    }

    private VehicleDto toVehicleDto(Vehicle v) {
        return new VehicleDto(v.getVehicleId(), v.getVehicleType(), v.getLicensePlate(), v.getCapacityTons(), v.getStatus(), v.getRequiredLicense());
    }

    @Getter
    public static class VehicleDto {
        private Integer vehicleId;
        private String vehicleType;
        private String licensePlate;
        private java.math.BigDecimal capacityTons;
        private String status;
        private String requiredLicense;

        public VehicleDto(Integer vehicleId, String vehicleType, String licensePlate, java.math.BigDecimal capacityTons, String status, String requiredLicense) {
            this.vehicleId = vehicleId;
            this.vehicleType = vehicleType;
            this.licensePlate = licensePlate;
            this.capacityTons = capacityTons;
            this.status = status;
            this.requiredLicense = requiredLicense;
        }

    }
}
