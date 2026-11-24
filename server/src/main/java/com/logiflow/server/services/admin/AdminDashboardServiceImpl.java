package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.dashboard.*;
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
import com.logiflow.server.repositories.payment.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
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
    private final PaymentRepository paymentRepository;

    public AdminDashboardServiceImpl(UserRepository userRepository,
                                    RoleRepository roleRepository,
                                    VehicleRepository vehicleRepository,
                                    OrderRepository orderRepository,
                                    DriverRepository driverRepository,
                                    TripAssignmentRepository tripAssignmentRepository,
                                    com.logiflow.server.repositories.trip.TripRepository tripRepository,
                                    PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.vehicleRepository = vehicleRepository;
        this.orderRepository = orderRepository;
        this.driverRepository = driverRepository;
        this.tripAssignmentRepository = tripAssignmentRepository;
        this.tripRepository = tripRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardDto getDashboardData() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime weekAgo = now.minusDays(7);
        LocalDateTime monthAgo = now.minusDays(30);

        // Get role name to ID mapping
        Map<String, Integer> roleNameToId = roleRepository.findAll().stream()
            .collect(Collectors.toMap(
                role -> role.getRoleName().toUpperCase(),
                role -> role.getRoleId()
            ));

        // Count active users by role
        long activeDispatchers = countActiveUsersByRole(roleNameToId, "DISPATCHER");
        long activeDrivers = countActiveUsersByRole(roleNameToId, "DRIVER");

        // Get user statistics
        UserStatsDto userStats = new UserStatsDto(
            userRepository.count(),  // total users
            userRepository.countByCreatedAtAfter(weekAgo),  // new signups (last 7 days)
            (int) activeDispatchers,
            (int) activeDrivers
        );

        // Get recent user activities (last 10 logins)
        List<RecentActivityDto> recentActivities = userRepository
            .findRecentActiveUsers(PageRequest.of(0, 10))
            .stream()
            .map(user -> RecentActivityDto.loginActivity(
                user.getUsername(),
                user.getRole().getRoleName(),
                true, // success
                "127.0.0.1", // Request IP is not persisted on User login audit summary
                "N/A", // Request user agent is not persisted on User login audit summary
                null // No consecutive failures for successful logins
            ))
            .collect(Collectors.toList());

        // Calculate today's revenue from delivered orders with paid payments
        // Use same calculation as AdminReportsServiceImpl for consistency
        BigDecimal todayRevenue = calculateRevenue(todayStart, now);

        // Calculate DIFOT rate (Delivery In Full On Time) - completed trips without delay
        // Use same calculation as AdminReportsServiceImpl for consistency
        long totalCompletedTrips = tripRepository.countByStatus("completed");
        long onTimeTrips = tripRepository.countCompletedTripsWithoutDelay(monthAgo);

        double difotRate = totalCompletedTrips > 0
            ? (double) onTimeTrips / totalCompletedTrips * 100
            : 0.0;

        // Fleet utilization - Use same calculation as AdminReportsServiceImpl
        int totalVehicles = (int) vehicleRepository.count();
        int activeVehicles = (int) vehicleRepository.countByStatus("in_use");
        double fleetUtilization = totalVehicles > 0 ? (activeVehicles * 100.0 / totalVehicles) : 0.0;

        // Active trips count (trips in progress, assigned, in transit, or arrived)
        long activeTripsCount = tripRepository.countByStatus("in_progress") +
                               tripRepository.countByStatus("assigned") +
                               tripRepository.countByStatus("in_transit") +
                               tripRepository.countByStatus("arrived");

        // Operations Overview
        OperationsOverviewDto operationsOverview = OperationsOverviewDto.of(
            difotRate,
            fleetUtilization,
            todayRevenue,
            (int) activeTripsCount,
            (int) activeDrivers,
            0, // active ports (not implemented yet)
            0  // active warehouses (not implemented yet)
        );

        // Fleet Lifecycle Data - Calculate from real vehicle data using efficient queries
        Map<String, Integer> vehicleAgeGroups = calculateVehicleAgeGroups();
        Map<String, Integer> vehicleTypes = calculateVehicleTypeDistribution();
        long maintenanceVehicles = vehicleRepository.countByStatus("maintenance");
        long availableVehicles = totalVehicles - activeVehicles - maintenanceVehicles;

        FleetLifecycleDto fleetLifecycle = FleetLifecycleDto.of(
            vehicleAgeGroups,
            vehicleTypes,
            (int) availableVehicles,
            activeVehicles,
            (int) maintenanceVehicles
        );

        // Compliance Status - Calculate from real driver data
        ComplianceMetrics complianceMetrics = calculateComplianceMetrics(monthAgo);
        double averageRating = calculateAverageDriverRating();
        double customerSatisfaction = calculateCustomerSatisfaction(monthAgo);
        LicenseMetrics licenseMetrics = calculateLicenseMetrics();

        ComplianceStatusDto complianceStatus = ComplianceStatusDto.of(
            complianceMetrics.compliantDrivers,
            complianceMetrics.warningDrivers,
            complianceMetrics.atRiskDrivers,
            (int) activeDrivers,
            averageRating,
            difotRate,
            customerSatisfaction,
            licenseMetrics.validLicenses,
            licenseMetrics.expiringLicenses
        );

        // Financial Performance
        BigDecimal averageRevenuePerTrip = totalCompletedTrips > 0 ?
            todayRevenue.divide(BigDecimal.valueOf(totalCompletedTrips), 2, RoundingMode.HALF_UP) :
            BigDecimal.ZERO;

        // Calculate financial metrics from real cost data
        FinancialMetrics financialMetrics = calculateFinancialMetrics(todayRevenue, monthAgo);

        FinancialPerformanceDto financialPerformance = FinancialPerformanceDto.of(
            todayRevenue,
            averageRevenuePerTrip,
            (int) totalCompletedTrips,
            financialMetrics.fuelCostPercent,
            financialMetrics.driverPayPercent,
            financialMetrics.otherCostsPercent,
            financialMetrics.grossMargin,
            totalVehicles > 0 ? todayRevenue.divide(BigDecimal.valueOf(totalVehicles), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO
        );

        // Active Operations - Get real active trips from database using proper repository methods
        List<ActiveTripDto> activeTrips = getActiveTrips();

        // Calculate pending assignments - trips that need drivers assigned
        long pendingAssignments = calculatePendingAssignments();

        // Calculate urgent assignments - high priority orders waiting
        long urgentAssignments = calculateUrgentAssignments();

        ActiveOperationsDto activeOperations = ActiveOperationsDto.of(
            activeTrips,
            (int) pendingAssignments,
            (int) urgentAssignments
        );

        // System Health - Calculate from real data
        List<SystemActivityDto> systemActivities = new ArrayList<>();

        // Add recent real activities based on database data
        if (!recentActivities.isEmpty()) {
            systemActivities.add(SystemActivityDto.of(
                "Recent user activity: " + recentActivities.get(0).getUsername(),
                "recent",
                "user_activity"
            ));
        }

        // Calculate real delay reports and alerts
        long delayReports = tripRepository.countTripsWithDelayReason();
        long criticalAlerts = tripRepository.countCriticalAlerts();

        // Add sample activities if no real ones exist
        if (systemActivities.isEmpty()) {
            systemActivities.add(SystemActivityDto.of("System operational", "now", "system_status"));
        }

        SystemHealthDto systemHealth = SystemHealthDto.of(
            systemActivities,
            (int) criticalAlerts,
            (int) delayReports,
            calculateComplianceWarnings()
        );

        return AdminDashboardDto.of(
            userStats,
            recentActivities,
            operationsOverview,
            fleetLifecycle,
            complianceStatus,
            financialPerformance,
            activeOperations,
            systemHealth
        );
    }


    private int countActiveUsersByRole(Map<String, Integer> roleNameToId, String roleName) {
        return roleNameToId.containsKey(roleName) ? 
            userRepository.countByRole_RoleIdAndIsActive(roleNameToId.get(roleName), true) : 0;
    }


    @Override
    @Transactional(readOnly = true)
    public List<ActiveDriverLocationDto> getActiveDriverLocations() {
        // Get all drivers with current location data
        return driverRepository.findAll().stream()
            .filter(driver -> driver.getCurrentLocationLat() != null && driver.getCurrentLocationLng() != null)
            .map(driver -> ActiveDriverLocationDto.of(
                driver.getDriverId(),
                driver.getUser().getFullName(),
                driver.getUser().getPhone(),
                null, // tripId - not needed
                "active", // tripStatus - simplified
                driver.getCurrentLocationLat(),
                driver.getCurrentLocationLng(),
                null, // vehiclePlate - not needed
                null  // routeName - not needed
            ))
            .collect(Collectors.toList());
    }

    // Helper methods for calculations

    private BigDecimal calculateRevenue(LocalDateTime startDate, LocalDateTime endDate) {
        return paymentRepository.getTotalRevenueInDateRange(startDate, endDate);
    }

    private Map<String, Integer> calculateVehicleAgeGroups() {
        Map<String, Integer> ageGroups = new HashMap<>();
        Object[] result = vehicleRepository.countVehiclesByAgeGroups();
        if (result != null && result.length >= 3) {
            ageGroups.put("0-2_years", ((Number) result[0]).intValue());
            ageGroups.put("2-4_years", ((Number) result[1]).intValue());
            ageGroups.put("4+_years", ((Number) result[2]).intValue());
        }
        return ageGroups;
    }

    private Map<String, Integer> calculateVehicleTypeDistribution() {
        Map<String, Integer> typeDistribution = new HashMap<>();
        List<Object[]> results = vehicleRepository.countVehiclesByType();
        for (Object[] result : results) {
            String type = (String) result[0];
            Integer count = ((Number) result[1]).intValue();
            typeDistribution.put(type, count);
        }
        return typeDistribution;
    }

    private ComplianceMetrics calculateComplianceMetrics(LocalDateTime since) {
        long totalDrivers = driverRepository.count();
        long compliantDrivers = totalDrivers - driverRepository.countDriversWithComplianceIssues();
        long warningDrivers = driverRepository.countDriversWithLowRating();
        long atRiskDrivers = driverRepository.countDriversWithComplianceIssues();

        return new ComplianceMetrics(
            (int) Math.max(compliantDrivers, 0),
            (int) warningDrivers,
            (int) atRiskDrivers
        );
    }

    private double calculateAverageDriverRating() {
        Double avgRating = driverRepository.getAverageDriverRating();
        return avgRating != null ? avgRating : 0.0;
    }

    private double calculateCustomerSatisfaction(LocalDateTime since) {
        // Calculate based on completed orders and payment status
        // Higher satisfaction for paid orders, lower for pending payments
        long totalCompletedOrders = orderRepository.countByOrderStatus(Order.OrderStatus.DELIVERED);
        long paidCompletedOrders = orderRepository.countByOrderStatusAndPaymentStatus(
            Order.OrderStatus.DELIVERED, Order.PaymentStatus.PAID);

        if (totalCompletedOrders == 0) return 0.0;

        // Base satisfaction on payment completion rate
        double paymentCompletionRate = (double) paidCompletedOrders / totalCompletedOrders;
        double finalSatisfaction = Math.max(0.0, Math.min(5.0, paymentCompletionRate * 5.0));

        return Math.round(finalSatisfaction * 10.0) / 10.0; // Round to 1 decimal place
    }

    private LicenseMetrics calculateLicenseMetrics() {
        long validLicenses = driverRepository.countDriversWithValidLicenses();
        long expiringLicenses = driverRepository.countDriversWithExpiringLicenses();

        return new LicenseMetrics((int) validLicenses, (int) expiringLicenses);
    }

    private FinancialMetrics calculateFinancialMetrics(BigDecimal revenue, LocalDateTime since) {
        // Operating cost breakdown is not persisted on the backend; return 0.0 rather than simulated values.
        return new FinancialMetrics(0.0, 0.0, 0.0, 0.0);
    }

    private List<ActiveTripDto> getActiveTrips() {
        List<Trip> activeTripsData = new ArrayList<>();

        // Get trips for each active status using repository methods
        Arrays.asList("in_progress", "assigned", "in_transit", "arrived").forEach(status -> {
            activeTripsData.addAll(tripRepository.findByStatusWithRelations(status));
        });

        // Limit to 10 most recent and convert to DTOs
        return activeTripsData.stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // Most recent first
            .limit(10)
            .map(trip -> {
                // Get driver from trip assignments
                String driverName = "Not assigned";
                if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
                    TripAssignment assignment = trip.getTripAssignments().stream()
                        .filter(ta -> ta.getDriver() != null)
                        .findFirst()
                        .orElse(null);
                    if (assignment != null) {
                        driverName = assignment.getDriver().getUser().getFullName();
                    }
                }

                // Get route from trip route relationship
                String route = "Unknown → Unknown";
                if (trip.getRoute() != null) {
                    if (trip.getRoute().getIsTripRoute() != null && trip.getRoute().getIsTripRoute()) {
                        // For trip routes, derive from waypoints or orders
                        try {
                            if (trip.getOrders() != null && !trip.getOrders().isEmpty()) {
                                String originCity = trip.getOrders().get(0).getPickupAddress();
                                String destCity = trip.getOrders().get(trip.getOrders().size() - 1).getDeliveryAddress();
                                route = (originCity != null ? originCity.split(",")[0] : "Unknown") + " → " +
                                       (destCity != null ? destCity.split(",")[0] : "Unknown");
                            } else {
                                route = "Multi-stop Route";
                            }
                        } catch (Exception e) {
                            route = "Multi-stop Route";
                        }
                    } else {
                        // For legacy single routes (none should exist in new system)
                        route = "Single Route";
                    }
                }

                // Use scheduled arrival as ETA
                String eta = trip.getScheduledArrival() != null ? trip.getScheduledArrival().toString() : null;
                String delayReason = trip.getDelayReason();

                return ActiveTripDto.of(
                    trip.getTripId().toString(),
                    driverName,
                    route,
                    trip.getStatus(),
                    eta,
                    delayReason
                );
            })
            .collect(Collectors.toList());
    }

    private long calculatePendingAssignments() {
        return tripRepository.countTripsNeedingAssignment();
    }

    private long calculateUrgentAssignments() {
        return tripRepository.countUrgentTripsNeedingAssignment();
    }

    private int calculateComplianceWarnings() {
        return (int) driverRepository.countDriversWithComplianceIssues();
    }

    // Helper classes for complex calculations

    private static class ComplianceMetrics {
        final int compliantDrivers;
        final int warningDrivers;
        final int atRiskDrivers;

        ComplianceMetrics(int compliantDrivers, int warningDrivers, int atRiskDrivers) {
            this.compliantDrivers = compliantDrivers;
            this.warningDrivers = warningDrivers;
            this.atRiskDrivers = atRiskDrivers;
        }
    }

    private static class LicenseMetrics {
        final int validLicenses;
        final int expiringLicenses;

        LicenseMetrics(int validLicenses, int expiringLicenses) {
            this.validLicenses = validLicenses;
            this.expiringLicenses = expiringLicenses;
        }
    }

    private static class FinancialMetrics {
        final double fuelCostPercent;
        final double driverPayPercent;
        final double otherCostsPercent;
        final double grossMargin;

        FinancialMetrics(double fuelCostPercent, double driverPayPercent, double otherCostsPercent, double grossMargin) {
            this.fuelCostPercent = fuelCostPercent;
            this.driverPayPercent = driverPayPercent;
            this.otherCostsPercent = otherCostsPercent;
            this.grossMargin = grossMargin;
        }
    }
}
