import React, { useState, useEffect } from 'react';
import paymentRequestService from '../../services/admin/paymentRequestService';
import {
  Button,
  Card,
  StatCard,
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
  LuCreditCard,
  LuClock,
  LuCircleCheck,
  LuSend,
  LuEye,
} from 'react-icons/lu';

export const AdminPaymentRequestPage = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [customerDialog, setCustomerDialog] = useState({ open: false, customer: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [banner, setBanner] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await paymentRequestService.getCustomersWithOrders();
      setCustomers(response.data || []);
    } catch (err) {
      setBanner({ text: 'Error loading payment requests: ' + err.message, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await paymentRequestService.getPaymentStatistics();
      setStatistics(response.data);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadStatistics();
  }, []);

  useEffect(() => {
    let filtered = customers;
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.customerName?.toLowerCase().includes(search) ||
          c.customerPhone?.toLowerCase().includes(search)
      );
    }
    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  const handleSendPaymentRequest = async (orderId) => {
    if (!window.confirm(`Issue and dispatch freight tariff invoice for Order #${orderId}?`)) return;
    try {
      await paymentRequestService.sendPaymentRequest(orderId);
      setBanner({ text: `Payment request dispatched successfully for Order #${orderId}.`, variant: 'success' });
      await loadData();
      await loadStatistics();
      setCustomerDialog({ open: false, customer: null });
    } catch (err) {
      setBanner({ text: 'Failed to dispatch payment request: ' + err.message, variant: 'danger' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Freight Tariff Invoicing & Payment Requests"
        description="Monitor delivered linehaul orders, review accounts receivable, and dispatch digital payment requests to shippers."
        badge={<Badge variant="brand">Billing & Settlements</Badge>}
      />

      {banner && (
        <Alert variant={banner.variant} onClose={() => setBanner(null)}>
          {banner.text}
        </Alert>
      )}

      {/* Top 4 KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Settled Paid Orders"
          value={statistics?.paidOrders || 0}
          icon={<LuCircleCheck size={20} />}
          description="Invoices collected"
        />
        <StatCard
          title="Pending Receivables"
          value={statistics?.pendingOrders || 0}
          icon={<LuClock size={20} />}
          description="Awaiting customer settlement"
        />
        <StatCard
          title="Settled Turnover"
          value={`${Number(statistics?.totalAmount || 0).toLocaleString()} VND`}
          icon={<LuCreditCard size={20} />}
          description="Gross tariff turnover"
        />
        <StatCard
          title="Outstanding Balance"
          value={`${Number(statistics?.pendingAmount || 0).toLocaleString()} VND`}
          icon={<LuClock size={20} />}
          description="Unsettled freight charges"
        />
      </div>

      {/* Toolbar */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <Input
              placeholder="Search customer name or phone..."
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

      {/* Customer Roster Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Retrieving customer billing ledgers..." />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<LuCreditCard size={36} color="var(--color-slate-400)" />}
            title="No billing records found"
            description="There are currently no delivered customer orders requiring billing settlement."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipper Entity</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Pending Billing</TableHead>
                <TableHead>Total Invoiced</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c) => (
                <TableRow
                  key={c.customerName}
                  onClick={() => setCustomerDialog({ open: true, customer: c })}
                  style={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.customerName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.customerPhone || 'No phone'}</div>
                  </TableCell>
                  <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{c.totalOrders}</TableCell>
                  <TableCell>
                    <Badge variant={c.pendingOrders > 0 ? 'warning' : 'success'} size="sm" dot>
                      {c.pendingOrders} pending
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {Number(c.totalAmount || 0).toLocaleString()} VND
                  </TableCell>
                  <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: c.pendingAmount > 0 ? 'var(--color-warning-700)' : 'var(--color-success-700)' }}>
                    {Number(c.pendingAmount || 0).toLocaleString()} VND
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Button variant="outline" size="sm" leftIcon={<LuEye size={14} />}>
                      View Invoices
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Customer Invoices Modal */}
      {customerDialog.open && customerDialog.customer && (
        <Modal
          isOpen={customerDialog.open}
          onClose={() => setCustomerDialog({ open: false, customer: null })}
          title={`Invoices • ${customerDialog.customer.customerName}`}
          description={`${customerDialog.customer.pendingOrders} pending orders • ${Number(customerDialog.customer.pendingAmount || 0).toLocaleString()} VND outstanding`}
          maxWidth="850px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Pickup Route</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Shipping Tariff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(customerDialog.customer.orders || []).map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell style={{ fontWeight: 700, color: 'var(--color-brand-700)' }}>
                      #{order.orderId}
                    </TableCell>
                    <TableCell style={{ fontSize: '11px' }}>{order.pickupAddress}</TableCell>
                    <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>{order.weightTons} T</TableCell>
                    <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {Number(order.shippingFee || 0).toLocaleString()} VND
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'} size="sm" dot>
                        {order.paymentStatus || 'PENDING'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      {order.paymentStatus === 'PENDING' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSendPaymentRequest(order.orderId)}
                          leftIcon={<LuSend size={14} />}
                        >
                          Send Invoice
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPaymentRequestPage;
