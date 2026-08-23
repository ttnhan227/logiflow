import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/admin/notificationService';
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
  LuTriangleAlert,
  LuInfo,
} from 'react-icons/lu';

export const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await notificationService.getAllNotifications(0, 50);
      setNotifications(items || []);
    } catch {
      setError('Failed to query administrative alert notifications.');
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

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="danger" size="sm">CRITICAL</Badge>;
      case 'WARNING':
        return <Badge variant="warning" size="sm">WARNING</Badge>;
      default:
        return <Badge variant="info" size="sm">INFO</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Administrative Notifications & Telemetry Feed"
        description="Real-time operational alerts, exception signals, and dispatch escalations across the enterprise network."
        badge={<Badge variant="brand">Notification Feed</Badge>}
        actions={
          notifications.some((n) => !n.isRead) && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} leftIcon={<LuCheckCheck size={16} />}>
              Mark All as Read
            </Button>
          )
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
            <LoadingSpinner text="Retrieving notifications..." />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<LuBell size={36} color="var(--color-slate-400)" />}
            title="All notifications cleared"
            description="You are caught up on all operational alerts."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '40px' }}></TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Notification Subject</TableHead>
                <TableHead>Telemetry Message</TableHead>
                <TableHead>Category</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((n) => (
                <TableRow
                  key={n.notificationId}
                  style={{
                    backgroundColor: n.isRead ? 'transparent' : 'var(--color-brand-50)',
                  }}
                >
                  <TableCell>
                    {!n.isRead && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-brand-600)',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{getSeverityBadge(n.severity)}</TableCell>
                  <TableCell style={{ fontWeight: n.isRead ? 500 : 700, color: 'var(--text-primary)' }}>
                    {n.title}
                  </TableCell>
                  <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{n.message}</TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {n.notificationType}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
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

export default AdminNotificationsPage;
