import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services';
import Pagination from '../common/Pagination';
import {
  Button,
  Card,
  Input,
  Select,
  Badge,
  PageHeader,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui';
import {
  LuSearch,
  LuCloudUpload,
  LuRefreshCw,
  LuPackage,
  LuArrowRight,
  LuZap,
  LuWarehouse,
  LuContainer,
} from 'react-icons/lu';

export const OrdersPage = () => {
  const [ordersResp, setOrdersResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [pickupTypeFilter, setPickupTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders({
        status: statusFilter || undefined,
        page,
        size,
      });
      setOrdersResp(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [statusFilter, pickupTypeFilter, searchTerm]);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page, size]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning" dot>Pending</Badge>;
      case 'ASSIGNED':
        return <Badge variant="brand" dot>Assigned</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="info" dot>In Transit</Badge>;
      case 'DELIVERED':
        return <Badge variant="success" dot>Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" dot>Cancelled</Badge>;
      default:
        return <Badge variant="neutral" dot>{status || 'Unknown'}</Badge>;
    }
  };

  const getPickupBadge = (order) => {
    if (!order.pickupType || order.pickupType === 'STANDARD') {
      return <Badge variant="neutral" size="sm">Standard</Badge>;
    }
    if (order.pickupType === 'PORT_TERMINAL') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Badge variant="warning" size="sm">Port Terminal</Badge>
          {order.containerNumber && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({order.containerNumber})
            </span>
          )}
        </div>
      );
    }
    if (order.pickupType === 'WAREHOUSE') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Badge variant="brand" size="sm">Warehouse</Badge>
          {order.dockInfo && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              (Dock {order.dockInfo})
            </span>
          )}
        </div>
      );
    }
    return <Badge variant="neutral" size="sm">{order.pickupType}</Badge>;
  };

  const filteredOrders = (ordersResp?.orders || [])
    .filter(
      (o) =>
        !searchTerm ||
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerPhone?.includes(searchTerm) ||
        o.orderId?.toString().includes(searchTerm)
    )
    .filter((o) => !pickupTypeFilter || o.pickupType === pickupTypeFilter)
    .sort((a, b) => {
      const aPending = a.orderStatus === 'PENDING' ? 1 : 0;
      const bPending = b.orderStatus === 'PENDING' ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Freight Orders"
        description="Monitor, screen, and assign incoming customer shipping manifests."
        badge={<Badge variant="brand">Dispatch Desk</Badge>}
        actions={
          <Link to="/dispatch/orders/import">
            <Button variant="primary" size="sm" leftIcon={<LuCloudUpload size={16} />}>
              Import Manifest (CSV / Excel)
            </Button>
          </Link>
        }
      />

      {/* Filter Bar */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <Input
              placeholder="Search by customer, phone, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<LuSearch size={16} />}
            />
          </div>

          <div style={{ width: '160px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'ASSIGNED', label: 'Assigned' },
                { value: 'IN_TRANSIT', label: 'In Transit' },
                { value: 'DELIVERED', label: 'Delivered' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>

          <div style={{ width: '160px' }}>
            <Select
              value={pickupTypeFilter}
              onChange={(e) => setPickupTypeFilter(e.target.value)}
              options={[
                { value: '', label: 'All Pickup Types' },
                { value: 'PORT_TERMINAL', label: 'Port Terminal' },
                { value: 'WAREHOUSE', label: 'Warehouse Hub' },
              ]}
            />
          </div>

          <Button variant="outline" size="md" onClick={fetchOrders} loading={loading} leftIcon={<LuRefreshCw size={14} />}>
            Refresh
          </Button>

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            {typeof ordersResp?.totalItems === 'number'
              ? `${ordersResp.totalItems} order${ordersResp.totalItems !== 1 ? 's' : ''}`
              : `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </Card>

      {/* Table Container */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Querying dispatch order database..." />
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={<LuPackage size={36} color="var(--color-slate-400)" />}
            title="No orders found"
            description="Adjust your search filters or import new delivery orders to populate the dispatch queue."
            action={
              <Link to="/dispatch/orders/import">
                <Button variant="outline" size="sm">
                  Import Orders
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '90px' }}>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route Origin / Destination</TableHead>
                  <TableHead>Pickup Type</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Tariff Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell style={{ fontWeight: 700, color: 'var(--color-brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                      #{order.orderId}
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.customerName}</div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.customerPhone}</span>
                    </TableCell>
                    <TableCell style={{ maxWidth: '280px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.pickupAddress}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <LuArrowRight size={11} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.deliveryAddress}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getPickupBadge(order)}</TableCell>
                    <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {order.weightTons ? `${order.weightTons} T` : '—'}
                    </TableCell>
                    <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {order.distanceKm ? `${order.distanceKm.toFixed(1)} km` : '—'}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {order.shippingFee ? `${Number(order.shippingFee).toLocaleString()} VND` : 'Quote Pending'}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                    <TableCell>
                      {order.priorityLevel === 'URGENT' ? (
                        <Badge variant="danger" size="sm">
                          <LuZap size={11} /> URGENT
                        </Badge>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Normal</span>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Link to={`/dispatch/orders/${order.orderId}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
              <Pagination
                page={ordersResp?.currentPage ?? page}
                totalPages={ordersResp?.totalPages ?? 0}
                totalItems={ordersResp?.totalItems}
                pageSize={ordersResp?.pageSize ?? size}
                disabled={loading}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default OrdersPage;
