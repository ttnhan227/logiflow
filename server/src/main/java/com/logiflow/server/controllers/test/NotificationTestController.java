package com.logiflow.server.controllers.test;

import com.logiflow.server.dtos.notification.AdminNotificationDto;
import com.logiflow.server.websocket.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test/notifications")
public class NotificationTestController {
    
    @Autowired
    private NotificationService notificationService;

    /**
     * Send a test notification to all admins
     * GET http://localhost:8080/api/test/notifications/send
     */
    @GetMapping("/send")
    public ResponseEntity<String> sendTestNotification() {
        notificationService.broadcastToAdmins(
            "TEST_NOTIFICATION",
            "INFO",
            "Test Notification",
            "This is a test notification from the system!"
        );
        return ResponseEntity.ok("Test notification sent successfully!");
    }

    /**
     * Send a registration request notification
     * GET http://localhost:8080/api/test/notifications/registration
     */
    @GetMapping("/registration")
    public ResponseEntity<String> sendRegistrationNotification() {
        notificationService.notifyNewRegistrationRequest("testuser123", "DRIVER", 999);
        return ResponseEntity.ok("Registration notification sent!");
    }

    /**
     * Send a compliance alert
     * GET http://localhost:8080/api/test/notifications/compliance
     */
    @GetMapping("/compliance")
    public ResponseEntity<String> sendComplianceAlert() {
        notificationService.notifyComplianceAlert(
            "MAINTENANCE_DUE",
            "WARNING",
            "3 vehicles require maintenance",
            "/admin/vehicles"
        );
        return ResponseEntity.ok("Compliance alert sent!");
    }

    /**
     * Send a critical alert
     * GET http://localhost:8080/api/test/notifications/critical
     */
    @GetMapping("/critical")
    public ResponseEntity<String> sendCriticalAlert() {
        notificationService.notifySystemEvent(
            "System Alert",
            "Database connection issue detected!",
            "CRITICAL"
        );
        return ResponseEntity.ok("Critical alert sent!");
    }

    /**
     * Send a custom notification
     * POST http://localhost:8080/api/test/notifications/custom
     */
    @PostMapping("/custom")
    public ResponseEntity<String> sendCustomNotification(
            @RequestParam String title,
            @RequestParam String message,
            @RequestParam(defaultValue = "INFO") String severity,
            @RequestParam(required = false) String actionUrl,
            @RequestParam(required = false) String actionLabel
    ) {
        AdminNotificationDto notification = AdminNotificationDto.of(
            "CUSTOM_EVENT",
            severity,
            title,
            message,
            actionUrl,
            actionLabel
        );
        notificationService.sendAdminNotification(notification);
        return ResponseEntity.ok("Custom notification sent!");
    }
}
