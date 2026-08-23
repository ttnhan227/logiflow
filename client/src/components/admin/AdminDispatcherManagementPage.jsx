import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '../../services';
import Pagination from '../common/Pagination';
import {
  Button,
  Card,
  Input,
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
  LuSearch,
  LuPlus,
  LuUserCheck,
  LuPencil,
  LuEye,
} from 'react-icons/lu';

export const AdminDispatcherManagementPage = () => {
  const navigate = useNavigate();
  const [dispatchers, setDispatchers] = useState([]);
  const [filteredDispatchers, setFilteredDispatchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDispatcher, setEditingDispatcher] = useState(null);
  const [page, setPage] = useState(0);
  const size = 10;

  const [form, setForm] = useState({
    id: null,
    username: '',
    email: '',
    phone: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadDispatchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getDispatchers(0, 1000);
      setDispatchers(data.content || []);
      setFilteredDispatchers(data.content || []);
    } catch {
      setError('Failed to query dispatch operations team personnel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatchers();
  }, []);

  useEffect(() => {
    let result = dispatchers;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.username?.toLowerCase().includes(term) ||
          d.email?.toLowerCase().includes(term)
      );
    }
    setFilteredDispatchers(result);
    setPage(0);
  }, [searchTerm, dispatchers]);

  const handleToggleStatus = async (dispatcher) => {
    try {
      await userService.toggleUserStatus(dispatcher.id);
      await loadDispatchers();
    } catch {
      setError('Failed to toggle dispatcher access status.');
    }
  };

  const handleOpenAdd = () => {
    setEditingDispatcher(null);
    setForm({
      id: null,
      username: '',
      email: '',
      phone: '',
      password: '',
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDispatcher(d);
    setForm({
      id: d.id,
      username: d.username || '',
      email: d.email || '',
      phone: d.phone || '',
      password: '',
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      if (form.id) {
        await userService.updateUser(form);
      } else {
        if (!form.password || form.password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await userService.createUser({ ...form, roleId: 3 });
      }
      setShowModal(false);
      await loadDispatchers();
    } catch (err) {
      setModalError(typeof err === 'string' ? err : err.message || 'Failed to save dispatcher.');
    } finally {
      setSubmitting(false);
    }
  };

  const paginatedDispatchers = filteredDispatchers.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredDispatchers.length / size);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Dispatch Operations Personnel"
        description="Authorize dispatch operators to manage linehaul route planning, cargo consolidation, and driver assignment."
        badge={<Badge variant="brand">Operations Team</Badge>}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<LuPlus size={16} />}>
            Add Dispatcher Account
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Toolbar */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <Input
              placeholder="Search by operator name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<LuSearch size={16} />}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            {filteredDispatchers.length} dispatch operator{filteredDispatchers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Retrieving dispatcher roster..." />
          </div>
        ) : filteredDispatchers.length === 0 ? (
          <EmptyState
            icon={<LuUserCheck size={36} color="var(--color-slate-400)" />}
            title="No dispatchers found"
            description="Adjust search parameters or add a new dispatch operations account."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatcher Profile</TableHead>
                  <TableHead>Email Contact</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Registered Date</TableHead>
                  <TableHead>Access Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDispatchers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {d.id}</div>
                    </TableCell>
                    <TableCell>{d.email}</TableCell>
                    <TableCell>{d.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</TableCell>
                    <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={d.active ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={() => handleToggleStatus(d)}
                      >
                        {d.active ? (
                          <span style={{ color: 'var(--color-success-700)', fontWeight: 600 }}>Active</span>
                        ) : (
                          <span style={{ color: 'var(--color-danger-700)', fontWeight: 600 }}>Suspended</span>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <Link to={`/admin/users/dispatchers/${d.id}`}>
                          <Button variant="ghost" size="sm" title="View Profile">
                            <LuEye size={14} />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(d)} title="Edit Account">
                          <LuPencil size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={filteredDispatchers.length}
                pageSize={size}
                disabled={loading}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </Card>

      {/* Add / Edit Dispatcher Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={form.id ? 'Edit Dispatcher Account' : 'Register Dispatch Operator'}
          description="Grant administrative dispatch control over routes, order consolidation, and carrier assignments."
        >
          {modalError && <Alert variant="danger">{modalError}</Alert>}

          <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <Input
              label="Operator Name *"
              required
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="e.g. Le Van D"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Enterprise Email *"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="dispatch@logiflow.vn"
              />
              <Input
                label="Phone Number"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+84 91 999 8888"
              />
            </div>

            {!form.id && (
              <Input
                label="Initial Password *"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 6 characters"
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                {form.id ? 'Save Changes' : 'Create Dispatcher'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminDispatcherManagementPage;
