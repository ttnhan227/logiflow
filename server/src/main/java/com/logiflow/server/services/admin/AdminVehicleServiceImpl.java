package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.vehicle.CreateVehicleDto;
import com.logiflow.server.dtos.admin.vehicle.UpdateVehicleDto;
import com.logiflow.server.dtos.admin.vehicle.VehicleDto;
import com.logiflow.server.dtos.admin.vehicle.VehicleStatisticsDto;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminVehicleServiceImpl implements AdminVehicleService {

    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;
    private final AuditLogService auditLogService;

    @Override
    public VehicleStatisticsDto getVehicleStatistics() {
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        
        VehicleStatisticsDto stats = new VehicleStatisticsDto();
        stats.setTotalVehicles(allVehicles.size());
        
        // Count by status
        stats.setAvailableVehicles((int) allVehicles.stream()
                .filter(v -> "available".equalsIgnoreCase(v.getStatus()))
                .count());
        stats.setInUseVehicles((int) allVehicles.stream()
                .filter(v -> "in_use".equalsIgnoreCase(v.getStatus()))
                .count());
        stats.setMaintenanceVehicles((int) allVehicles.stream()
                .filter(v -> "maintenance".equalsIgnoreCase(v.getStatus()))
                .count());
        
        // Count by type
        stats.setVans((int) allVehicles.stream()
                .filter(v -> "van".equalsIgnoreCase(v.getVehicleType()))
                .count());
        stats.setTrucks((int) allVehicles.stream()
                .filter(v -> "truck".equalsIgnoreCase(v.getVehicleType()))
                .count());
        stats.setContainers((int) allVehicles.stream()
                .filter(v -> "container".equalsIgnoreCase(v.getVehicleType()))
                .count());
        
        return stats;
    }

    @Override
    public List<VehicleDto> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public VehicleDto getVehicleById(Integer vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));
        return convertToDto(vehicle);
    }

    @Override
    @Transactional
    public VehicleDto createVehicle(CreateVehicleDto createVehicleDto) {
        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleType(createVehicleDto.getVehicleType());
        vehicle.setLicensePlate(createVehicleDto.getLicensePlate());
        vehicle.setCapacity(createVehicleDto.getCapacity());
        vehicle.setRequiredLicense(createVehicleDto.getRequiredLicense());
        vehicle.setCurrentLocationLat(createVehicleDto.getCurrentLocationLat());
        vehicle.setCurrentLocationLng(createVehicleDto.getCurrentLocationLng());
        vehicle.setStatus(createVehicleDto.getStatus() != null ? createVehicleDto.getStatus() : "available");
        vehicle.setCreatedAt(LocalDateTime.now());
        
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        
        auditLogService.log(
            "CREATE_VEHICLE",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Created vehicle: " + savedVehicle.getLicensePlate() + " (ID: " + savedVehicle.getVehicleId() + ")"
        );
        
        return convertToDto(savedVehicle);
    }

    @Override
    @Transactional
    public VehicleDto updateVehicle(Integer vehicleId, UpdateVehicleDto updateVehicleDto) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));
        
        vehicle.setVehicleType(updateVehicleDto.getVehicleType());
        vehicle.setLicensePlate(updateVehicleDto.getLicensePlate());
        vehicle.setCapacity(updateVehicleDto.getCapacity());
        vehicle.setRequiredLicense(updateVehicleDto.getRequiredLicense());
        vehicle.setCurrentLocationLat(updateVehicleDto.getCurrentLocationLat());
        vehicle.setCurrentLocationLng(updateVehicleDto.getCurrentLocationLng());
        vehicle.setStatus(updateVehicleDto.getStatus());
        
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        
        auditLogService.log(
            "UPDATE_VEHICLE",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Updated vehicle: " + updatedVehicle.getLicensePlate() + " (ID: " + updatedVehicle.getVehicleId() + ")"
        );
        
        return convertToDto(updatedVehicle);
    }

    @Override
    @Transactional
    public void deleteVehicle(Integer vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));
        
        // Check if vehicle has active trips
        long activeTripsCount = tripRepository.countByVehicleAndStatusIn(
                vehicle, 
                List.of("pending", "in_progress")
        );
        
        if (activeTripsCount > 0) {
            throw new RuntimeException("Cannot delete vehicle with active trips. Please complete or reassign trips first.");
        }
        
        auditLogService.log(
            "DELETE_VEHICLE",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Deleted vehicle: " + vehicle.getLicensePlate() + " (ID: " + vehicle.getVehicleId() + ")"
        );
        
        vehicleRepository.delete(vehicle);
    }

    private VehicleDto convertToDto(Vehicle vehicle) {
        VehicleDto dto = new VehicleDto();
        dto.setVehicleId(vehicle.getVehicleId());
        dto.setVehicleType(vehicle.getVehicleType());
        dto.setLicensePlate(vehicle.getLicensePlate());
        dto.setCapacity(vehicle.getCapacity());
        dto.setRequiredLicense(vehicle.getRequiredLicense());
        dto.setCurrentLocationLat(vehicle.getCurrentLocationLat());
        dto.setCurrentLocationLng(vehicle.getCurrentLocationLng());
        dto.setStatus(vehicle.getStatus());
        dto.setCreatedAt(vehicle.getCreatedAt());
        
        // Count trips
        if (vehicle.getTrips() != null) {
            dto.setTotalTrips(vehicle.getTrips().size());
            dto.setActiveTrips((int) vehicle.getTrips().stream()
                    .filter(t -> "pending".equalsIgnoreCase(t.getStatus()) || 
                                "in_progress".equalsIgnoreCase(t.getStatus()))
                    .count());
        } else {
            dto.setTotalTrips(0);
            dto.setActiveTrips(0);
        }
        
        return dto;
    }
}
