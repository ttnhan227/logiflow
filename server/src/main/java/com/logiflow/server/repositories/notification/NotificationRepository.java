package com.logiflow.server.repositories.notification;

import com.logiflow.server.models.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Get all notifications for admin users (broadcast + user-specific)
    @Query("SELECT n FROM Notification n LEFT JOIN n.targetUser tu LEFT JOIN tu.role r WHERE tu IS NULL OR r.roleName IN ('ADMIN', 'DISPATCHER') ORDER BY n.createdAt DESC")
    List<Notification> findAllForAdmins();

    // Get unread notifications for admins
    @Query("SELECT n FROM Notification n LEFT JOIN n.targetUser tu LEFT JOIN tu.role r WHERE (tu IS NULL OR r.roleName IN ('ADMIN', 'DISPATCHER')) AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadForAdmins();

    // Get notifications by type
    List<Notification> findByNotificationTypeOrderByCreatedAtDesc(Notification.NotificationType type);

    // Get notifications for specific admin user
    List<Notification> findByTargetUser_UserIdOrderByCreatedAtDesc(Integer userId);

    // Count unread notifications
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.isRead = false AND (n.targetUser IS NULL OR n.targetUser IN (SELECT u FROM User u JOIN u.role r WHERE r.roleName IN ('ADMIN', 'DISPATCHER')))")
    Long countUnreadForAdmins();

    // Find notifications by related entity ID
    List<Notification> findByRelatedEntityIdOrderByCreatedAtDesc(Integer relatedEntityId);

    // Find notifications created after a specific time
    List<Notification> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since);

    // Mark notifications as read for admin users (bulk operation)
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.notificationId IN :ids AND (n.targetUser IS NULL OR n.targetUser IN (SELECT u FROM User u JOIN u.role r WHERE r.roleName IN ('ADMIN', 'DISPATCHER')))")
    void markAsReadForAdmins(@Param("ids") List<Long> notificationIds);

    // Mark single notification as read
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.notificationId = :id AND (n.targetUser IS NULL OR n.targetUser IN (SELECT u FROM User u JOIN u.role r WHERE r.roleName IN ('ADMIN', 'DISPATCHER')))")
    void markAsRead(@Param("id") Long notificationId);

    // ===== Dispatcher-facing queries =====

    // Dispatcher should only see NEW_ORDER broadcasts and dispatcher-targeted notifications
    @Query("SELECT n FROM Notification n LEFT JOIN n.targetUser tu LEFT JOIN tu.role r WHERE n.notificationType = com.logiflow.server.models.Notification$NotificationType.NEW_ORDER AND (tu IS NULL OR r.roleName = 'DISPATCHER') ORDER BY n.createdAt DESC")
    List<Notification> findAllForDispatchers();

    @Query("SELECT n FROM Notification n LEFT JOIN n.targetUser tu LEFT JOIN tu.role r WHERE n.notificationType = com.logiflow.server.models.Notification$NotificationType.NEW_ORDER AND (tu IS NULL OR r.roleName = 'DISPATCHER') AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadForDispatchers();

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.notificationType = com.logiflow.server.models.Notification$NotificationType.NEW_ORDER AND n.isRead = false AND (n.targetUser IS NULL OR n.targetUser IN (SELECT u FROM User u JOIN u.role r WHERE r.roleName = 'DISPATCHER'))")
    Long countUnreadForDispatchers();

    @Query("UPDATE Notification n SET n.isRead = true WHERE n.notificationId IN :ids AND n.notificationType = com.logiflow.server.models.Notification$NotificationType.NEW_ORDER AND (n.targetUser IS NULL OR n.targetUser IN (SELECT u FROM User u JOIN u.role r WHERE r.roleName = 'DISPATCHER'))")
    void markAsReadForDispatchers(@Param("ids") List<Long> notificationIds);

    // ===== Driver-facing queries =====

    // All notifications for a specific user (driver)
    @Query("SELECT n FROM Notification n WHERE n.targetUser.username = :username ORDER BY n.createdAt DESC")
    List<Notification> findAllForUser(@Param("username") String username);

    // Unread notifications for a specific user (driver)
    @Query("SELECT n FROM Notification n WHERE n.targetUser.username = :username AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadForUser(@Param("username") String username);

    // Count unread notifications for a specific user (driver)
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.targetUser.username = :username AND n.isRead = false")
    Long countUnreadForUser(@Param("username") String username);

    // ===== Customer-facing queries =====

    // All notifications for a specific customer user
    @Query("SELECT n FROM Notification n WHERE n.targetUser.username = :username ORDER BY n.createdAt DESC")
    List<Notification> findAllForCustomer(@Param("username") String username);

    // Unread notifications for a specific customer user
    @Query("SELECT n FROM Notification n WHERE n.targetUser.username = :username AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadForCustomer(@Param("username") String username);

    // Count unread notifications for a specific customer user
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.targetUser.username = :username AND n.isRead = false")
    Long countUnreadForCustomer(@Param("username") String username);

    // Mark notifications as read for a specific customer user
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.targetUser.username = :username AND n.notificationId IN :ids")
    void markAsReadForCustomer(@Param("username") String username, @Param("ids") List<Long> notificationIds);

    // Mark all notifications as read for a specific customer user
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.targetUser.username = :username AND n.isRead = false")
    void markAllAsReadForCustomer(@Param("username") String username);
}
