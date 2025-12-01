package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.dashboard.AdminDashboardDto;
import com.logiflow.server.dtos.admin.dashboard.UserStatsDto;
import com.logiflow.server.dtos.admin.dashboard.FleetOverviewDto;
import com.logiflow.server.dtos.admin.dashboard.RecentActivityDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VehicleRepository vehicleRepository;
    private final OrderRepository orderRepository;

    public AdminDashboardServiceImpl(UserRepository userRepository, 
                                    RoleRepository roleRepository,
                                    VehicleRepository vehicleRepository,
                                    OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.vehicleRepository = vehicleRepository;
        this.orderRepository = orderRepository;
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
        
        // Get fleet overview data
        FleetOverviewDto fleetOverview = FleetOverviewDto.of(
            (int) vehicleRepository.count(),
            orderRepository.countByOrderStatus(Order.OrderStatus.IN_TRANSIT),
            orderRepository.countByOrderStatus(Order.OrderStatus.PENDING)
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
}
