package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Simplified system health metrics for dashboard
 */
@Data
@AllArgsConstructor
public class SystemHealthDto {
    // CPU usage percentage
    private double cpuUsage;
    
    // Memory usage in MB
    private long usedMemoryMB;
    private long maxMemoryMB;
    
    // Free disk space in GB
    private long freeDiskSpaceGB;
    
    // Database status
    private String dbStatus;
    
    // When metrics were collected
    private LocalDateTime lastUpdated;
}
