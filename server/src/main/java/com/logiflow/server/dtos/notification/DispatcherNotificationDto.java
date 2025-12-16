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
public class DispatcherNotificationDto {
    private String id;              // Unique notification ID
    private String type;            // NEW_ORDER, DELAY_REPORT, etc.
    private String severity;        // INFO, WARNING, CRITICAL
    private String title;           // Notification title
    private String message;         // Notification message
    private String actionUrl;       // URL to navigate to (e.g., /dispatch/orders/123)
    private String actionLabel;     // Action button label (e.g., "View Order", "Review Delay")
    private LocalDateTime timestamp;
    private Boolean isRead;         // Whether notification has been read
    private Object metadata;        // Additional data (order info, trip details, etc.)

    public static DispatcherNotificationDto of(String type, String severity, String title, 
                                              String message, String actionUrl, String actionLabel) {
        return DispatcherNotificationDto.builder()
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
