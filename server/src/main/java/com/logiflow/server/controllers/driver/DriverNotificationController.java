package com.logiflow.server.controllers.driver;

import com.logiflow.server.dtos.admin.notification.NotificationDto;
import com.logiflow.server.models.Notification;
import com.logiflow.server.repositories.notification.NotificationRepository;
import com.logiflow.server.repositories.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/driver/me/notifications")
public class DriverNotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public DriverNotificationController(NotificationRepository notificationRepository,
                                        UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // GET /api/driver/me/notifications - all notifications for current driver user
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(Authentication authentication) {
        String username = authentication.getName();
        List<Notification> notifications = notificationRepository.findAllForUser(username);
        List<NotificationDto> dtos = notifications.stream()
                .map(NotificationDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // GET /api/driver/me/notifications/unread - unread notifications
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getMyUnreadNotifications(Authentication authentication) {
        String username = authentication.getName();
        List<Notification> notifications = notificationRepository.findUnreadForUser(username);
        List<NotificationDto> dtos = notifications.stream()
                .map(NotificationDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // GET /api/driver/me/notifications/count - unread count
    @GetMapping("/count")
    public ResponseEntity<?> getMyUnreadCount(Authentication authentication) {
        String username = authentication.getName();
        Long count = notificationRepository.countUnreadForUser(username);
        return ResponseEntity.ok(java.util.Map.of("unreadCount", count));
    }

    // POST /api/driver/me/notifications/{id}/read - mark single notification as read
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication authentication) {
        String username = authentication.getName();
        var userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification == null || notification.getTargetAdminUser() == null ||
            !notification.getTargetAdminUser().getUserId().equals(userOpt.get().getUserId())) {
            return ResponseEntity.notFound().build();
        }

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }

        return ResponseEntity.ok().build();
    }

    // POST /api/driver/me/notifications/mark-all-read - mark all as read
    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        String username = authentication.getName();
        var userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<Notification> notifications = notificationRepository.findUnreadForUser(username);
        if (!notifications.isEmpty()) {
            notifications.forEach(n -> n.setIsRead(true));
            notificationRepository.saveAll(notifications);
        }

        return ResponseEntity.ok().build();
    }
}


