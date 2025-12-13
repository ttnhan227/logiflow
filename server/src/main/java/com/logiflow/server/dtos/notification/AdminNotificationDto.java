package com.logiflow.server.dtos.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationDto {
    private String id;              // Unique notification ID
    private String type;            // REGISTRATION_REQUEST, COMPLIANCE_ALERT, SYSTEM_EVENT, USER_ACTION, etc.
    private String severity;        // INFO, WARNING, CRITICAL
    private String title;           // Notification title
    private String message;         // Notification message
    private String actionUrl;       // URL to navigate to (e.g., /admin/registration-requests/123)
    private String actionLabel;     // Action button label (e.g., "View Request", "Review Alert")
    private LocalDateTime timestamp;
    private Boolean isRead;         // Whether notification has been read
    private Object metadata;        // Additional data (user info, request ID, etc.)

    public static AdminNotificationDto of(String type, String severity, String title, 
                                         String message, String actionUrl, String actionLabel) {
        return AdminNotificationDto.builder()
                .id(java.util.UUID.randomUUID().toString())
                .type(type)
                .severity(severity)
                .title(title)
                .message(message)
                .actionUrl(actionUrl)
                .actionLabel(actionLabel)
                .timestamp(LocalDateTime.now())
                .isRead(false)
                .build();
    }
}
