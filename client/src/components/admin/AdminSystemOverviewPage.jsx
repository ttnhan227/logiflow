import React, { useState, useEffect } from 'react';
import settingsService from '../../services/admin/settingsService';
import {
  Button,
  Card,
  StatCard,
  Input,
  Select,
  Textarea,
  Badge,
  Modal,
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
  LuServer,
  LuCpu,
  LuHardDrive,
  LuDatabase,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuLock,
  LuLockOpen,
} from 'react-icons/lu';

const PAGE_SIZE = 10;

const emptyForm = {
  category: '',
  key: '',
  value: '',
  isEncrypted: false,
  description: '',
};

export const AdminSystemOverviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    systemUptime: '',
    activeAlerts: 0,
    systemVersion: '',
    systemHealth: {},
  });

  const [settings, setSettings] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [settingsError, setSettingsError] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [filters, setFilters] = useState({ category: '', key: '', description: '', isEncrypted: '' });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await settingsService.getAvailableCategories();
        const logisticsCategories = ['compliance', 'routing', 'work-rest', 'notifications'];
        setCategories([...new Set([...(data || []), ...logisticsCategories])]);
      } catch {
        setCategories(['compliance', 'routing', 'work-rest', 'notifications', 'integration', 'security']);
      }
    };
    fetchCategories();
  }, []);

  const fetchSettings = async (pageNum = 0, filterObj = filters) => {
    setSettingsLoading(true);
    try {
      const hasFilters = filterObj.category || filterObj.key || filterObj.description || filterObj.isEncrypted;
      let data;
      if (hasFilters) {
        data = await settingsService.advancedSearch(
          filterObj.category || null,
          filterObj.key || null,
          filterObj.description || null,
          filterObj.isEncrypted ? filterObj.isEncrypted === 'true' : null,
          pageNum,
          PAGE_SIZE
        );
      } else {
        data = await settingsService.getSettings(pageNum, PAGE_SIZE);
      }
      setSettings(data.content || []);
      setTotalElements(data.totalElements || 0);
      setPage(data.number || 0);
    } catch {
      setSettingsError('Failed to query configuration settings registry.');
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings(0, filters);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await settingsService.getSystemOverview();
        setDashboardData(data);
        setError(null);
      } catch {
        setError('Failed to query infrastructure telemetry.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleEdit = (setting) => {
    setEditingId(setting.settingId);
    setForm({
      category: setting.category,
      key: setting.key,
      value: setting.value === '***ENCRYPTED***' ? '' : setting.value,
      isEncrypted: setting.isEncrypted,
      description: setting.description || '',
    });
    setSettingsError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this system configuration parameter?')) return;
    try {
      await settingsService.deleteSetting(id);
      await fetchSettings(page, filters);
    } catch {
      setSettingsError('Failed to remove configuration setting.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSubmitting(true);
    try {
      if (editingId) {
        await settingsService.updateSetting({ settingId: editingId, ...form });
      } else {
        await settingsService.createSetting(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowModal(false);
      await fetchSettings(page, filters);
    } catch {
      setSettingsError('Failed to save setting. Ensure required parameters are provided.');
    } finally {
      setSubmitting(false);
    }
  };

  const { systemUptime, activeAlerts, systemVersion, systemHealth = {} } = dashboardData;

  if (loading) {
    return <LoadingSpinner fullPage text="Scanning enterprise platform telemetry..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Platform Telemetry & System Configuration"
        description="Monitor cloud container telemetry, database connections, and configure enterprise logistics business rules."
        badge={<Badge variant="brand">Platform Architecture</Badge>}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowModal(true);
            }}
            leftIcon={<LuPlus size={16} />}
          >
            Add Config Parameter
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Top 4 KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Cluster Uptime"
          value={systemUptime || '99.98%'}
          icon={<LuServer size={20} />}
          description={`Release: ${systemVersion || 'v2.4.0'}`}
        />
        <StatCard
          title="CPU Compute Load"
          value={`${systemHealth.cpuUsage || 18}%`}
          icon={<LuCpu size={20} />}
          description="Avg cluster workload"
        />
        <StatCard
          title="JVM Memory Utilization"
          value={`${systemHealth.usedMemoryMB || 512} MB`}
          icon={<LuHardDrive size={20} />}
          description={`Cap: ${systemHealth.maxMemoryMB || 2048} MB`}
        />
        <StatCard
          title="PostgreSQL Cluster"
          value={systemHealth.dbStatus === 'UP' ? 'HEALTHY' : 'DEGRADED'}
          icon={<LuDatabase size={20} />}
          change={systemHealth.dbStatus === 'UP' ? 'Connected' : 'Alert'}
          changeType={systemHealth.dbStatus === 'UP' ? 'positive' : 'negative'}
        />
      </div>

      {/* Settings Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 'var(--text-sm)' }}>Config Parameters Ledger</strong>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Dynamic routing, SLA thresholds, API secrets, and dispatch rule sets.
            </div>
          </div>
        </div>

        {settingsLoading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Retrieving configuration registry..." />
          </div>
        ) : settings.length === 0 ? (
          <EmptyState
            icon={<LuServer size={36} color="var(--color-slate-400)" />}
            title="No settings found"
            description="Add your first enterprise environment parameter."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Configuration Key</TableHead>
                <TableHead>Resolved Value</TableHead>
                <TableHead>Encryption</TableHead>
                <TableHead>Documentation</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((s) => (
                <TableRow key={s.settingId}>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {s.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-brand-700)' }}>
                      {s.key}
                    </code>
                  </TableCell>
                  <TableCell style={{ fontSize: '11px' }}>
                    {s.value?.length > 40 ? s.value.slice(0, 40) + '...' : s.value}
                  </TableCell>
                  <TableCell>
                    {s.isEncrypted ? (
                      <Badge variant="success" size="sm">
                        <LuLock size={12} /> Encrypted
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Plaintext
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {s.description || '—'}
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(s)} title="Edit Parameter">
                        <LuPencil size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.settingId)} title="Delete Parameter">
                        <LuTrash2 size={14} color="var(--color-danger-600)" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Settings Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingId ? 'Edit Configuration Parameter' : 'Define Configuration Parameter'}
          description="Dynamic properties are instantly propagated across all dispatch and carrier microservices."
        >
          {settingsError && <Alert variant="danger">{settingsError}</Alert>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Category *"
                required
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="e.g. routing, compliance"
              />
              <Input
                label="Property Key *"
                required
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                placeholder="e.g. max_driver_duty_hours"
              />
            </div>

            <Input
              label="Config Value *"
              required
              value={form.value}
              onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              placeholder="e.g. 10.0 or API secret"
            />

            <Textarea
              label="Description & Context"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Explain what this threshold governs..."
              rows={2}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="isEncrypted"
                checked={form.isEncrypted}
                onChange={(e) => setForm((p) => ({ ...p, isEncrypted: e.target.checked }))}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="isEncrypted" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}>
                Store as Encrypted Secret
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                {editingId ? 'Update Property' : 'Save Property'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminSystemOverviewPage;
