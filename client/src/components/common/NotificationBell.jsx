import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationClient from '../../services/notificationClient';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Connect to notification service
    notificationClient.connect()
      .then(() => {
        setIsConnected(true);
        console.log('Notification service connected');
      })
      .catch(error => {
        console.error('Failed to connect to notification service:', error);
      });

    // Add notification listener
    const handleNotification = (notification) => {
      console.log('Received notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
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

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClearAll = () => {
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
                      {notification.actionLabel && (
                        <span className="notification-action">{notification.actionLabel} →</span>
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
