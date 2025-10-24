package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.dashboard.DashboardOverviewDto;
import com.logiflow.server.dtos.admin.dashboard.UserStatsDto;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.logiflow.server.dtos.admin.dashboard.RecentActivityDto;
import com.logiflow.server.dtos.admin.dashboard.SystemHealthDto;
import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.ThreadMXBean;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final LocalDateTime systemStartTime;
    private String systemUptimeCache;

    @Value("${app.version:1.0.0}")
    private String systemVersion;
    
    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    private final Runtime runtime = Runtime.getRuntime();

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

        // Get user statistics
        UserStatsDto userStats = new UserStatsDto(
            userRepository.count(),  // total users
            userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7)),  // new signups (last 7 days)
            userRepository.countByIsActive(false),  // pending approvals (inactive users)
            (int) activeDispatchers,
            (int) activeDrivers,
            (int) activeManagers
        );

        // Get recent user activities (last 5 logins)
        List<RecentActivityDto> recentActivities = userRepository
            .findRecentActiveUsers(PageRequest.of(0, 5))
            .stream()
            .map(user -> new RecentActivityDto(
                user.getUsername(),
                user.getRole().getRoleName(),
                user.getLastLogin(),
                RecentActivityDto.getTimeAgo(user.getLastLogin())
            ))
            .collect(Collectors.toList());

        // Get active alerts (placeholder - implement as needed)
        int activeAlerts = 0;
        
        // Get system health metrics
        SystemHealthDto systemHealth = new SystemHealthDto(
            // CPU usage
            getCpuUsage(),
            
            // Memory usage (in MB)
            (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024), // used
            runtime.maxMemory() / (1024 * 1024), // max
            
            // Free disk space (in GB)
            new File("/").getUsableSpace() / (1024 * 1024 * 1024),
            
            // Database status
            "UP",
            
            // Timestamp
            LocalDateTime.now()
        );
        
        return DashboardOverviewDto.of(
            systemUptimeCache,
            activeAlerts,
            systemVersion,
            userStats,
            recentActivities,
            systemHealth
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
    
    private double getCpuUsage() {
        try {
            com.sun.management.OperatingSystemMXBean osBean = 
                (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
            
            // Get CPU time in nanoseconds
            long prevCpuTime = osBean.getProcessCpuTime();
            long prevUpTime = System.nanoTime();
            
            // Wait a bit to measure CPU usage over time
            Thread.sleep(300);
            
            // Calculate CPU usage percentage
            long elapsedCpu = osBean.getProcessCpuTime() - prevCpuTime;
            long elapsedTime = System.nanoTime() - prevUpTime;
            
            // Calculate CPU usage as a percentage
            double cpuUsage = Math.min(99.9, 
                (elapsedCpu / (elapsedTime * 1.0 * osBean.getAvailableProcessors())) * 100);
                
            return Math.round(cpuUsage * 10) / 10.0;
        } catch (Exception e) {
            return -1; // Indicate error
        }
    }
}