package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.notification.NotificationDto;
import com.logiflow.server.models.Notification;
import com.logiflow.server.repositories.notification.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {

    private final NotificationRepository notificationRepository;

    public AdminNotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // GET /api/admin/notifications?page=0&size=20 - Get all notifications
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        // IMPORTANT: Admin UI must not see driver-targeted notifications.
        // Use repository filtering rather than returning all rows.
        List<Notification> allAdminNotifications = notificationRepository.findAllForAdmins();

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        int fromIndex = safePage * safeSize;

        List<Notification> pageItems;
        if (fromIndex >= allAdminNotifications.size()) {
            pageItems = new ArrayList<>();
        } else {
            int toIndex = Math.min(fromIndex + safeSize, allAdminNotifications.size());
            pageItems = allAdminNotifications.subList(fromIndex, toIndex);
        }

        List<NotificationDto> notificationDtos = pageItems.stream()
                .map(NotificationDto::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(notificationDtos);
    }

    // GET /api/admin/notifications/unread - Get unread notifications
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications() {
        List<Notification> unreadNotifications = notificationRepository.findUnreadForAdmins();

        List<NotificationDto> notificationDtos = unreadNotifications.stream()
                .map(NotificationDto::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(notificationDtos);
    }

    // GET /api/admin/notifications/count - Get unread count
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Long unreadCount = notificationRepository.countUnreadForAdmins();
        return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
    }

    // POST /api/admin/notifications/{id}/read - Mark notification as read
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification != null && !notification.getIsRead()) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/admin/notifications/read - Mark multiple notifications as read
    @PostMapping("/read")
    public ResponseEntity<Void> markMultipleAsRead(@RequestBody List<Long> notificationIds) {
        if (notificationIds == null || notificationIds.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        notificationRepository.markAsReadForAdmins(notificationIds);
        return ResponseEntity.ok().build();
    }

    // POST /api/admin/notifications/mark-all-read - Mark all notifications as read
    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead() {
        // Get all unread notification IDs for admins
        List<Long> unreadIds = notificationRepository.findUnreadForAdmins().stream()
                .map(Notification::getNotificationId)
                .collect(Collectors.toList());

        if (!unreadIds.isEmpty()) {
            notificationRepository.markAsReadForAdmins(unreadIds);
        }

        return ResponseEntity.ok().build();
    }

    // GET /api/admin/notifications/recent?since=2024-01-01T00:00:00 - Get notifications since timestamp
    @GetMapping("/recent")
    public ResponseEntity<List<NotificationDto>> getRecentNotifications(
            @RequestParam LocalDateTime since) {

        // Filter out driver-targeted notifications
        List<Notification> recentNotifications = notificationRepository.findByCreatedAtAfterOrderByCreatedAtDesc(since)
                .stream()
                .filter(n -> n.getTargetUser() == null
                        || (n.getTargetUser().getRole() != null
                        && n.getTargetUser().getRole().getRoleName() != null
                        && ("ADMIN".equalsIgnoreCase(n.getTargetUser().getRole().getRoleName())
                        || "DISPATCHER".equalsIgnoreCase(n.getTargetUser().getRole().getRoleName()))))
                .collect(Collectors.toList());

        List<NotificationDto> notificationDtos = recentNotifications.stream()
                .map(NotificationDto::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(notificationDtos);
    }

    // GET /api/admin/notifications/types/{type} - Get notifications by type (delay_report, etc.)
    @GetMapping("/types/{type}")
    public ResponseEntity<List<NotificationDto>> getNotificationsByType(
            @PathVariable String type) {

        try {
            Notification.NotificationType notificationType = Notification.NotificationType.valueOf(type.toUpperCase());
            List<Notification> notifications = notificationRepository.findByNotificationTypeOrderByCreatedAtDesc(notificationType)
                    .stream()
                    .filter(n -> n.getTargetUser() == null
                            || (n.getTargetUser().getRole() != null
                            && n.getTargetUser().getRole().getRoleName() != null
                            && ("ADMIN".equalsIgnoreCase(n.getTargetUser().getRole().getRoleName())
                            || "DISPATCHER".equalsIgnoreCase(n.getTargetUser().getRole().getRoleName()))))
                    .collect(Collectors.toList());

            List<NotificationDto> notificationDtos = notifications.stream()
                    .map(NotificationDto::new)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(notificationDtos);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
