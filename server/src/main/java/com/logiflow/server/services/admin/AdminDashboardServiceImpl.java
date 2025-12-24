package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.dashboard.AdminDashboardDto;
import com.logiflow.server.dtos.admin.dashboard.UserStatsDto;
import com.logiflow.server.dtos.admin.dashboard.FleetOverviewDto;
import com.logiflow.server.dtos.admin.dashboard.RecentActivityDto;
import com.logiflow.server.dtos.admin.dashboard.ActiveDriverLocationDto;
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
            userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7)),  // new signups (last 7 days)
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
                "127.0.0.1", // TODO: Get actual IP from authentication context
                "N/A", // TODO: Get actual user agent from request
                null // No consecutive failures for successful logins
            ))
            .collect(Collectors.toList());
        
        // Calculate total revenue from paid orders only (consistent with payment request page)
        List<Order> deliveredOrders = orderRepository.findByOrderStatusWithoutRelations(Order.OrderStatus.DELIVERED, PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        List<com.logiflow.server.models.Payment> payments = deliveredOrders.stream()
            .flatMap(order -> paymentRepository.findByOrder(order).stream())
            .collect(Collectors.toList());

        BigDecimal totalRevenue = payments.stream()
            .filter(p -> com.logiflow.server.models.Payment.PaymentStatus.PAID.equals(p.getPaymentStatus()))
            .map(com.logiflow.server.models.Payment::getAmount)
            .filter(java.util.Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
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

        return AdminDashboardDto.of(
            userStats,
            recentActivities,
            fleetOverview
        );
    }


    private int countActiveUsersByRole(Map<String, Integer> roleNameToId, String roleName) {
        return roleNameToId.containsKey(roleName) ? 
            userRepository.countByRole_RoleIdAndIsActive(roleNameToId.get(roleName), true) : 0;
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
