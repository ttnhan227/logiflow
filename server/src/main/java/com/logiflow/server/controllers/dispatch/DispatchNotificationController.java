package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.admin.notification.NotificationDto;
import com.logiflow.server.models.Notification;
import com.logiflow.server.repositories.notification.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dispatch/notifications")
public class DispatchNotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    // GET /api/dispatch/notifications?page=0&size=20 - Get all notifications
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        // Dispatcher should only see dispatcher notifications (NEW_ORDER)
        List<Notification> allDispatcherNotifications = notificationRepository.findAllForDispatchers();

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        int fromIndex = safePage * safeSize;

        List<Notification> pageItems;
        if (fromIndex >= allDispatcherNotifications.size()) {
            pageItems = new ArrayList<>();
        } else {
            int toIndex = Math.min(fromIndex + safeSize, allDispatcherNotifications.size());
            pageItems = allDispatcherNotifications.subList(fromIndex, toIndex);
        }

        List<NotificationDto> notificationDtos = pageItems.stream()
                .map(NotificationDto::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(notificationDtos);
    }

    // GET /api/dispatch/notifications/unread - Get unread notifications
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications() {
        List<Notification> unreadNotifications = notificationRepository.findUnreadForDispatchers();

        List<NotificationDto> notificationDtos = unreadNotifications.stream()
                .map(NotificationDto::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(notificationDtos);
    }

    // GET /api/dispatch/notifications/count - Get unread count
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Long unreadCount = notificationRepository.countUnreadForDispatchers();
        return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
    }

    // POST /api/dispatch/notifications/{id}/read - Mark notification as read
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

    // POST /api/dispatch/notifications/read - Mark multiple notifications as read
    @PostMapping("/read")
    public ResponseEntity<Void> markMultipleAsRead(@RequestBody List<Long> notificationIds) {
        if (notificationIds == null || notificationIds.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        notificationRepository.markAsReadForDispatchers(notificationIds);
        return ResponseEntity.ok().build();
    }

    // POST /api/dispatch/notifications/mark-all-read - Mark all notifications as read
    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead() {
        // Get all unread notification IDs for dispatchers
        List<Long> unreadIds = notificationRepository.findUnreadForDispatchers().stream()
                .map(Notification::getNotificationId)
                .collect(Collectors.toList());

        if (!unreadIds.isEmpty()) {
            notificationRepository.markAsReadForDispatchers(unreadIds);
        }

        return ResponseEntity.ok().build();
    }

    // GET /api/dispatch/notifications/recent?since=2024-01-01T00:00:00 - Get notifications since timestamp
    @GetMapping("/recent")
    public ResponseEntity<List<NotificationDto>> getRecentNotifications(
            @RequestParam LocalDateTime since) {

        List<Notification> recentNotifications = notificationRepository.findByCreatedAtAfterOrderByCreatedAtDesc(since)
                .stream()
                .filter(n -> n.getNotificationType() == Notification.NotificationType.NEW_ORDER)
                .collect(Collectors.toList());

        List<NotificationDto> notificationDtos = recentNotifications.stream()
                .map(NotificationDto::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(notificationDtos);
    }

    // GET /api/dispatch/notifications/types/{type} - Get notifications by type (delay_report, etc.)
    @GetMapping("/types/{type}")
    public ResponseEntity<List<NotificationDto>> getNotificationsByType(
            @PathVariable String type) {

        try {
            Notification.NotificationType notificationType = Notification.NotificationType.valueOf(type.toUpperCase());

            // Dispatcher should only query NEW_ORDER type
            if (notificationType != Notification.NotificationType.NEW_ORDER) {
                return ResponseEntity.ok(List.of());
            }

            List<Notification> notifications = notificationRepository.findByNotificationTypeOrderByCreatedAtDesc(notificationType)
                    .stream()
                    .filter(n -> n.getNotificationType() == Notification.NotificationType.NEW_ORDER)
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
