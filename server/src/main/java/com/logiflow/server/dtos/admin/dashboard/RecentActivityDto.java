package com.logiflow.server.dtos.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for displaying recent activities and system events in the admin dashboard.
 * Enhanced to include detailed security information for login attempts.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class    RecentActivityDto {
    public enum ActivityType {
        USER_LOGIN,      // Successful user login
        LOGIN_FAILED,    // Failed login attempt
        USER_UPDATE,     // User profile/account update
        SYSTEM_EVENT,    // System-generated event
        COMPLIANCE_ALERT // Security or compliance-related alert
    }

    // User information
    private String username;
    private String role;
    private LocalDateTime timestamp;
    
    // Activity details
    private ActivityType activityType;
    private String action;
    private String details;
    private boolean success;
    
    // Security information
    private String ipAddress;
    private String userAgent;
    private Integer consecutiveFailures;  // Null for successful logins

    /**
     * Factory method for login activities
     * @param username The username attempting to log in
     * @param role The role of the user
     * @param success Whether the login was successful
     * @param ipAddress The IP address of the login attempt
     * @param userAgent The user agent string from the request
     * @param consecutiveFailures Number of consecutive failed attempts (for failed logins)
     * @return A RecentActivityDto instance
     */
    public static RecentActivityDto loginActivity(String username, String role, boolean success, 
                                               String ipAddress, String userAgent, Integer consecutiveFailures) {
        String action = success ? "Logged in" : "Failed login attempt";
        String details;
        
        if (success) {
            details = String.format("Successfully logged in from %s", ipAddress);
        } else {
            String failureDetails = String.format("Failed login attempt from %s", ipAddress);
            if (consecutiveFailures != null && consecutiveFailures > 1) {
                failureDetails += String.format(" (%d consecutive failures)", consecutiveFailures);
            }
            details = failureDetails;
        }
            
        return builder()
            .username(username)
            .role(role)
            .activityType(success ? ActivityType.USER_LOGIN : ActivityType.LOGIN_FAILED)
            .action(action)
            .details(details)
            .timestamp(LocalDateTime.now())
            .success(success)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .consecutiveFailures(success ? null : consecutiveFailures)
            .build();
    }

    /**
     * Factory method for system events with optional IP address
     * 
     * @param event The system event name
     * @param details Detailed message about the event
     * @param ipAddress Optional IP address related to the event
     * @return A RecentActivityDto instance for system events
     */
    public static RecentActivityDto systemEvent(String event, String details, String ipAddress) {
        return builder()
            .username("System")
            .role("SYSTEM")
            .activityType(ActivityType.SYSTEM_EVENT)
            .action(event)
            .details(ipAddress != null ? String.format("%s (IP: %s)", details, ipAddress) : details)
            .timestamp(LocalDateTime.now())
            .success(true)
            .ipAddress(ipAddress)
            .build();
    }

    /**
     * Overloaded method for system events without IP address
     */
    /**
     * Factory method for user update activities
     * @param username The username that was updated
     * @param role The role of the user
     * @param fieldUpdated The field that was updated (e.g., 'password', 'email', 'profile')
     * @return A RecentActivityDto instance for user updates
     */
    public static RecentActivityDto userUpdate(String username, String role, String fieldUpdated) {
        return builder()
            .username(username)
            .role(role)
            .activityType(ActivityType.USER_UPDATE)
            .action("Profile Updated")
            .details(String.format("Updated %s", fieldUpdated))
            .timestamp(LocalDateTime.now())
            .success(true)
            .build();
    }

    /**
     * Factory method for compliance/security alerts
     * @param message Alert message
     * @param ipAddress The IP address where the alert originated
     * @return A RecentActivityDto instance for security alerts
     */
    public static RecentActivityDto complianceAlert(String message, String ipAddress) {
        return builder()
            .username("System")
            .role("SYSTEM")
            .activityType(ActivityType.COMPLIANCE_ALERT)
            .action("Security Alert")
            .details(message)
            .timestamp(LocalDateTime.now())
            .success(false)
            .ipAddress(ipAddress)
            .build();
    }

    public static RecentActivityDto systemEvent(String event, String details) {
        return systemEvent(event, details, null);
    }

    // Keep the existing timeAgo helper
}