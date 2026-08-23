import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationClient from '../../services/notificationClient';
import { notificationService } from '../../services/admin/notificationService';
import { dispatchNotificationService } from '../../services/dispatch/dispatchNotificationService';
import authService from '../../services/auth/authService';
import { LuBell, LuCheck, LuTrash2, LuExternalLink, LuTriangleAlert, LuInfo } from 'react-icons/lu';

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

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUserRole(currentUser.role);
    }
  }, []);

  const getNotificationServiceForRole = (role) => {
    return role === 'DISPATCHER' ? dispatchNotificationService : notificationService;
  };

  const loadDbNotifications = useCallback(async (roleOverride) => {
    const roleToUse = roleOverride || userRole;
    if (!roleToUse) return;

    try {
      const service = getNotificationServiceForRole(roleToUse);
      const [allNotifications, count] = await Promise.all([
        service.getAllNotifications(0, 10),
        service.getUnreadCount()
      ]);

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

  const getNotificationService = useCallback(() => {
    return userRole === 'DISPATCHER' ? dispatchNotificationService : notificationService;
  }, [userRole]);

  const getNotificationsPath = useCallback(() => {
    return userRole === 'DISPATCHER' ? '/dispatch/notifications' : '/admin/notifications';
  }, [userRole]);

  useEffect(() => {
    const recentDb = dbNotifications.slice(0, 6);
    const combined = [...realTimeNotifications, ...recentDb];
    combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setNotifications(combined);
    const unreadRealTime = realTimeNotifications.filter(n => !n.isRead).length;
    const unreadDb = dbNotifications.filter(n => !n.isRead).length;
    setUnreadCount(unreadRealTime + unreadDb);
  }, [realTimeNotifications, dbNotifications]);

  useEffect(() => {
    notificationClient.connect()
      .then(() => {
        setIsConnected(true);
      })
      .catch(error => {
        console.error('Failed to connect to notification service:', error);
      });

    const handleNotification = (notification) => {
      const enhancedNotification = {
        ...notification,
        id: `rt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'websocket',
        actionText: notification.actionLabel
      };

      setRealTimeNotifications(prev => [enhancedNotification, ...prev]);

      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logiflow-smarter_logistics-seamless_flow.png',
          tag: notification.id
        });
      }
    };

    notificationClient.addListener(handleNotification);

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

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
    loadDbNotifications();
  }, [loadDbNotifications]);

  const handleNotificationClick = async (notification) => {
    try {
      if (notification.source === 'database' && !notification.isRead) {
        const service = getNotificationService();
        await service.markAsRead(notification.notificationId);
      }

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

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const dbNotificationIds = dbNotifications
        .filter(n => !n.isRead)
        .map(n => n.notificationId);

      if (dbNotificationIds.length > 0) {
        const service = getNotificationService();
        await service.markMultipleAsRead(dbNotificationIds);
      }

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
      case 'CRITICAL': return <LuTriangleAlert size={15} color="var(--color-danger-600)" />;
      case 'WARNING': return <LuTriangleAlert size={15} color="var(--color-warning-600)" />;
      default: return <LuInfo size={15} color="var(--color-brand-600)" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
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
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          backgroundColor: isOpen ? 'var(--color-slate-100)' : 'var(--color-white)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
      >
        <LuBell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-danger-600)',
              color: 'var(--color-white)',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-white)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isConnected && (
          <span
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-600)',
            }}
            title="Real-time connected"
          />
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxHeight: '480px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-dropdown)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn var(--transition-fast) ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-surface-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-brand-100)',
                    color: 'var(--color-brand-700)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all read"
                  style={{
                    padding: '4px',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <LuCheck size={15} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  title="Clear all"
                  style={{
                    padding: '4px',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <LuTrash2 size={15} />
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(getNotificationsPath());
                }}
                title="View full notification center"
                style={{
                  padding: '4px',
                  color: 'var(--color-brand-600)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <LuExternalLink size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <LuBell size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: 'var(--text-xs)', margin: 0 }}>No notifications at this time</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: !n.isRead ? 'var(--color-brand-50)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    transition: 'background-color var(--transition-fast)',
                  }}
                >
                  <span style={{ marginTop: '2px', flexShrink: 0 }}>
                    {getSeverityIcon(n.severity)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: !n.isRead ? 700 : 600, color: 'var(--text-primary)' }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatTimestamp(n.timestamp)}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0', lineHeight: 1.35 }}>
                      {n.message}
                    </p>
                    {n.actionText && (
                      <span style={{ fontSize: '11px', color: 'var(--color-brand-600)', fontWeight: 600, marginTop: '4px', display: 'inline-block' }}>
                        {n.actionText} →
                      </span>
                    )}
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
