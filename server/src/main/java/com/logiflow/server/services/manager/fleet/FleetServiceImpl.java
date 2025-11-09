package com.logiflow.server.services.manager.fleet;

import com.logiflow.server.dtos.manager.fleet.FleetStatusDto;
import com.logiflow.server.models.Trip;
import com.logiflow.server.repositories.manager.fleet.FleetStatsRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class FleetServiceImpl implements FleetService {

    private final FleetStatsRepository fleetStatsRepository;
    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;

    public FleetServiceImpl(FleetStatsRepository fleetStatsRepository,
                            VehicleRepository vehicleRepository,
                            TripRepository tripRepository) {
        this.fleetStatsRepository = fleetStatsRepository;
        this.vehicleRepository = vehicleRepository;
        this.tripRepository = tripRepository;
    }

    @Override
    public FleetStatusDto getStatus() {
        long total = vehicleRepository.count();
        long available = fleetStatsRepository.countAvailable();

        // Lấy tất cả trip rồi lọc status 'assigned' | 'in_progress'
        List<Trip> allTrips = tripRepository.findAll();
        Set<Integer> vehicleIdsInUse = new HashSet<>();
        for (Trip t : allTrips) {
            String st = t.getStatus() == null ? "" : t.getStatus().toLowerCase();
            if ("assigned".equals(st) || "in_progress".equals(st)) {
                if (t.getVehicle() != null) {
                    vehicleIdsInUse.add(t.getVehicle().getVehicleId());
                }
            }
        }
        long inUse = vehicleIdsInUse.size();
        long offline = Math.max(0, total - available - inUse);

        return new FleetStatusDto(total, available, inUse, offline);
    }
}
