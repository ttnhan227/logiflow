package com.logiflow.server.dtos.admin.notification;

import com.logiflow.server.models.Notification;
import java.time.LocalDateTime;

public class NotificationDto {

    private Long notificationId;
    private String notificationType;
    private String severity;
    private String title;
    private String message;
    private String actionUrl;
    private String actionText;
    private Integer relatedEntityId;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public NotificationDto() {}

    public NotificationDto(Notification notification) {
        this.notificationId = notification.getNotificationId();
        this.notificationType = notification.getNotificationType().toString();
        this.severity = notification.getSeverity();
        this.title = notification.getTitle();
        this.message = notification.getMessage();
        this.actionUrl = notification.getActionUrl();
        this.actionText = notification.getActionText();
        this.relatedEntityId = notification.getRelatedEntityId();
        this.isRead = notification.getIsRead();
        this.createdAt = notification.getCreatedAt();
    }

    // Getters and setters
    public Long getNotificationId() { return notificationId; }
    public void setNotificationId(Long notificationId) { this.notificationId = notificationId; }

    public String getNotificationType() { return notificationType; }
    public void setNotificationType(String notificationType) { this.notificationType = notificationType; }

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
}
