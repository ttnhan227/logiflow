package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Duration;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class RecentActivityDto {
    private String username;
    private String role;
    private LocalDateTime timestamp;
    private String timeAgo;
    
    public static String getTimeAgo(LocalDateTime timestamp) {
        if (timestamp == null) return "Never";
        
        Duration duration = Duration.between(timestamp, LocalDateTime.now());
        long minutes = duration.toMinutes();
        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + (minutes == 1 ? " minute ago" : " minutes ago");
        
        long hours = duration.toHours();
        if (hours < 24) return hours + (hours == 1 ? " hour ago" : " hours ago");
        
        long days = duration.toDays();
        return days + (days == 1 ? " day ago" : " days ago");
    }
}
