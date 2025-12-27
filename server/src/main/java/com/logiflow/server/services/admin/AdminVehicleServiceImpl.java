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

        // Core fleet management
        vehicle.setVehicleType(createVehicleDto.getVehicleType());
        vehicle.setLicensePlate(createVehicleDto.getLicensePlate());
        vehicle.setCapacityTons(createVehicleDto.getCapacityTons());
        vehicle.setRequiredLicense(createVehicleDto.getRequiredLicense());

        // Specifications
        vehicle.setMake(createVehicleDto.getMake());
        vehicle.setModel(createVehicleDto.getModel());
        vehicle.setFuelType(createVehicleDto.getFuelType());

        // Compliance & Safety
        vehicle.setRegistrationExpiryDate(createVehicleDto.getRegistrationExpiryDate());
        vehicle.setInsuranceExpiryDate(createVehicleDto.getInsuranceExpiryDate());
        vehicle.setLastSafetyInspectionDate(createVehicleDto.getLastSafetyInspectionDate());
        vehicle.setNextSafetyInspectionDueDate(createVehicleDto.getNextSafetyInspectionDueDate());

        // Maintenance
        vehicle.setLastMaintenanceDate(createVehicleDto.getLastMaintenanceDate());
        vehicle.setNextMaintenanceDueDate(createVehicleDto.getNextMaintenanceDueDate());

        // Operational
        vehicle.setCurrentLocationLat(createVehicleDto.getCurrentLocationLat());
        vehicle.setCurrentLocationLng(createVehicleDto.getCurrentLocationLng());

        // Status and metadata
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

        // Basic fields
        if (updateVehicleDto.getVehicleType() != null) vehicle.setVehicleType(updateVehicleDto.getVehicleType());
        if (updateVehicleDto.getLicensePlate() != null) vehicle.setLicensePlate(updateVehicleDto.getLicensePlate());
        if (updateVehicleDto.getCapacityTons() != null) vehicle.setCapacityTons(updateVehicleDto.getCapacityTons());
        if (updateVehicleDto.getRequiredLicense() != null) vehicle.setRequiredLicense(updateVehicleDto.getRequiredLicense());

        // Specifications
        if (updateVehicleDto.getMake() != null) vehicle.setMake(updateVehicleDto.getMake());
        if (updateVehicleDto.getModel() != null) vehicle.setModel(updateVehicleDto.getModel());
        if (updateVehicleDto.getFuelType() != null) vehicle.setFuelType(updateVehicleDto.getFuelType());

        // Compliance dates
        if (updateVehicleDto.getRegistrationExpiryDate() != null) vehicle.setRegistrationExpiryDate(updateVehicleDto.getRegistrationExpiryDate());
        if (updateVehicleDto.getInsuranceExpiryDate() != null) vehicle.setInsuranceExpiryDate(updateVehicleDto.getInsuranceExpiryDate());
        if (updateVehicleDto.getLastSafetyInspectionDate() != null) vehicle.setLastSafetyInspectionDate(updateVehicleDto.getLastSafetyInspectionDate());
        if (updateVehicleDto.getNextSafetyInspectionDueDate() != null) vehicle.setNextSafetyInspectionDueDate(updateVehicleDto.getNextSafetyInspectionDueDate());

        // Maintenance
        if (updateVehicleDto.getLastMaintenanceDate() != null) vehicle.setLastMaintenanceDate(updateVehicleDto.getLastMaintenanceDate());
        if (updateVehicleDto.getNextMaintenanceDueDate() != null) vehicle.setNextMaintenanceDueDate(updateVehicleDto.getNextMaintenanceDueDate());

        // Operational
        if (updateVehicleDto.getCurrentLocationLat() != null) vehicle.setCurrentLocationLat(updateVehicleDto.getCurrentLocationLat());
        if (updateVehicleDto.getCurrentLocationLng() != null) vehicle.setCurrentLocationLng(updateVehicleDto.getCurrentLocationLng());

        // Status
        if (updateVehicleDto.getStatus() != null) vehicle.setStatus(updateVehicleDto.getStatus());

        vehicle.setUpdatedAt(LocalDateTime.now());

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

        // Core fleet management
        dto.setVehicleId(vehicle.getVehicleId());
        dto.setVehicleType(vehicle.getVehicleType());
        dto.setLicensePlate(vehicle.getLicensePlate());
        dto.setCapacityTons(vehicle.getCapacityTons());
        dto.setRequiredLicense(vehicle.getRequiredLicense());

        // Specifications
        dto.setMake(vehicle.getMake());
        dto.setModel(vehicle.getModel());
        dto.setFuelType(vehicle.getFuelType());

        // Compliance & Safety
        dto.setRegistrationExpiryDate(vehicle.getRegistrationExpiryDate());
        dto.setInsuranceExpiryDate(vehicle.getInsuranceExpiryDate());
        dto.setLastSafetyInspectionDate(vehicle.getLastSafetyInspectionDate());
        dto.setNextSafetyInspectionDueDate(vehicle.getNextSafetyInspectionDueDate());

        // Operational
        dto.setStatus(vehicle.getStatus());
        dto.setCurrentLocationLat(vehicle.getCurrentLocationLat());
        dto.setCurrentLocationLng(vehicle.getCurrentLocationLng());

        // Performance Tracking
        dto.setTotalTripsCompleted(vehicle.getTotalTripsCompleted());
        dto.setTotalDistanceDrivenKm(vehicle.getTotalDistanceDrivenKm());
        dto.setAverageFuelEfficiencyKmPerLiter(vehicle.getAverageFuelEfficiencyKmPerLiter());
        dto.setTotalFuelConsumedLiters(vehicle.getTotalFuelConsumedLiters());
        dto.setTotalMaintenanceCost(vehicle.getTotalMaintenanceCost());

        // Maintenance
        dto.setLastMaintenanceDate(vehicle.getLastMaintenanceDate());
        dto.setNextMaintenanceDueDate(vehicle.getNextMaintenanceDueDate());
        dto.setMaintenanceCostThisYear(vehicle.getMaintenanceCostThisYear());

        // Metadata
        dto.setCreatedAt(vehicle.getCreatedAt());
        dto.setUpdatedAt(vehicle.getUpdatedAt());

        // Trip Statistics (for compatibility)
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
