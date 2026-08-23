import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '../../services';
import Pagination from '../common/Pagination';
import {
  Button,
  Card,
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
  LuSearch,
  LuPlus,
  LuBuilding2,
  LuUser,
  LuPencil,
  LuEye,
} from 'react-icons/lu';

export const AdminCustomerManagementPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [page, setPage] = useState(0);
  const size = 10;

  const [form, setForm] = useState({
    id: null,
    username: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    companyCode: '',
    defaultDeliveryAddress: '',
    preferredPaymentMethod: 'CASH',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getCustomers(0, 1000);
      setCustomers(data.content || []);
      setFilteredCustomers(data.content || []);
    } catch {
      setError('Failed to query registered shipper customer database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    let result = customers;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.username?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.companyName?.toLowerCase().includes(term) ||
          c.companyCode?.toLowerCase().includes(term)
      );
    }
    setFilteredCustomers(result);
    setPage(0);
  }, [searchTerm, customers]);

  const handleToggleStatus = async (customer) => {
    try {
      await userService.toggleUserStatus(customer.id);
      await loadCustomers();
    } catch {
      setError('Failed to toggle customer account status.');
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setForm({
      id: null,
      username: '',
      email: '',
      phone: '',
      password: '',
      companyName: '',
      companyCode: '',
      defaultDeliveryAddress: '',
      preferredPaymentMethod: 'BANK_TRANSFER',
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setForm({
      id: c.id,
      username: c.username || '',
      email: c.email || '',
      phone: c.phone || '',
      password: '',
      companyName: c.companyName || '',
      companyCode: c.companyCode || '',
      defaultDeliveryAddress: c.defaultDeliveryAddress || '',
      preferredPaymentMethod: c.preferredPaymentMethod || 'BANK_TRANSFER',
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
        await userService.createUser({ ...form, roleId: 5 });
      }
      setShowModal(false);
      await loadCustomers();
    } catch (err) {
      setModalError(typeof err === 'string' ? err : err.message || 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const paginatedCustomers = filteredCustomers.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredCustomers.length / size);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Enterprise Shipper Customers"
        description="Manage shipper corporate accounts, freight billing terms, default delivery facilities, and ordering status."
        badge={<Badge variant="brand">Shippers Directory</Badge>}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<LuPlus size={16} />}>
            Add Shipper Account
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
              placeholder="Search by customer name, company, or tax code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<LuSearch size={16} />}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            {filteredCustomers.length} corporate shipper{filteredCustomers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Retrieving customer shippers directory..." />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<LuBuilding2 size={36} color="var(--color-slate-400)" />}
            title="No shippers found"
            description="Adjust search parameters or create a new shipper account."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Profile</TableHead>
                  <TableHead>Company & Code</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Cumulative Spend</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.email}</div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>
                        {c.companyName || <span style={{ color: 'var(--text-muted)' }}>Individual</span>}
                      </div>
                      {c.companyCode && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Code: {c.companyCode}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" size="sm">
                        {c.preferredPaymentMethod?.replace('_', ' ') || 'STANDARD'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {c.totalOrders || 0}
                    </TableCell>
                    <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {Number(c.totalSpent || 0).toLocaleString()} VND
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={c.active ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={() => handleToggleStatus(c)}
                      >
                        {c.active ? (
                          <span style={{ color: 'var(--color-success-700)', fontWeight: 600 }}>Active</span>
                        ) : (
                          <span style={{ color: 'var(--color-danger-700)', fontWeight: 600 }}>Suspended</span>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <Link to={`/admin/users/customers/${c.id}`}>
                          <Button variant="ghost" size="sm" title="View Profile">
                            <LuEye size={14} />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(c)} title="Edit Account">
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
                totalItems={filteredCustomers.length}
                pageSize={size}
                disabled={loading}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </Card>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={form.id ? 'Edit Shipper Account' : 'Register New Enterprise Shipper'}
          description="Maintain billing profile, shipping facilities, and commercial payment methods."
        >
          {modalError && <Alert variant="danger">{modalError}</Alert>}

          <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <Input
              label="Primary Contact Name *"
              required
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="e.g. Nguyen Van C"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Corporate Email *"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="logistics@company.com"
              />
              <Input
                label="Phone Number"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+84 28 3822 1234"
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
              <Input
                label="Company Name"
                value={form.companyName}
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                placeholder="ABC Logistics JSC"
              />
              <Input
                label="Company / Tax Code"
                value={form.companyCode}
                onChange={(e) => setForm((p) => ({ ...p, companyCode: e.target.value }))}
                placeholder="0312345678"
              />
            </div>

            <Textarea
              label="Default Delivery Facility / Warehouse"
              value={form.defaultDeliveryAddress}
              onChange={(e) => setForm((p) => ({ ...p, defaultDeliveryAddress: e.target.value }))}
              placeholder="Warehouse A, Tan Binh Industrial Park, HCMC"
              rows={2}
            />

            <Select
              label="Preferred Billing / Settlement Method"
              value={form.preferredPaymentMethod}
              onChange={(e) => setForm((p) => ({ ...p, preferredPaymentMethod: e.target.value }))}
              options={[
                { value: 'BANK_TRANSFER', label: 'Corporate Bank Transfer (Net 30)' },
                { value: 'CREDIT_CARD', label: 'Commercial Credit Card' },
                { value: 'DIGITAL_WALLET', label: 'Digital Logistics Wallet' },
                { value: 'CASH', label: 'Cash on Delivery (COD)' },
              ]}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                {form.id ? 'Save Changes' : 'Register Customer'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminCustomerManagementPage;
