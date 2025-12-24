package com.logiflow.server.websocket;

import com.logiflow.server.dtos.notification.AdminNotificationDto;
import com.logiflow.server.dtos.notification.DispatcherNotificationDto;
import com.logiflow.server.dtos.notification.TripNotificationDto;
import com.logiflow.server.repositories.driver.DriverRepository;
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

    @Autowired
    private DriverRepository driverRepository;

    private String resolveDriverUsername(Integer driverId) {
        if (driverId == null) return null;
        try {
            return driverRepository.findById(driverId)
                    .map(d -> d.getUser() != null ? d.getUser().getUsername() : null)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    // ===== Driver Notifications =====
    public void sendDriverNotification(Integer driverId, String type, String message) {
        String username = resolveDriverUsername(driverId);
        if (username == null || username.isBlank()) {
            return;
        }

        sendDriverNotificationByUsername(username, type, message);
    }

    public void sendDriverNotificationByUsername(String username, String type, String message) {
        String destination = "/topic/driver/" + username;
        TripNotificationDto notification = new TripNotificationDto();
        notification.setType(type);
        notification.setMessage(message);
        messagingTemplate.convertAndSend(destination, notification);
    }

    public void sendTripNotification(Integer driverId, Integer tripId, String type, String message, String tripStatus) {
        String username = resolveDriverUsername(driverId);
        if (username == null || username.isBlank()) {
            return;
        }

        sendTripNotificationByUsername(username, tripId, type, message, tripStatus);
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
        String username = resolveDriverUsername(driverId);
        if (username == null || username.isBlank()) {
            return;
        }

        sendTripNotificationWithDataByUsername(username, notification);
    }

    public void sendTripNotificationWithDataByUsername(String username, TripNotificationDto notification) {
        String destination = "/topic/driver/" + username;
        messagingTemplate.convertAndSend(destination, notification);
    }

    // ===== Dispatcher Notifications =====
    
    /**
     * Send notification to all dispatcher users
     */
    public void sendDispatcherNotification(DispatcherNotificationDto notification) {
        messagingTemplate.convertAndSend("/topic/dispatcher/notifications", notification);
    }

    /**
     * Broadcast with action details to dispatchers and store in database
     */
    public void broadcastToDispatchers(String type, String severity, String title, String message,
                                       String actionUrl, String actionText, Integer relatedEntityId) {
        // Determine NotificationType enum value
        Notification.NotificationType notificationType;
        try {
            notificationType = Notification.NotificationType.valueOf(type);
        } catch (IllegalArgumentException e) {
            notificationType = Notification.NotificationType.SYSTEM_EVENT; // Default fallback
        }

        DispatcherNotificationDto websocketNotification = DispatcherNotificationDto.of(
            type, severity, title, message, actionUrl, actionText
        );
        sendDispatcherNotification(websocketNotification);

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

    // ===== Admin Notifications =====
    
    /**
     * Send notification to all admin users
     */
    public void sendAdminNotification(AdminNotificationDto notification) {
        messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
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
     * Send notification about new registration request (websocket + database)
     */
    public void notifyNewRegistrationRequest(String username, String role, Integer requestId) {
        AdminNotificationDto websocketNotification = AdminNotificationDto.of(
            "REGISTRATION_REQUEST",
            "INFO",
            "New Registration Request",
            "New " + role + " registration from: " + username,
            "/admin/registration-requests/" + requestId,
            "Review Request"
        );
        sendAdminNotification(websocketNotification);

        // Store in database for persistence (following driver report pattern)
        Notification dbNotification = new Notification(
            Notification.NotificationType.REGISTRATION_REQUEST,
            "INFO",
            "New Registration Request",
            "New " + role + " registration from: " + username,
            "/admin/registration-requests/" + requestId,
            "Review Request",
            requestId,  // relatedEntityId = requestId
            null        // targetAdminUser (broadcast to all admins)
        );
        notificationRepository.save(dbNotification);
    }

    /**
     * Send compliance alert notification (websocket + database)
     */
    public void notifyComplianceAlert(String alertType, String severity, String message, String actionUrl) {
        AdminNotificationDto websocketNotification = AdminNotificationDto.of(
            "COMPLIANCE_ALERT",
            severity,
            "Compliance Alert",
            message,
            actionUrl,
            "View Details"
        );
        sendAdminNotification(websocketNotification);

        // Store in database for persistence
        Notification dbNotification = new Notification(
            Notification.NotificationType.COMPLIANCE_ALERT,
            severity,
            "Compliance Alert",
            message,
            actionUrl,
            "View Details",
            null,  // relatedEntityId
            null   // targetAdminUser (broadcast to all)
        );
        notificationRepository.save(dbNotification);
    }

    /**
     * Send system event notification (websocket + database)
     */
    public void notifySystemEvent(String title, String message, String severity) {
        AdminNotificationDto websocketNotification = AdminNotificationDto.of(
            "SYSTEM_EVENT",
            severity,
            title,
            message,
            "/admin/dashboard",
            "View Dashboard"
        );
        sendAdminNotification(websocketNotification);

        // Store in database for persistence
        Notification dbNotification = new Notification(
            Notification.NotificationType.SYSTEM_EVENT,
            severity,
            title,
            message,
            "/admin/dashboard",
            "View Dashboard",
            null,  // relatedEntityId
            null   // targetAdminUser (broadcast to all)
        );
        notificationRepository.save(dbNotification);
    }

    /**
     * Send notification about new order to all dispatchers
     */
    public void notifyNewOrder(Integer orderId, String customerName, String priority) {
        DispatcherNotificationDto notification = DispatcherNotificationDto.of(
            "NEW_ORDER",
            "URGENT".equalsIgnoreCase(priority) ? "WARNING" : "INFO",
            "New Order Received",
            "New " + priority + " order from " + customerName,
            "/dispatch/orders/" + orderId,
            "View Order"
        );
        sendDispatcherNotification(notification);

        // Store in database for persistence
        Notification dbNotification = new Notification(
            Notification.NotificationType.NEW_ORDER,
            "URGENT".equalsIgnoreCase(priority) ? "WARNING" : "INFO",
            "New Order Received",
            "New " + priority + " order from " + customerName,
            "/dispatch/orders/" + orderId,
            "View Order",
            orderId,
            null // targetAdminUser (broadcast to all)
        );
        notificationRepository.save(dbNotification);
    }

    public void sendOrderNotification(Integer customerId, Integer orderId, String type, String message, String orderStatus) {
        String destination = "/topic/customer/" + customerId;
        TripNotificationDto notification = new TripNotificationDto(type, message, orderId, orderStatus);
        messagingTemplate.convertAndSend(destination, notification);
    }

    /**
     * Send order delivery notification to customer (websocket + database)
     */
    public void notifyOrderDelivered(Integer customerId, Integer orderId, String customerName, String deliveryAddress) {
        // Send websocket notification to customer
        sendOrderNotification(customerId, orderId, "ORDER_DELIVERED", 
            "Your order #" + orderId + " has been delivered to " + deliveryAddress, 
            "DELIVERED");

        // Store in database for persistence
        User customer = userRepository.findById(customerId).orElse(null);
        if (customer != null) {
            Notification dbNotification = new Notification(
                Notification.NotificationType.ORDER_DELIVERED,
                "INFO",
                "Order Delivered",
                "Your order #" + orderId + " has been successfully delivered to " + deliveryAddress,
                "/customer/orders/" + orderId,
                "View Order",
                orderId,
                customer
            );
            notificationRepository.save(dbNotification);
        }
    }
}
