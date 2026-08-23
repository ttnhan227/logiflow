import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import authService from '../../services/auth/authService';
import customerService from '../../services/customerService';
import { Button, Card, CardContent, Input, Badge, Modal, PageHeader, LoadingSpinner, Alert } from '@/components/ui';
import {
  LuSearch,
  LuPackage,
  LuTruck,
  LuMapPin,
  LuClock,
  LuCircleCheck,
  LuCircleAlert,
  LuPhone,
  LuBuilding2,
  LuCalendar,
  LuCreditCard,
  LuArrowRight,
  LuWarehouse,
  LuContainer,
  LuUser,
} from 'react-icons/lu';

export const TrackPage = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    if (currentUser && currentUser.role === 'CUSTOMER') {
      fetchCustomerOrders();
    }

    const q = searchParams.get('tracking');
    if (q) {
      setTrackingCodeInput(q);
      handleTrackOrder(q);
    }
  }, [searchParams]);

  const fetchCustomerOrders = async () => {
    setLoading(true);
    try {
      const data = await customerService.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setError('Unable to load customer order roster.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackingCodeInput.trim()) {
      handleTrackOrder(trackingCodeInput.trim());
    }
  };

  const handleTrackOrder = async (orderId) => {
    setLoading(true);
    setError('');
    setTrackingResult(null);

    try {
      const data = await customerService.trackOrder(orderId);
      setTrackingResult({
        trackingNumber: data.orderId,
        status: data.orderStatus,
        tripStatus: data.tripStatus,
        estimatedPickupTime: data.estimatedPickupTime,
        estimatedDeliveryTime: data.estimatedDeliveryTime,
        actualPickupTime: data.actualPickupTime,
        actualDeliveryTime: data.actualDeliveryTime,
        currentLat: data.currentLat,
        currentLng: data.currentLng,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        vehiclePlate: data.vehiclePlate,
        vehicleType: data.vehicleType,
        pickupType: data.pickupType,
        warehouseName: data.warehouseName,
        dockNumber: data.dockNumber,
        terminalName: data.terminalName,
        containerNumber: data.containerNumber,
        statusHistory: Array.isArray(data.statusHistory)
          ? data.statusHistory.map((u) => ({
              status: u.status,
              timestamp: u.timestamp,
              notes: u.notes,
            }))
          : [],
      });
      setIsModalOpen(true);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'Shipment code not found. Please verify your order number and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s.includes('DELIVER') || s.includes('COMPLET')) {
      return <Badge variant="success" dot>{status}</Badge>;
    }
    if (s.includes('TRANSIT') || s.includes('PROGRESS') || s.includes('OUT')) {
      return <Badge variant="info" dot>{status}</Badge>;
    }
    if (s.includes('ASSIGN') || s.includes('PLAN')) {
      return <Badge variant="brand" dot>{status}</Badge>;
    }
    if (s.includes('CANCEL') || s.includes('FAIL')) {
      return <Badge variant="danger" dot>{status}</Badge>;
    }
    return <Badge variant="neutral" dot>{status || 'PENDING'}</Badge>;
  };

  const getPaymentBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') return <Badge variant="success">Paid</Badge>;
    if (s === 'PENDING') return <Badge variant="warning">Payment Pending</Badge>;
    if (s === 'FAILED' || s === 'CANCELLED') return <Badge variant="danger">{status}</Badge>;
    return <Badge variant="neutral">{status || 'Unpaid'}</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">GPS Telemetry</Badge>}
          title="Real-Time Shipment Visibility"
          description="Track active freight movements, review estimated arrival windows, driver credentials, and step-by-step milestone logs."
        />
      </div>

      {/* Search Bar Container */}
      <section className="container">
        <Card style={{ padding: '28px', backgroundColor: 'var(--color-white)', border: '1px solid var(--border-default)' }}>
          <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <Input
                placeholder="Enter Order ID or tracking code (e.g. 101, ORD-9921)..."
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value)}
                leftIcon={<LuSearch size={16} />}
              />
            </div>
            <Button type="submit" variant="primary" loading={loading}>
              Track Shipment
            </Button>
          </form>

          {error && (
            <div style={{ marginTop: '16px' }}>
              <Alert variant="danger" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}
        </Card>
      </section>

      {/* Customer Orders Roster (when logged in) */}
      {user && user.role === 'CUSTOMER' && (
        <section className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
              Your Account Orders ({orders.length})
            </h2>
            <Button variant="outline" size="sm" onClick={fetchCustomerOrders} loading={loading}>
              Refresh Orders
            </Button>
          </div>

          {orders.length === 0 && !loading ? (
            <Card style={{ padding: '40px', textAlign: 'center' }}>
              <LuPackage size={32} color="var(--color-slate-400)" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-md)' }}>No active orders</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', margin: 0 }}>
                Orders booked under your enterprise account will appear here.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map((order) => (
                <Card key={order.orderId} hoverable onClick={() => handleTrackOrder(order.orderId)} style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                          Order #{order.orderId}
                        </span>
                        {getStatusBadge(order.orderStatus)}
                        {getPaymentBadge(order.paymentStatus)}
                      </div>

                      {/* Route */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <LuMapPin size={14} color="var(--color-brand-600)" />
                          <span>{order.pickupAddress}</span>
                        </div>
                        <LuArrowRight size={14} color="var(--color-slate-400)" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <LuMapPin size={14} color="var(--color-success-600)" />
                          <span>{order.deliveryAddress}</span>
                        </div>
                      </div>

                      {/* Specs */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        <span>Weight: <strong>{order.weightTons}T</strong></span>
                        {order.distanceKm && <span>Distance: <strong>{order.distanceKm.toFixed(1)} km</strong></span>}
                        {order.packageValue && <span>Declared: <strong>{Number(order.packageValue).toLocaleString()} VND</strong></span>}
                        <span>Created: <strong>{new Date(order.createdAt).toLocaleDateString()}</strong></span>
                      </div>

                      {/* Specialized Pickup Info */}
                      {order.pickupType && order.pickupType !== 'STANDARD' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-xs)', color: 'var(--color-brand-700)', backgroundColor: 'var(--color-brand-50)', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}>
                          {order.pickupType === 'WAREHOUSE' && (
                            <>
                              <LuWarehouse size={14} />
                              <span>Hub: <strong>{order.warehouseName}</strong> {order.dockNumber && `(Dock ${order.dockNumber})`}</span>
                            </>
                          )}
                          {order.pickupType === 'PORT_TERMINAL' && (
                            <>
                              <LuContainer size={14} />
                              <span>Container: <strong>{order.containerNumber}</strong> {order.terminalName && `(${order.terminalName})`}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleTrackOrder(order.orderId); }}>
                      View Telemetry
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Guest Login Hint */}
      {!user && (
        <section className="container">
          <Card style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--bg-surface-subtle)' }}>
            <LuUser size={28} color="var(--color-slate-400)" style={{ margin: '0 auto 8px' }} />
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
              Are you an enterprise customer?
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px auto' }}>
              Sign in to automatically load your company's full shipment manifest and dispatch invoices.
            </p>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Sign In to Account
              </Button>
            </Link>
          </Card>
        </section>
      )}

      {/* In-Depth Tracking Modal */}
      {isModalOpen && trackingResult && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setTrackingResult(null); }}
          title={`Shipment Telemetry: Order #${trackingResult.trackingNumber}`}
          description="Live milestone progress and carrier execution logs"
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Key Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</span>
                <div style={{ marginTop: '4px' }}>{getStatusBadge(trackingResult.status)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Trip State</span>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {trackingResult.tripStatus || 'Planned'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Arrival</span>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand-600)', marginTop: '4px' }}>
                  {trackingResult.estimatedDeliveryTime
                    ? new Date(trackingResult.estimatedDeliveryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                    : 'Pending Routing'}
                </div>
              </div>
            </div>

            {/* Carrier Driver Info */}
            {trackingResult.driverName && (
              <Card style={{ padding: '16px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LuTruck size={15} color="var(--color-brand-600)" />
                  Assigned Driver & Vehicle
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: 'var(--text-xs)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Driver: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{trackingResult.driverName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Phone: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{trackingResult.driverPhone}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Plate: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{trackingResult.vehiclePlate} ({trackingResult.vehicleType})</strong>
                  </div>
                </div>
              </Card>
            )}

            {/* Timeline Milestones */}
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
                Milestone History
              </div>

              {trackingResult.statusHistory.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  Order is initialized and awaiting dispatch linehaul assignment.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '24px' }}>
                  {/* Left continuous line */}
                  <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '7px', width: '2px', backgroundColor: 'var(--border-default)' }} />

                  {trackingResult.statusHistory.map((item, idx) => (
                    <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {/* Timeline dot */}
                      <span
                        style={{
                          position: 'absolute',
                          left: '-24px',
                          top: '3px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: idx === 0 ? 'var(--color-brand-600)' : 'var(--color-slate-300)',
                          border: '2px solid var(--color-white)',
                          boxShadow: 'var(--shadow-xs)',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.status}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.timestamp ? new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                        </span>
                      </div>
                      {item.notes && (
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TrackPage;
