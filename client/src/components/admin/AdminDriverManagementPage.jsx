import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '../../services';
import Pagination from '../common/Pagination';
import {
  Button,
  Card,
  Input,
  Select,
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
  LuTruck,
  LuUser,
  LuPencil,
  LuEye,
  LuCheck,
  LuX,
} from 'react-icons/lu';

export const AdminDriverManagementPage = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [page, setPage] = useState(0);
  const size = 10;

  // Modal Form State
  const [form, setForm] = useState({
    id: null,
    username: '',
    email: '',
    phone: '',
    password: '',
    licenseType: 'STANDARD',
    licenseNumber: '',
    licenseExpiryDate: '',
    licenseIssueDate: '',
    yearsExperience: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getDrivers(0, 1000);
      setDrivers(data.content || []);
      setFilteredDrivers(data.content || []);
    } catch {
      setError('Failed to query registered carrier drivers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    let result = drivers;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.username?.toLowerCase().includes(term) ||
          d.email?.toLowerCase().includes(term) ||
          d.licenseNumber?.toLowerCase().includes(term)
      );
    }
    setFilteredDrivers(result);
    setPage(0);
  }, [searchTerm, drivers]);

  const handleToggleStatus = async (driver) => {
    try {
      await userService.toggleUserStatus(driver.id);
      await loadDrivers();
    } catch {
      setError('Failed to toggle driver access status.');
    }
  };

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setForm({
      id: null,
      username: '',
      email: '',
      phone: '',
      password: '',
      licenseType: 'STANDARD',
      licenseNumber: '',
      licenseExpiryDate: '',
      licenseIssueDate: '',
      yearsExperience: 0,
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (driver) => {
    setEditingDriver(driver);
    setForm({
      id: driver.id,
      username: driver.username || '',
      email: driver.email || '',
      phone: driver.phone || '',
      password: '',
      licenseType: driver.licenseType || 'STANDARD',
      licenseNumber: driver.licenseNumber || '',
      licenseExpiryDate: driver.licenseExpiryDate || '',
      licenseIssueDate: driver.licenseIssueDate || '',
      yearsExperience: driver.yearsExperience || 0,
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
        await userService.createUser({ ...form, roleId: 4 });
      }
      setShowModal(false);
      await loadDrivers();
    } catch (err) {
      setModalError(typeof err === 'string' ? err : err.message || 'Failed to save driver.');
    } finally {
      setSubmitting(false);
    }
  };

  const paginatedDrivers = filteredDrivers.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredDrivers.length / size);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Driver Fleet Personnel"
        description="Verify driver credentials, commercial licenses, active shifts, and enterprise access privileges."
        badge={<Badge variant="brand">Fleet Roster</Badge>}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<LuPlus size={16} />}>
            Add Driver Account
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
              placeholder="Search driver by name, email, or CDL number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<LuSearch size={16} />}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            {filteredDrivers.length} registered carrier{filteredDrivers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Retrieving carrier drivers roster..." />
          </div>
        ) : filteredDrivers.length === 0 ? (
          <EmptyState
            icon={<LuUser size={36} color="var(--color-slate-400)" />}
            title="No drivers found"
            description="Adjust search parameters or add a new driver account to the fleet roster."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Profile</TableHead>
                  <TableHead>License & Class</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Operational Status</TableHead>
                  <TableHead>Health Clearance</TableHead>
                  <TableHead>System Access</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDrivers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.email}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>{d.licenseNumber || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {d.licenseType?.replace('_', ' ') || 'STANDARD'}
                      </div>
                    </TableCell>
                    <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {d.yearsExperience || 0} years
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.status === 'available' ? 'success' : 'neutral'} size="sm" dot>
                        {d.status || 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.healthStatus === 'FIT' ? 'success' : 'neutral'} size="sm">
                        {d.healthStatus || 'Cleared'}
                      </Badge>
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
                        <Link to={`/admin/users/drivers/${d.id}`}>
                          <Button variant="ghost" size="sm" title="View Details">
                            <LuEye size={14} />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(d)} title="Edit Driver">
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
                totalItems={filteredDrivers.length}
                pageSize={size}
                disabled={loading}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </Card>

      {/* Add / Edit Driver Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={form.id ? 'Edit Driver Account' : 'Register New Carrier Driver'}
          description="Update credentials, commercial driving license (CDL), and experience specifications."
        >
          {modalError && <Alert variant="danger">{modalError}</Alert>}

          <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <Input
              label="Full Name *"
              required
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="e.g. Tran Van B"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Email Address *"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="driver@logiflow.vn"
              />
              <Input
                label="Phone Number"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+84 90 123 4567"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Select
                label="License Category *"
                value={form.licenseType}
                onChange={(e) => setForm((p) => ({ ...p, licenseType: e.target.value }))}
                options={[
                  { value: 'STANDARD', label: 'Class C (Standard Heavy)' },
                  { value: 'COMMERCIAL', label: 'Class D (Commercial Carrier)' },
                  { value: 'HEAVY_VEHICLE', label: 'Class FC (Heavy Tractor-Trailer)' },
                ]}
              />
              <Input
                label="License Number *"
                required
                value={form.licenseNumber}
                onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))}
                placeholder="DL12345678"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="License Expiry Date"
                type="date"
                value={form.licenseExpiryDate}
                onChange={(e) => setForm((p) => ({ ...p, licenseExpiryDate: e.target.value }))}
              />
              <Input
                label="Years of Experience"
                type="number"
                min="0"
                max="50"
                value={form.yearsExperience}
                onChange={(e) => setForm((p) => ({ ...p, yearsExperience: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                {form.id ? 'Save Changes' : 'Register Driver'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminDriverManagementPage;
