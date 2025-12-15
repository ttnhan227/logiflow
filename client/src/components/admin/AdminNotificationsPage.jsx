import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/admin/notificationService';
import './admin.css';

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

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await notificationService.getAllNotifications(0, 50);
      setNotifications(items);
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
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'notif-critical';
      case 'WARNING':
        return 'notif-warning';
      case 'INFO':
      default:
        return 'notif-info';
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>🔔 Notifications</h1>
            <p>Review all system and delay-related notifications</p>
          </div>
          <div>
            {notifications.some((n) => !n.isRead) && (
              <button className="btn btn-primary" onClick={handleMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="admin-page-content">
        {loading && <div className="loading-state">Loading notifications...</div>}
        {error && <div className="error-banner">{error}</div>}

        {!loading && !error && (
          <div className="details-card">
            <div className="card-header">
              <h2>Recent Notifications</h2>
            </div>
            <div className="card-content">
              {notifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔕</div>
                  <div>No notifications yet</div>
                </div>
              ) : (
                <div className="admin-table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Type</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.map((n) => (
                        <tr key={n.notificationId} className={n.isRead ? 'notification-read-row' : 'notification-unread-row'}>
                          <td>
                            <span className={`notification-status-dot ${n.isRead ? 'read' : 'unread'}`} />
                          </td>
                          <td>
                            <span className={getSeverityClass(n.severity)}>{n.title}</span>
                          </td>
                          <td>{n.message}</td>
                          <td>{n.notificationType}</td>
                          <td>{formatTimestamp(n.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;


