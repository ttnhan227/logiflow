package com.logiflow.server.websocket;

import com.logiflow.server.dtos.notification.AdminNotificationDto;
import com.logiflow.server.dtos.notification.TripNotificationDto;
import com.logiflow.server.models.Notification;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.notification.NotificationRepository;
import com.logiflow.server.repositories.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

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

    // Send to username-based topic (used by mobile app) and store in DB for persistence
    public void sendTripNotificationByUsername(String username, Integer tripId, String type, String message, String tripStatus) {
        String destination = "/topic/driver/" + username;
        TripNotificationDto notification = new TripNotificationDto(type, message, tripId, tripStatus);
        messagingTemplate.convertAndSend(destination, notification);

        // Persist notification for this user so it survives app restarts
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            String title = switch (type) {
                case "DELAY_RESPONSE" -> "Delay response for Trip #" + tripId;
                case "TRIP_ASSIGNED" -> "New trip assigned";
                case "TRIP_STATUS_UPDATE" -> "Trip status updated";
                default -> "Trip notification";
            };

            Notification dbNotification = new Notification(
                Notification.NotificationType.DRIVER_TRIP_EVENT,
                "INFO",
                title,
                message,
                null,                // actionUrl (mobile uses tripId directly)
                null,                // actionText
                tripId,              // relatedEntityId = tripId
                user                 // target user (driver)
            );
            notificationRepository.save(dbNotification);
        }
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
     * Broadcast system-wide notification to all admins (both websocket + database)
     */
    public void broadcastToAdmins(String type, String severity, String title, String message) {
        AdminNotificationDto notification = AdminNotificationDto.of(
            type, severity, title, message, null, null
        );
        sendAdminNotification(notification);

        // Also store in database for persistence
        Notification delayNotification = new Notification(
            Notification.NotificationType.valueOf(type),
            severity,
            title,
            message,
            null,  // actionUrl
            null,  // actionText
            null,  // relatedEntityId (set later)
            null   // targetAdminUser (broadcast to all)
        );
        notificationRepository.save(delayNotification);
    }

    /**
     * Broadcast with action details and store in database
     */
    public void broadcastToAdminsWithAction(String type, String severity, String title, String message,
                                          String actionUrl, String actionText, Integer relatedEntityId) {
        // Determine NotificationType enum value
        Notification.NotificationType notificationType;
        try {
            notificationType = Notification.NotificationType.valueOf(type);
        } catch (IllegalArgumentException e) {
            notificationType = Notification.NotificationType.SYSTEM_EVENT; // Default fallback
        }

        AdminNotificationDto websocketNotification = AdminNotificationDto.of(
            type, severity, title, message, actionUrl, actionText
        );
        sendAdminNotification(websocketNotification);

        // Store in database for persistence
        Notification dbNotification = new Notification(
            notificationType,
            severity,
            title,
            message,
            actionUrl,
            actionText,
            relatedEntityId,
            null // targetAdminUser (broadcast to all)
        );
        notificationRepository.save(dbNotification);
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

    /**
     * Send notification about new order to all dispatchers
     */
    public void notifyNewOrder(Integer orderId, String customerName, String priority) {
        AdminNotificationDto notification = AdminNotificationDto.of(
            "NEW_ORDER",
            "URGENT".equalsIgnoreCase(priority) ? "WARNING" : "INFO",
            "New Order Received",
            "New " + priority + " order from " + customerName,
            "/dispatch/orders/" + orderId,
            "View Order"
        );
        sendAdminNotification(notification);
    }

    public void sendCustomerNotification(Integer customerId, String type, String message) {
        String destination = "/topic/customer/" + customerId;
        TripNotificationDto notification = new TripNotificationDto();
        notification.setType(type);
        notification.setMessage(message);
        messagingTemplate.convertAndSend(destination, notification);
    }

    public void sendOrderNotification(Integer customerId, Integer orderId, String type, String message, String orderStatus) {
        String destination = "/topic/customer/" + customerId;
        TripNotificationDto notification = new TripNotificationDto(type, message, orderId, orderStatus);
        messagingTemplate.convertAndSend(destination, notification);
    }
}
