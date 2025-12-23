package com.logiflow.server.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType notificationType;

    @Column(name = "severity", nullable = false)
    private String severity; // INFO, WARNING, ERROR, CRITICAL

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "action_text")
    private String actionText;

    @Column(name = "related_entity_id")
    private Integer relatedEntityId; // trip_id, order_id, customer_id, etc.

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Optional: Link to specific user if not broadcast
    @ManyToOne
    @JoinColumn(name = "target_user_id")
    private User targetUser;

    public Notification() {}

    public Notification(NotificationType notificationType, String severity, String title, String message,
                       String actionUrl, String actionText, Integer relatedEntityId, User targetUser) {
        this.notificationType = notificationType;
        this.severity = severity;
        this.title = title;
        this.message = message;
        this.actionUrl = actionUrl;
        this.actionText = actionText;
        this.relatedEntityId = relatedEntityId;
        this.targetUser = targetUser;
        this.createdAt = LocalDateTime.now();
    }

    // Static factory methods for common notifications
    public static Notification delayReport(Integer tripId, String driverName, String delayReason) {
        return new Notification(
            NotificationType.DELAY_REPORT,
            "WARNING",
            "Driver Delay Report",
            String.format("Driver reported delay for trip #%d: %s", tripId, delayReason),
            "/admin/trips-oversight/" + tripId,
            "Review Delay",
            tripId,
            null
        );
    }

    public enum NotificationType {
        DELAY_REPORT,    // Driver delay reports
        REGISTRATION_REQUEST,
        COMPLIANCE_ALERT,
        SYSTEM_EVENT,
        NEW_ORDER,
        DRIVER_TRIP_EVENT, // Generic driver trip notifications (assigned, delay responses, status updates, etc.)
        ORDER_DELIVERED,   // Order delivery notifications for customers
        PAYMENT_REQUEST    // Payment request notifications for customers
    }

    // Getters and setters
    public Long getNotificationId() { return notificationId; }
    public void setNotificationId(Long notificationId) { this.notificationId = notificationId; }

    public NotificationType getNotificationType() { return notificationType; }
    public void setNotificationType(NotificationType notificationType) { this.notificationType = notificationType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }

    public String getActionText() { return actionText; }
    public void setActionText(String actionText) { this.actionText = actionText; }

    public Integer getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(Integer relatedEntityId) { this.relatedEntityId = relatedEntityId; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public User getTargetUser() { return targetUser; }
    public void setTargetUser(User targetUser) { this.targetUser = targetUser; }
}
