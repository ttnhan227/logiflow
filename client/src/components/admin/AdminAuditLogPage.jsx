import React, { useEffect, useState } from 'react';
import auditLogService from '../../services/admin/auditLogService';
import {
  Button,
  Card,
  Input,
  Select,
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
  LuShieldAlert,
  LuSearch,
  LuRefreshCw,
  LuActivity,
} from 'react-icons/lu';

export const AdminAuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ username: '', role: '', action: '', from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [actions, setActions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [rolesData, actionsData] = await Promise.all([
          auditLogService.getAvailableRoles(),
          auditLogService.getAvailableActions(),
        ]);
        setRoles(rolesData || []);
        setActions(actionsData || []);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    fetchOptions();
  }, []);

  const fetchLogs = async (searchFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      Object.entries(searchFilters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const data = await auditLogService.searchLogs(params);
      setLogs(data || []);
    } catch {
      setError('Failed to query system security audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(filters);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    fetchLogs(updatedFilters);
  };

  const handleClearFilters = () => {
    const cleared = { username: '', role: '', action: '', from: '', to: '' };
    setFilters(cleared);
    fetchLogs(cleared);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Enterprise Compliance & Security Audit Logs"
        description="Immutable system-wide ledger of user authentication, route overrides, driver assignment modifications, and tariff events."
        badge={<Badge variant="brand">SOC 2 Audit Trail</Badge>}
        actions={
          <Button variant="outline" size="sm" onClick={() => fetchLogs(filters)} loading={loading} leftIcon={<LuRefreshCw size={14} />}>
            Refresh Ledger
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filter toolbar */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <Input
            name="username"
            value={filters.username}
            onChange={handleInputChange}
            placeholder="Search by operator username..."
          />
          <Select
            name="role"
            value={filters.role}
            onChange={handleInputChange}
            options={[
              { value: '', label: 'All Security Roles' },
              ...roles.map((r) => ({ value: r, label: r })),
            ]}
          />
          <Select
            name="action"
            value={filters.action}
            onChange={handleInputChange}
            options={[
              { value: '', label: 'All Audited Actions' },
              ...actions.map((a) => ({ value: a, label: a })),
            ]}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button variant="outline" size="md" onClick={handleClearFilters} style={{ width: '100%' }}>
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Querying cryptographic audit trail..." />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<LuShieldAlert size={36} color="var(--color-slate-400)" />}
            title="No audit log entries found"
            description="Adjust your search parameters or query another date window."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '180px' }}>Timestamp (UTC)</TableHead>
                <TableHead>Operator Identity</TableHead>
                <TableHead>Security Role</TableHead>
                <TableHead>Audited Operation</TableHead>
                <TableHead>Execution Details</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Security Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.username}</TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {log.role || 'USER'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code style={{ fontSize: '11px', color: 'var(--color-brand-700)', backgroundColor: 'var(--bg-surface-subtle)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                      {log.action}
                    </code>
                  </TableCell>
                  <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.details}</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Badge variant={log.success ? 'success' : 'danger'} size="sm" dot>
                      {log.success ? 'Success' : 'Security Alert'}
                    </Badge>
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

export default AdminAuditLogPage;
