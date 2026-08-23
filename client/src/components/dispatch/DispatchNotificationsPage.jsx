import React, { useEffect, useState } from 'react';
import { dispatchNotificationService } from '../../services/dispatch/dispatchNotificationService';
import {
  Button,
  Card,
  Badge,
  PageHeader,
  Alert,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui';
import {
  LuBell,
  LuCheckCheck,
  LuInfo,
  LuTriangleAlert,
  LuCircleAlert,
  LuClock,
} from 'react-icons/lu';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '—';
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
  return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
};

export const DispatchNotificationsPage = () => {
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
      setError('Failed to load dispatch telemetry notifications.');
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

  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return <Badge variant="danger" size="sm" dot>Critical</Badge>;
      case 'WARNING':
        return <Badge variant="warning" size="sm" dot>Warning</Badge>;
      case 'INFO':
      default:
        return <Badge variant="neutral" size="sm" dot>Info</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Dispatch System Alerts"
        description="Real-time operational alerts, exception notifications, and driver status telemetry feeds."
        badge={<Badge variant="brand">Operational Alerts</Badge>}
        actions={
          notifications.some((n) => !n.isRead) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<LuCheckCheck size={16} />}
            >
              Mark All Read
            </Button>
          ) : null
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Retrieving dispatch notification queue..." />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<LuBell size={36} color="var(--color-slate-400)" />}
            title="All clear"
            description="There are currently no active alerts or exception notifications requiring attention."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '80px' }}>State</TableHead>
                <TableHead style={{ width: '120px' }}>Severity</TableHead>
                <TableHead style={{ width: '220px' }}>Notification Title</TableHead>
                <TableHead>Message Description</TableHead>
                <TableHead style={{ width: '160px' }}>Category</TableHead>
                <TableHead style={{ width: '140px', textAlign: 'right' }}>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((n) => (
                <TableRow
                  key={n.notificationId}
                  style={{
                    backgroundColor: n.isRead ? undefined : 'var(--color-brand-50)',
                  }}
                >
                  <TableCell>
                    {n.isRead ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Read</span>
                    ) : (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-brand-600)', display: 'inline-block' }} />
                    )}
                  </TableCell>
                  <TableCell>{getSeverityBadge(n.severity)}</TableCell>
                  <TableCell style={{ fontWeight: n.isRead ? 500 : 700, color: 'var(--text-primary)' }}>
                    {n.title}
                  </TableCell>
                  <TableCell style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                    {n.message}
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.notificationType}</span>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatTimestamp(n.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default DispatchNotificationsPage;
