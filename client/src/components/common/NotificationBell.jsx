import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationClient from '../../services/notificationClient';
import { notificationService } from '../../services/admin/notificationService';
import { dispatchNotificationService } from '../../services/dispatch/dispatchNotificationService';
import { authService } from '../../services';
import './NotificationBell.css';

const NotificationBell = () => {
  const [realTimeNotifications, setRealTimeNotifications] = useState([]);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Determine user role and appropriate service
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUserRole(currentUser.role);
    }
  }, []);

  const getNotificationServiceForRole = (role) => {
    return role === 'DISPATCHER' ? dispatchNotificationService : notificationService;
  };

  // Load database notifications on mount
  const loadDbNotifications = useCallback(async (roleOverride) => {
    const roleToUse = roleOverride || userRole;
    if (!roleToUse) return; // Wait for role to be determined
    
    try {
      console.log('[NotificationBell] loading DB notifications for role:', roleToUse);
      const service = getNotificationServiceForRole(roleToUse);
      const [allNotifications, count] = await Promise.all([
        service.getAllNotifications(0, 10),
        service.getUnreadCount()
      ]);

      console.log('[NotificationBell] DB notifications loaded:', allNotifications?.length || 0);

      setDbNotifications(allNotifications.map(n => ({
        ...n,
        id: `db-${n.notificationId}`,
        timestamp: n.createdAt,
        actionText: n.actionText,
        source: 'database'
      })));

      return count.unreadCount;
    } catch (error) {
      console.error('Failed to load database notifications:', error);
      return 0;
    }
  }, [userRole]);

  useEffect(() => {
    const onUserUpdated = (e) => {
      const nextUser = e?.detail || authService.getCurrentUser();
      const nextRole = nextUser?.role || null;
      setUserRole(nextRole);
      setRealTimeNotifications([]);
      setDbNotifications([]);
      setNotifications([]);
      setUnreadCount(0);

      if (nextRole) {
        loadDbNotifications(nextRole);
      }
    };

    window.addEventListener('userUpdated', onUserUpdated);
    return () => window.removeEventListener('userUpdated', onUserUpdated);
  }, [loadDbNotifications]);

  // Get appropriate notification service based on role
  const getNotificationService = useCallback(() => {
    return userRole === 'DISPATCHER' ? dispatchNotificationService : notificationService;
  }, [userRole]);

  // Get appropriate WebSocket topic based on role
  const getWebSocketTopic = useCallback(() => {
    return userRole === 'DISPATCHER' ? '/topic/dispatcher/notifications' : '/topic/admin/notifications';
  }, [userRole]);

  // Get appropriate navigation path based on role
  const getNotificationsPath = useCallback(() => {
    return userRole === 'DISPATCHER' ? '/dispatch/notifications' : '/admin/notifications';
  }, [userRole]);

  // Merge notifications selectively (show recent ones)
  useEffect(() => {
    const recentDb = dbNotifications.slice(0, 5); // Show only 5 most recent DB notifications
    const combined = [...realTimeNotifications, ...recentDb];

    // Sort by timestamp (newest first)
    combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setNotifications(combined);

    // Calculate unread count from both sources
    const unreadRealTime = realTimeNotifications.filter(n => !n.isRead).length;
    const unreadDb = dbNotifications.filter(n => !n.isRead).length;
    setUnreadCount(unreadRealTime + unreadDb);
  }, [realTimeNotifications, dbNotifications]);

  useEffect(() => {
    // Connect to notification service ONCE (do not re-run on role changes)
    notificationClient.connect()
      .then(() => {
        setIsConnected(true);
        console.log('Notification service connected');
      })
      .catch(error => {
        console.error('Failed to connect to notification service:', error);
      });

    // Add notification listener for real-time notifications
    const handleNotification = (notification) => {
      console.log('Received real-time notification:', notification);
      const enhancedNotification = {
        ...notification,
        id: `rt-${Date.now()}`, // Add unique ID for real-time notifications
        timestamp: new Date().toISOString(),
        source: 'websocket',
        // Map actionLabel from WebSocket to actionText for consistency
        actionText: notification.actionLabel
      };

      setRealTimeNotifications(prev => [enhancedNotification, ...prev]);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/images/logo/logo.png',
          tag: notification.id
        });
      }
    };

    notificationClient.addListener(handleNotification);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      notificationClient.removeListener(handleNotification);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Load DB notifications whenever role becomes available/changes (covers relogin)
    loadDbNotifications();
  }, [loadDbNotifications]);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark database notifications as read via API
      if (notification.source === 'database' && !notification.isRead) {
        const service = getNotificationService();
        await service.markAsRead(notification.notificationId);
      }

      // Update local state for all notifications
      if (notification.source === 'database') {
        setDbNotifications(prev =>
          prev.map(n => n.notificationId === notification.notificationId ? { ...n, isRead: true } : n)
        );
      } else {
        setRealTimeNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Mark all database notifications as read via API
      const dbNotificationIds = dbNotifications
        .filter(n => !n.isRead)
        .map(n => n.notificationId);

      if (dbNotificationIds.length > 0) {
        const service = getNotificationService();
        await service.markMultipleAsRead(dbNotificationIds);
      }

      // Mark all read locally
      setDbNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setRealTimeNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleClearAll = () => {
    setRealTimeNotifications([]);
    setDbNotifications([]);
    setNotifications([]);
    setUnreadCount(0);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '🔴';
      case 'WARNING': return '⚠️';
      case 'INFO': return 'ℹ️';
      default: return '📢';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#dc2626';
      case 'WARNING': return '#f59e0b';
      case 'INFO': return '#3b82f6';
      default: return '#6366f1';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
        {isConnected && <span className="connection-indicator"></span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate(getNotificationsPath());
                  }}
                  className="action-btn"
                  title="View all"
                >
                  🔍
                </button>
              )}
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="action-btn" title="Mark all read">
                  ✓
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearAll} className="action-btn" title="Clear all">
                  🗑️
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="empty-icon">🔕</div>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className="notification-severity-indicator"
                    style={{ backgroundColor: getSeverityColor(notification.severity) }}
                  ></div>
                  <div className="notification-content">
                    <div className="notification-title">
                      <span className="severity-icon">{getSeverityIcon(notification.severity)}</span>
                      {notification.title}
                    </div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-footer">
                      <span className="notification-time">{formatTimestamp(notification.timestamp)}</span>
                      {notification.actionText && (
                        <span className="notification-action">{notification.actionText} →</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
