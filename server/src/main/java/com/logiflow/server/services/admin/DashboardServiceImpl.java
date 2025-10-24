package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.DashboardOverviewDto;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final LocalDateTime systemStartTime;
    private String systemUptimeCache;

    @Value("${app.version:1.0.0}")
    private String systemVersion;

    public DashboardServiceImpl(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.systemStartTime = LocalDateTime.now();
        updateUptime();
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardOverviewDto getDashboardOverview() {
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
        
        long totalActiveUsers = userRepository.countByIsActive(true);

        // Get active alerts (placeholder - implement as needed)
        int activeAlerts = 0;

        return new DashboardOverviewDto(
            (int) totalActiveUsers,
            (int) activeDispatchers,
            (int) activeDrivers,
            (int) activeManagers,
            systemUptimeCache,
            activeAlerts,
            systemVersion
        );
    }

    private int countActiveUsersByRole(Map<String, Integer> roleNameToId, String roleName) {
        return roleNameToId.containsKey(roleName) ? 
            userRepository.countByRole_RoleIdAndIsActive(roleNameToId.get(roleName), true) : 0;
    }

    @Scheduled(fixedRate = 60000)
    public void updateUptime() {
        Duration uptime = Duration.between(systemStartTime, LocalDateTime.now());
        long days = uptime.toDays();
        long hours = uptime.toHours() % 24;
        long minutes = uptime.toMinutes() % 60;
        systemUptimeCache = String.format("%dd %dh %dm", days, hours, minutes);
    }
}