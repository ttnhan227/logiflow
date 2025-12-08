package com.logiflow.server.websocket;

import com.logiflow.server.dtos.notification.AdminNotificationDto;
import com.logiflow.server.dtos.notification.TripNotificationDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // ===== Driver Notifications =====
    public void sendDriverNotification(Integer driverId, String type, String message) {
        String destination = "/topic/driver/" + driverId;
        TripNotificationDto notification = new TripNotificationDto();
        notification.setType(type);
        notification.setMessage(message);
        messagingTemplate.convertAndSend(destination, notification);
    }

    public void sendTripNotification(Integer driverId, Integer tripId, String type, String message, String tripStatus) {
        String destination = "/topic/driver/" + driverId;
        TripNotificationDto notification = new TripNotificationDto(type, message, tripId, tripStatus);
        messagingTemplate.convertAndSend(destination, notification);
    }

    public void sendTripNotificationWithData(Integer driverId, TripNotificationDto notification) {
        String destination = "/topic/driver/" + driverId;
        messagingTemplate.convertAndSend(destination, notification);
    }

    // ===== Admin Notifications =====
    
    /**
     * Send notification to all admin users
     */
    public void sendAdminNotification(AdminNotificationDto notification) {
        messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
    }

    /**
     * Send notification to a specific admin user
     */
    public void sendAdminNotificationToUser(String username, AdminNotificationDto notification) {
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", notification);
    }

    /**
     * Broadcast system-wide notification to all admins
     */
    public void broadcastToAdmins(String type, String severity, String title, String message) {
        AdminNotificationDto notification = AdminNotificationDto.of(
            type, severity, title, message, null, null
        );
        sendAdminNotification(notification);
    }

    /**
     * Send notification about new registration request
     */
    public void notifyNewRegistrationRequest(String username, String role, Integer requestId) {
        AdminNotificationDto notification = AdminNotificationDto.of(
            "REGISTRATION_REQUEST",
            "INFO",
            "New Registration Request",
            "New " + role + " registration from: " + username,
            "/admin/registration-requests/" + requestId,
            "Review Request"
        );
        sendAdminNotification(notification);
    }

    /**
     * Send compliance alert notification
     */
    public void notifyComplianceAlert(String alertType, String severity, String message, String actionUrl) {
        AdminNotificationDto notification = AdminNotificationDto.of(
            "COMPLIANCE_ALERT",
            severity,
            "Compliance Alert",
            message,
            actionUrl,
            "View Details"
        );
        sendAdminNotification(notification);
    }

    /**
     * Send system event notification
     */
    public void notifySystemEvent(String title, String message, String severity) {
        AdminNotificationDto notification = AdminNotificationDto.of(
            "SYSTEM_EVENT",
            severity,
            title,
            message,
            "/admin/dashboard",
            "View Dashboard"
        );
        sendAdminNotification(notification);
    }
}
