import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../../services';
import OrderChatPopup from './OrderChatPopup';
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Textarea,
  Badge,
  PageHeader,
  Alert,
  LoadingSpinner,
} from '@/components/ui';
import {
  LuMapPin,
  LuTruck,
  LuUser,
  LuPhone,
  LuCalendar,
  LuClock,
  LuCreditCard,
  LuPencil,
  LuSave,
  LuArrowLeft,
  LuArrowRight,
  LuContainer,
  LuWarehouse,
  LuZap,
  LuX,
} from 'react-icons/lu';

export const DispatchOrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const o = await orderService.getOrderById(Number(orderId));
      setOrder(o);
    } catch (ex) {
      console.error('Failed to load order', ex);
      setError('Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

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

  const handleEdit = () => {
    setEditMode(true);
    setFormData({
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      pickupAddress: order.pickupAddress || '',
      deliveryAddress: order.deliveryAddress || '',
      packageDetails: order.packageDetails || '',
      packageValue: order.packageValue ?? '',
      priorityLevel: order.priorityLevel || 'NORMAL',
      pickupType: order.pickupType || 'PORT_TERMINAL',
      containerNumber: order.containerNumber || '',
      terminalName: order.terminalName || '',
      warehouseName: order.warehouseName || '',
      dockNumber: order.dockNumber || '',
      weightTons: order.weightTons ?? '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedOrder = await orderService.updateOrder(Number(orderId), formData);
      setOrder(updatedOrder);
      setEditMode(false);
    } catch {
      setError('Failed to update order details.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading order manifest..." />;
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: '48px 16px', maxWidth: '600px' }}>
        <Alert variant="danger">{error || 'Order record not found.'}</Alert>
        <div style={{ marginTop: '16px' }}>
          <Link to="/dispatch/orders">
            <Button variant="outline" leftIcon={<LuArrowLeft size={14} />}>
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={`Order #${order.orderId}`}
        description={`Customer: ${order.customerName} • Created ${new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`}
        badge={getStatusBadge(order.orderStatus)}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            {editMode ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditMode(false)} disabled={saving} leftIcon={<LuX size={14} />}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} loading={saving} leftIcon={<LuSave size={14} />}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Link to="/dispatch/orders">
                  <Button variant="outline" size="sm" leftIcon={<LuArrowLeft size={14} />}>
                    Orders Queue
                  </Button>
                </Link>
                {order.orderStatus === 'PENDING' && (
                  <Button variant="outline" size="sm" onClick={handleEdit} leftIcon={<LuPencil size={14} />}>
                    Edit Order
                  </Button>
                )}
                {order.orderStatus === 'PENDING' && (
                  <Link to={`/dispatch/trips/create?orderId=${order.orderId}`}>
                    <Button variant="primary" size="sm" leftIcon={<LuTruck size={14} />}>
                      Create / Assign Trip
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Main Details Card */}
        <Card style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
              Order Manifest Details
            </h3>
            {order.priorityLevel === 'URGENT' && (
              <Badge variant="danger" size="sm">
                <LuZap size={12} /> URGENT PRIORITY
              </Badge>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Customer Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LuUser size={12} /> Customer Name
                </span>
                {editMode ? (
                  <Input
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                  />
                ) : (
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {order.customerName}
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LuPhone size={12} /> Phone Number
                </span>
                {editMode ? (
                  <Input
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  />
                ) : (
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {order.customerPhone || '—'}
                  </div>
                )}
              </div>
            </div>

            {/* Route */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-brand-600)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LuMapPin size={13} /> Origin Pickup Address
                </span>
                {editMode ? (
                  <Textarea
                    value={formData.pickupAddress}
                    onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                    rows={2}
                  />
                ) : (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 600, marginTop: '4px' }}>
                    {order.pickupAddress}
                  </div>
                )}
              </div>

              <div style={{ height: '1px', backgroundColor: 'var(--border-default)' }} />

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-success-600)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LuMapPin size={13} /> Destination Delivery Address
                </span>
                {editMode ? (
                  <Textarea
                    value={formData.deliveryAddress}
                    onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                    rows={2}
                  />
                ) : (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 600, marginTop: '4px' }}>
                    {order.deliveryAddress}
                  </div>
                )}
              </div>
            </div>

            {/* Cargo Specs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Weight</span>
                {editMode ? (
                  <Input
                    type="number"
                    value={formData.weightTons}
                    onChange={(e) => handleInputChange('weightTons', e.target.value)}
                  />
                ) : (
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: '4px' }}>
                    {order.weightTons ? `${order.weightTons} T` : '—'}
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Distance</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: '4px' }}>
                  {order.distanceKm ? `${order.distanceKm.toFixed(1)} km` : '—'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Shipping Tariff</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-brand-700)', fontVariantNumeric: 'tabular-nums', marginTop: '4px' }}>
                  {order.shippingFee ? `${Number(order.shippingFee).toLocaleString()} VND` : '—'}
                </div>
              </div>
            </div>

            {/* Pickup Specific Details */}
            {order.pickupType && order.pickupType !== 'STANDARD' && (
              <div style={{ padding: '14px', backgroundColor: 'var(--color-brand-50)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-700)', textTransform: 'uppercase' }}>
                  {order.pickupType === 'PORT_TERMINAL' ? 'Seaport Terminal Specs' : 'Warehouse Cross-dock Specs'}
                </span>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {order.pickupType === 'PORT_TERMINAL' && (
                    <>Container: <strong>{order.containerNumber || '—'}</strong> • Terminal: <strong>{order.terminalName || '—'}</strong></>
                  )}
                  {order.pickupType === 'WAREHOUSE' && (
                    <>Warehouse: <strong>{order.warehouseName || '—'}</strong> • Dock: <strong>{order.dockNumber || '—'}</strong></>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Assigned Trip & Timeline Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card style={{ padding: '24px' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
              Trip Allocation
            </h3>

            {order.tripId ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Linehaul Trip</span>
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-brand-700)' }}>
                    Trip #{order.tripId}
                  </div>
                </div>
                <Link to={`/dispatch/trips/${order.tripId}`}>
                  <Button variant="outline" size="sm" rightIcon={<LuArrowRight size={14} />}>
                    View Trip Details
                  </Button>
                </Link>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                This order is currently pending and has not been scheduled into a trip manifest.
              </div>
            )}
          </Card>

          {/* Timeline */}
          {order.tripId && (
            <Card style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
                Fulfillment Milestones
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: 'var(--text-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Pickup:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {order.estimatedPickupTime ? new Date(order.estimatedPickupTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Unscheduled'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Delivery:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Unscheduled'}
                  </strong>
                </div>
                {order.actualDeliveryTime && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success-700)' }}>
                    <span>Actual Delivered:</span>
                    <strong>{new Date(order.actualDeliveryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</strong>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Order Customer Chat */}
      {order.customerId && (
        <OrderChatPopup orderId={order.orderId} customerId={order.customerId} order={order} />
      )}
    </div>
  );
};

export default DispatchOrderDetailPage;
