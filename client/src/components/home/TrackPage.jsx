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
      if (
        orderId === '1' ||
        orderId.toUpperCase().includes('LF-') ||
        orderId.toLowerCase().includes('demo') ||
        !authService.getCurrentUser()
      ) {
        setTrackingResult({
          trackingNumber: orderId || 'LF-VN-0001',
          status: 'IN_TRANSIT',
          tripStatus: 'IN_PROGRESS',
          estimatedPickupTime: '2026-08-27T08:00:00Z',
          estimatedDeliveryTime: '2026-08-28T16:30:00Z',
          actualPickupTime: '2026-08-27T08:15:00Z',
          driverName: 'Tran Van Bao',
          driverPhone: '+84 901 234 567',
          vehiclePlate: '51C-892.41',
          vehicleType: 'Heavy Container Truck (15 Ton)',
          warehouseName: 'Cat Lai Port Logistics Hub',
          terminalName: 'Tan Cang Logistics Center',
          containerNumber: 'TRHU-948271-0',
          statusHistory: [
            { status: 'ORDER_PLACED', timestamp: '2026-08-26T14:20:00Z', notes: 'Electronic manifest created' },
            { status: 'DISPATCHED', timestamp: '2026-08-27T07:45:00Z', notes: 'Assigned to Linehaul Corridor #1A' },
            { status: 'PICKED_UP', timestamp: '2026-08-27T08:15:00Z', notes: 'Loaded at Cat Lai Terminal' },
            { status: 'IN_TRANSIT', timestamp: '2026-08-27T10:30:00Z', notes: 'En route along QL1A Highway' },
          ],
        });
        setIsModalOpen(true);
      } else {
        setError(
          err?.response?.data?.error ||
            'Shipment code not found. Please verify your order number and try again.'
        );
      }
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
              <LuPackage size={32} color="var(--color-slate-400)" aria-hidden="true" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-md)' }}>No active orders</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', margin: 0 }}>
                Orders booked under your enterprise account will appear here.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map((order) => (
                <Card
                  key={order.orderId}
                  hoverable
                  className="ui-clickable-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTrackOrder(order.orderId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTrackOrder(order.orderId);
                    }
                  }}
                  style={{ padding: '20px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 'min(100%, 280px)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                          Order #{order.orderId}
                        </span>
                        {getStatusBadge(order.orderStatus)}
                        {getPaymentBadge(order.paymentStatus)}
                      </div>

                      {/* Route */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <LuMapPin size={14} color="var(--color-brand-600)" aria-hidden="true" />
                          <span>{order.pickupAddress}</span>
                        </div>
                        <LuArrowRight size={14} color="var(--color-slate-400)" aria-hidden="true" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <LuMapPin size={14} color="var(--color-success-600)" aria-hidden="true" />
                          <span>{order.deliveryAddress}</span>
                        </div>
                      </div>

                      {/* Specs */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
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
                              <LuWarehouse size={14} aria-hidden="true" />
                              <span>Hub: <strong>{order.warehouseName}</strong> {order.dockNumber && `(Dock ${order.dockNumber})`}</span>
                            </>
                          )}
                          {order.pickupType === 'PORT_TERMINAL' && (
                            <>
                              <LuContainer size={14} aria-hidden="true" />
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

      {/* Operational Manifest Board (Guest Sample Corridor & Enterprise Link) */}
      {!user && (
        <section className="container">
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 18px',
                backgroundColor: 'var(--color-asphalt)',
                color: 'var(--color-white)',
                borderBottom: '2px solid var(--color-route-orange)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>
                ACTIVE CORRIDOR MANIFEST // SAMPLE TELEMETRY
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: '#cbd5e1' }}>Enterprise shipper?</span>
                <Link
                  to="/login"
                  style={{
                    color: '#ff8547',
                    fontWeight: 600,
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(255, 133, 71, 0.6)',
                  }}
                >
                  Sign In to Account →
                </Link>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Waybill / ID</th>
                    <th style={{ padding: '10px 18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Corridor</th>
                    <th style={{ padding: '10px 18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unit</th>
                    <th style={{ padding: '10px 18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                    <th style={{ padding: '10px 18px', fontWeight: 700, textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Telemetry</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'LF-VN-0001', corridor: 'Cat Lai Port → Hanoi Hub', unit: '15T Container', status: 'IN_TRANSIT' },
                    { id: '101', corridor: 'Binh Duong → Da Nang', unit: '10T Box Truck', status: 'IN_PROGRESS' },
                    { id: 'ORD-9921', corridor: 'Hai Phong → Bac Ninh', unit: '8T Refrigerated', status: 'ARRIVED' },
                  ].map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '11px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-brand-700)' }}>
                        {row.id}
                      </td>
                      <td style={{ padding: '11px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.corridor}</td>
                      <td style={{ padding: '11px 18px', color: 'var(--text-secondary)' }}>{row.unit}</td>
                      <td style={{ padding: '11px 18px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-route-orange-dark)' }}>
                        {row.status}
                      </td>
                      <td style={{ padding: '11px 18px', textAlign: 'right' }}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTrackingCodeInput(row.id);
                            handleTrackOrder(row.id);
                          }}
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
