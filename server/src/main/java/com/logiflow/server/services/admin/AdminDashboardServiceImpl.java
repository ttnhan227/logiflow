package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.dashboard.AdminDashboardDto;
import com.logiflow.server.dtos.admin.dashboard.UserStatsDto;
import com.logiflow.server.dtos.admin.dashboard.FleetOverviewDto;
import com.logiflow.server.dtos.admin.dashboard.RecentActivityDto;
import com.logiflow.server.dtos.admin.dashboard.ActiveDriverLocationDto;
import com.logiflow.server.dtos.admin.dashboard.ShipmentStatisticsDto;
import com.logiflow.server.dtos.admin.dashboard.DeliveryTimeStatsDto;
import com.logiflow.server.dtos.admin.dashboard.ComplianceAlertDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.TripAssignment;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VehicleRepository vehicleRepository;
    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;
    private final TripAssignmentRepository tripAssignmentRepository;
    private final com.logiflow.server.repositories.trip.TripRepository tripRepository;

    public AdminDashboardServiceImpl(UserRepository userRepository, 
                                    RoleRepository roleRepository,
                                    VehicleRepository vehicleRepository,
                                    OrderRepository orderRepository,
                                    DriverRepository driverRepository,
                                    TripAssignmentRepository tripAssignmentRepository,
                                    com.logiflow.server.repositories.trip.TripRepository tripRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.vehicleRepository = vehicleRepository;
        this.orderRepository = orderRepository;
        this.driverRepository = driverRepository;
        this.tripAssignmentRepository = tripAssignmentRepository;
        this.tripRepository = tripRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardDto getDashboardData() {
        // Get role name to ID mapping
        Map<String, Integer> roleNameToId = roleRepository.findAll().stream()
            .collect(Collectors.toMap(
                role -> role.getRoleName().toUpperCase(),
                role -> role.getRoleId()
            ));

        // Count active users by role
        long activeDispatchers = countActiveUsersByRole(roleNameToId, "DISPATCHER");
        long activeDrivers = countActiveUsersByRole(roleNameToId, "DRIVER");
        long activeManagers = countActiveUsersByRole(roleNameToId, "MANAGER");

        // Get user statistics
        UserStatsDto userStats = new UserStatsDto(
            userRepository.count(),  // total users
            userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7)),  // new signups (last 7 days)
            (int) activeDispatchers,
            (int) activeDrivers,
            (int) activeManagers
        );

        // Get recent user activities (last 10 logins)
        List<RecentActivityDto> recentActivities = userRepository
            .findRecentActiveUsers(PageRequest.of(0, 10))
            .stream()
            .map(user -> RecentActivityDto.loginActivity(
                user.getUsername(),
                user.getRole().getRoleName(),
                true, // success
                "127.0.0.1", // TODO: Get actual IP from authentication context
                "N/A", // TODO: Get actual user agent from request
                null // No consecutive failures for successful logins
            ))
            .collect(Collectors.toList());
        
        // Calculate total revenue from delivered orders
        BigDecimal totalRevenue = orderRepository.sumShippingFeeByStatus(Order.OrderStatus.DELIVERED);
        
        // Get fleet overview data
        int totalVehicles = (int) vehicleRepository.count();
        int activeVehicles = (int) vehicleRepository.countByStatus("in_use");
        FleetOverviewDto fleetOverview = FleetOverviewDto.of(
            activeVehicles,
            orderRepository.countByOrderStatus(Order.OrderStatus.IN_TRANSIT),
            orderRepository.countByOrderStatus(Order.OrderStatus.PENDING),
            totalRevenue,
            totalVehicles
        );

        // Get shipment statistics
        ShipmentStatisticsDto shipmentStatistics = ShipmentStatisticsDto.of(
            (int) tripRepository.countByStatus("scheduled"),
            (int) tripRepository.countByStatus("in_progress") + (int) tripRepository.countByStatus("arrived"),
            (int) tripRepository.countByStatus("completed"),
            (int) tripRepository.countByStatus("cancelled")
        );

        // Get delivery time statistics (last 30 days)
        List<DeliveryTimeStatsDto> deliveryTimeStats = calculateDeliveryTimeStats();

        // Get compliance alerts
        List<ComplianceAlertDto> complianceAlerts = getComplianceAlerts();

        return AdminDashboardDto.of(
            userStats,
            recentActivities,
            fleetOverview,
            shipmentStatistics,
            deliveryTimeStats,
            complianceAlerts
        );
    }

    private List<DeliveryTimeStatsDto> calculateDeliveryTimeStats() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Trip> completedTrips = tripRepository.findCompletedTripsForStats(thirtyDaysAgo);

        // Group by day of week and calculate average
        Map<DayOfWeek, List<Long>> deliveryTimesByDay = completedTrips.stream()
            .filter(t -> t.getActualArrival() != null && t.getScheduledDeparture() != null)
            .collect(Collectors.groupingBy(
                t -> t.getActualArrival().getDayOfWeek(),
                Collectors.mapping(
                    t -> Duration.between(t.getScheduledDeparture(), t.getActualArrival()).toMinutes(),
                    Collectors.toList()
                )
            ));

        // Create result list for each day of week
        List<DeliveryTimeStatsDto> result = new ArrayList<>();
        String[] dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        DayOfWeek[] days = {DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
                           DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY};

        for (int i = 0; i < days.length; i++) {
            List<Long> times = deliveryTimesByDay.getOrDefault(days[i], new ArrayList<>());
            Double avgMinutes = times.isEmpty() ? 0.0 : 
                times.stream().mapToLong(Long::longValue).average().orElse(0.0);
            result.add(DeliveryTimeStatsDto.of(dayNames[i], avgMinutes));
        }

        return result;
    }

    private int countActiveUsersByRole(Map<String, Integer> roleNameToId, String roleName) {
        return roleNameToId.containsKey(roleName) ? 
            userRepository.countByRole_RoleIdAndIsActive(roleNameToId.get(roleName), true) : 0;
    }

    private List<ComplianceAlertDto> getComplianceAlerts() {
        List<ComplianceAlertDto> alerts = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysFromNow = now.plusDays(30);

        // Check for vehicles needing maintenance (status = 'maintenance')
        long maintenanceVehicles = vehicleRepository.countByStatus("maintenance");
        if (maintenanceVehicles > 0) {
            alerts.add(ComplianceAlertDto.of(
                "MAINTENANCE_DUE",
                "WARNING",
                maintenanceVehicles + " vehicle(s) currently in maintenance",
                "VEHICLE",
                null,
                "Fleet Maintenance"
            ));
        }

        // Check for drivers with license expiring soon (within 30 days)
        List<Driver> drivers = driverRepository.findAll();
        long expiringLicenses = drivers.stream()
            .filter(d -> d.getUser() != null && d.getUser().getIsActive())
            .filter(d -> {
                // Check if there's a related registration request with license expiry
                // For now, we'll just do a basic check
                return false; // Placeholder - needs actual license expiry data from Driver entity
            })
            .count();

        // Check for overworked drivers (drivers with > 10 hours in last 24 hours)
        // This would require work_log tracking which isn't implemented yet
        // Placeholder for future implementation

        // Check for pending registration requests
        // This could be added if we want to show pending approvals as alerts

        return alerts;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActiveDriverLocationDto> getActiveDriverLocations() {
        // Find all trip assignments with status 'accepted' and trip status 'in_progress' or 'arrived'
        List<TripAssignment> activeAssignments = tripAssignmentRepository.findAll().stream()
            .filter(ta -> "accepted".equalsIgnoreCase(ta.getStatus()))
            .filter(ta -> {
                Trip trip = ta.getTrip();
                String status = trip.getStatus();
                return "in_progress".equalsIgnoreCase(status) || "arrived".equalsIgnoreCase(status);
            })
            .collect(Collectors.toList());

        // Map to DTOs with driver location and trip info
        return activeAssignments.stream()
            .filter(ta -> ta.getDriver() != null)
            .filter(ta -> ta.getDriver().getCurrentLocationLat() != null && ta.getDriver().getCurrentLocationLng() != null)
            .map(ta -> {
                Driver driver = ta.getDriver();
                Trip trip = ta.getTrip();
                return ActiveDriverLocationDto.of(
                    driver.getDriverId(),
                    driver.getUser().getFullName(),
                    driver.getUser().getPhone(),
                    trip.getTripId(),
                    trip.getStatus(),
                    driver.getCurrentLocationLat(),
                    driver.getCurrentLocationLng(),
                    trip.getVehicle() != null ? trip.getVehicle().getLicensePlate() : null,
                    trip.getRoute() != null ? trip.getRoute().getRouteName() : null
                );
            })
            .collect(Collectors.toList());
    }
}
