package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.system.SystemOverviewDto;
import com.logiflow.server.dtos.admin.system.SystemHealthDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class SystemOverviewServiceImpl implements SystemOverviewService {

    private final LocalDateTime systemStartTime;
    private String systemUptimeCache;

    @Value("${app.version:1.0.0}")
    private String systemVersion;
    
    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    private final Runtime runtime = Runtime.getRuntime();

    public SystemOverviewServiceImpl() {
        this.systemStartTime = LocalDateTime.now();
        updateUptime();
    }

    @Override
    @Transactional(readOnly = true)
    public SystemOverviewDto getSystemOverview() {
        // Update uptime cache
        updateUptime();

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

        return SystemOverviewDto.of(
            systemUptimeCache,
            activeAlerts,
            systemVersion,
            systemHealth
        );
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