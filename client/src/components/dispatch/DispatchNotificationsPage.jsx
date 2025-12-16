import React, { useEffect, useState } from 'react';
import { dispatchNotificationService } from '../../services/dispatch/dispatchNotificationService';

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
  return date.toLocaleString();
};

const DispatchNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await dispatchNotificationService.getAllNotifications(0, 50);
      setNotifications(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await dispatchNotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '🔴';
      case 'WARNING':
        return '⚠️';
      case 'INFO':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0 }}>🔔 Notifications</h1>
          <p style={{ margin: '6px 0 0 0', color: '#6b7280' }}>View all dispatcher notifications</p>
        </div>
        <div>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#2563eb',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {loading && <div>Loading notifications...</div>}
      {error && (
        <div style={{ padding: '10px 12px', background: '#fee2e2', color: '#991b1b', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 700 }}>
            Recent Notifications
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔕</div>
              <div>No notifications yet</div>
            </div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f9fafb' }}>
                    <th style={{ padding: '10px 12px', width: 80 }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Title</th>
                    <th style={{ padding: '10px 12px' }}>Message</th>
                    <th style={{ padding: '10px 12px', width: 140 }}>Type</th>
                    <th style={{ padding: '10px 12px', width: 140 }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr
                      key={n.notificationId}
                      style={{
                        borderTop: '1px solid #e5e7eb',
                        background: n.isRead ? 'white' : '#eff6ff',
                      }}
                    >
                      <td style={{ padding: '10px 12px' }}>{n.isRead ? '✓' : '•'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {getSeverityLabel(n.severity)} {n.title}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{n.message}</td>
                      <td style={{ padding: '10px 12px' }}>{n.notificationType}</td>
                      <td style={{ padding: '10px 12px' }}>{formatTimestamp(n.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DispatchNotificationsPage;
