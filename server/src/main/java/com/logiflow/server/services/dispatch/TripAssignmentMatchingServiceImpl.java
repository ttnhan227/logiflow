package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.RecommendedDriverDto;
import com.logiflow.server.dtos.maps.DirectionsResultDto;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.driver_worklog.DriverWorkLogRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import com.logiflow.server.services.maps.MapsService;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class TripAssignmentMatchingServiceImpl implements TripAssignmentMatchingService {

    @Autowired private TripRepository tripRepository;
    @Autowired private DriverRepository driverRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private TripAssignmentRepository tripAssignmentRepository;
    @Autowired private DriverWorkLogRepository driverWorkLogRepository;
    @Autowired private MapsService mapsService;

    @Override
    @Transactional(readOnly = true)
    public List<RecommendedDriverDto> recommendDrivers(Integer tripId, Integer limit) {
        if (limit == null || limit < 1) limit = 10;
        if (limit > 50) limit = 50;

        Trip trip = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        Vehicle vehicle = trip.getVehicle();

        // Determine pickup location from route
        BigDecimal pickupLat = null;
        BigDecimal pickupLng = null;
        if (trip.getRoute() != null) {
            if (trip.getRoute().getIsTripRoute() != null && trip.getRoute().getIsTripRoute()) {
                // For trip routes, use first waypoint coordinates
                if (trip.getRoute().getWaypoints() != null && !trip.getRoute().getWaypoints().isEmpty()) {
                    try {
                        // Parse first waypoint from JSON
                        List<Map<String, Object>> waypoints = new com.fasterxml.jackson.databind.ObjectMapper()
                            .readValue(trip.getRoute().getWaypoints(),
                                     new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
                        if (!waypoints.isEmpty()) {
                            Map<String, Object> firstWaypoint = waypoints.get(0);
                            pickupLat = new BigDecimal(firstWaypoint.get("lat").toString());
                            pickupLng = new BigDecimal(firstWaypoint.get("lng").toString());
                        }
                    } catch (Exception e) {
                        // Fallback: use order coordinates if available
                        if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
                            Order firstOrder = trip.getOrders().get(0);
                            pickupLat = firstOrder.getPickupLat();
                            pickupLng = firstOrder.getPickupLng();
                        }
                    }
                }
            } else {
                // For legacy single routes (if any exist), use origin coordinates
                // Since we removed these fields, this branch won't execute
                // TODO: Handle legacy single routes if any exist
                pickupLat = null;
                pickupLng = null;
            }
        }

        BigDecimal totalWeightTons = computeTripWeightTons(trip);

        LocalDateTime at = trip.getScheduledDeparture() != null ? trip.getScheduledDeparture() : LocalDateTime.now();

        // Determine pickup types from orders
        List<Order.PickupType> pickupTypes = extractPickupTypes(trip);

        // Candidate pool: use existing "available + FIT" query.
        List<Driver> candidates = driverRepository.findAvailableDrivers();

        List<RecommendedDriverDto> scored = new ArrayList<>();
        for (Driver d : candidates) {
            scored.add(scoreDriver(trip, vehicle, totalWeightTons, pickupLat, pickupLng, at, d, pickupTypes));
        }

        // Sort: eligible first, then score desc
        return scored.stream()
                .sorted(Comparator
                        .comparing((RecommendedDriverDto r) -> Boolean.TRUE.equals(r.getEligible()) ? 0 : 1)
                        .thenComparing(RecommendedDriverDto::getScore, Comparator.reverseOrder()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public void validateAssignment(Integer tripId, Integer driverId, Integer vehicleId) {
        Trip trip = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        Vehicle vehicle = trip.getVehicle();
        if (vehicleId != null) {
            vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));
        }
        if (vehicle == null) throw new RuntimeException("Vehicle is required for trip assignment");

        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));

        // Availability (existing rule)
        if (driver.getStatus() != null && !driver.getStatus().equalsIgnoreCase("available")) {
            throw new RuntimeException("Driver is not available (status: " + driver.getStatus() + ")");
        }

        // Active assignment rule (existing behavior)
        Long activeAssignmentsCount = tripAssignmentRepository.countActiveAssignmentsByDriverId(driverId);
        if (activeAssignmentsCount != null && activeAssignmentsCount > 0) {
            throw new RuntimeException("Driver already has an active trip assignment. Drivers can only have one active trip at a time.");
        }

        // License requirement (existing behavior)
        if (vehicle.getRequiredLicense() != null && driver.getLicenseType() != null
                && !vehicle.getRequiredLicense().equalsIgnoreCase(driver.getLicenseType())) {
            throw new RuntimeException("Driver license (" + driver.getLicenseType() + ") does not match vehicle requirement (" + vehicle.getRequiredLicense() + ")");
        }

        // Compliance / rest: reuse current worklog logic
        LocalDateTime at = trip.getScheduledDeparture() != null ? trip.getScheduledDeparture() : LocalDateTime.now();
        LocalDateTime nextAvailable = driverWorkLogRepository.findLatestNextAvailableTimeByDriverId(driverId);
        if (nextAvailable != null && at.isBefore(nextAvailable)) {
            throw new RuntimeException("Driver is not rested/compliant until: " + nextAvailable);
        }

        // Capacity vs cargo weight: interpret Vehicle.capacity as tons.
        BigDecimal totalWeightTons = computeTripWeightTons(trip);
        if (totalWeightTons != null && vehicle.getCapacity() != null) {
            BigDecimal capTons = new BigDecimal(vehicle.getCapacity());
            if (totalWeightTons.compareTo(capTons) > 0) {
                throw new RuntimeException("Vehicle capacity (" + capTons + " tons) is insufficient for trip cargo (" + totalWeightTons + " tons)");
            }
        }
    }

    private RecommendedDriverDto scoreDriver(
            Trip trip,
            Vehicle vehicle,
            BigDecimal totalWeightTons,
            BigDecimal pickupLat,
            BigDecimal pickupLng,
            LocalDateTime at,
            Driver d,
            List<Order.PickupType> pickupTypes
    ) {
        RecommendedDriverDto dto = new RecommendedDriverDto();
        dto.setDriverId(d.getDriverId());
        dto.setFullName(d.getUser() != null ? d.getUser().getFullName() : null);
        dto.setPhone(d.getUser() != null ? d.getUser().getPhone() : null);
        dto.setLicenseType(d.getLicenseType());
        dto.setStatus(d.getStatus());

        List<String> reasons = new ArrayList<>();
        boolean eligible = true;
        double score = 0.0;

        // 1) Availability
        if (d.getStatus() == null || !d.getStatus().equalsIgnoreCase("available")) {
            eligible = false;
            reasons.add("Not available (status=" + d.getStatus() + ")");
        } else {
            score += 20;
            reasons.add("Available");
        }

        // 2) Health/compliance basic gate (using repository query already filters FIT, but keep reason)
        if (d.getHealthStatus() != null && d.getHealthStatus() != com.logiflow.server.models.Driver.HealthStatus.FIT) {
            eligible = false;
            reasons.add("Not fit (healthStatus=" + d.getHealthStatus() + ")");
        }

        // 3) Rest/compliance (DriverWorkLog)
        BigDecimal hours = driverWorkLogRepository.sumHoursWorkedByDriverId(d.getDriverId());
        BigDecimal restRequired = hours != null && hours.compareTo(new BigDecimal("8.00")) >= 0
                ? new BigDecimal("8.00")
                : BigDecimal.ZERO;
        dto.setRestRequiredHours(restRequired);
        LocalDateTime nextAvailable = driverWorkLogRepository.findLatestNextAvailableTimeByDriverId(d.getDriverId());
        dto.setNextAvailableTime(nextAvailable);
        if (nextAvailable != null && at != null && at.isBefore(nextAvailable)) {
            eligible = false;
            reasons.add("Rest required until " + nextAvailable);
        } else {
            score += 15;
            reasons.add("Rest/compliance OK");
        }

        // 4) License
        if (vehicle != null && vehicle.getRequiredLicense() != null) {
            if (d.getLicenseType() == null || !vehicle.getRequiredLicense().equalsIgnoreCase(d.getLicenseType())) {
                eligible = false;
                reasons.add("License mismatch (need " + vehicle.getRequiredLicense() + ")");
            } else {
                score += 20;
                reasons.add("License match");
            }
        }

        // 5) Capacity vs weight (Vehicle.capacity interpreted as tons)
        if (vehicle != null && vehicle.getCapacity() != null && totalWeightTons != null) {
            BigDecimal capTons = new BigDecimal(vehicle.getCapacity());
            if (totalWeightTons.compareTo(capTons) > 0) {
                eligible = false;
                reasons.add("Over capacity (cargo " + totalWeightTons + "t > cap " + capTons + "t)");
            } else {
                // reward better fit: higher utilization but not over
                BigDecimal utilization = BigDecimal.ZERO;
                if (capTons.compareTo(BigDecimal.ZERO) > 0) {
                    utilization = totalWeightTons.divide(capTons, 4, RoundingMode.HALF_UP);
                }
                double utilScore = 20.0 * Math.min(1.0, utilization.doubleValue());
                score += utilScore;
                reasons.add("Capacity OK (utilization ~" + utilization.multiply(new BigDecimal("100")).setScale(0, RoundingMode.HALF_UP) + "%)");
            }
        }

        // 5b) Pickup Type compatibility (note: for now, just informational; no hard eligibility rules)
        if (pickupTypes != null && !pickupTypes.isEmpty()) {
            // Check if all orders have the same pickup type
            boolean allSame = pickupTypes.stream().allMatch(t -> t != null && t.equals(pickupTypes.get(0)));
            Order.PickupType pickupType = pickupTypes.get(0);
            
            if (pickupType != null) {
                // For PORT_TERMINAL: reward if vehicle is truck (better for container handling)
                // For WAREHOUSE: reward if vehicle is standard truck (less specialized needed)
                // For now: informational scoring (+5 points, no penalties)
                score += 5;
                reasons.add("Pickup type: " + pickupType);
            } else {
                reasons.add("Pickup type: UNKNOWN");
            }
        }

        // 6) Proximity to pickup (uses OSRM if coordinates available; else no penalty)
        if (pickupLat != null && pickupLng != null && d.getCurrentLocationLat() != null && d.getCurrentLocationLng() != null) {
            DirectionsResultDto dir = mapsService.getDirections(
                    d.getCurrentLocationLat().toPlainString(),
                    d.getCurrentLocationLng().toPlainString(),
                    pickupLat.toPlainString(),
                    pickupLng.toPlainString(),
                    false,
                    "truck"
            );
            if (dir != null) {
                dto.setDistanceToPickupMeters(dir.getDistanceMeters());
                dto.setEtaToPickupSeconds(dir.getDurationSeconds());
                dto.setDistanceToPickupKm(dir.getDistanceMeters() != null ? dir.getDistanceMeters() / 1000.0 : null);

                // Score proximity: 25 points if <=5km, linearly down to 0 at 50km
                if (dir.getDistanceMeters() != null) {
                    double km = dir.getDistanceMeters() / 1000.0;
                    double prox = 0.0;
                    if (km <= 5) prox = 25.0;
                    else if (km >= 50) prox = 0.0;
                    else prox = 25.0 * (1.0 - (km - 5.0) / (50.0 - 5.0));
                    score += prox;
                    reasons.add(String.format("Proximity: %.1fkm to pickup", km));
                }
            } else {
                reasons.add("Proximity unknown (routing unavailable)");
            }
        } else {
            reasons.add("Proximity unknown (missing coordinates)");
        }

        // 8) Active assignment check (should be zero for available drivers, but keep safety)
        Long activeAssignmentsCount = tripAssignmentRepository.countActiveAssignmentsByDriverId(d.getDriverId());
        if (activeAssignmentsCount != null && activeAssignmentsCount > 0) {
            eligible = false;
            reasons.add("Already has active assignment");
        }

        dto.setEligible(eligible);
        dto.setReasons(reasons);
        dto.setScore(eligible ? score : Math.max(0, score - 50)); // push ineligible down
        return dto;
    }

    private BigDecimal computeTripWeightTons(Trip trip) {
        if (trip == null || trip.getOrders() == null || trip.getOrders().isEmpty()) return null;

        BigDecimal total = BigDecimal.ZERO;
        boolean any = false;

        for (Order o : trip.getOrders()) {
            if (o == null) continue;
            // Use weightTons (primary field)
            if (o.getWeightTons() != null) {
                total = total.add(o.getWeightTons());
                any = true;
            }
        }

        return any ? total : null;
    }

    private List<Order.PickupType> extractPickupTypes(Trip trip) {
        if (trip == null || trip.getOrders() == null || trip.getOrders().isEmpty()) {
            return new ArrayList<>();
        }
        return trip.getOrders().stream()
                .map(Order::getPickupType)
                .collect(Collectors.toList());
    }
}
