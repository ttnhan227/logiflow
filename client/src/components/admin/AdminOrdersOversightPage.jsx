import React, { useEffect, useMemo, useState } from 'react';
import { ordersOversightService } from '../../services';
import './admin.css';

const statusOptions = ['ALL', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
const riskOptions = ['ALL', 'ON_TRACK', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'UNKNOWN'];

const statusColor = {
  PENDING: '#e0f2fe',
  ASSIGNED: '#dbeafe',
  IN_TRANSIT: '#fef9c3',
  DELIVERED: '#dcfce7',
  CANCELLED: '#fee2e2',
};

const riskTone = {
  ON_TRACK: { bg: '#ecfdf3', color: '#166534' },
  DUE_SOON: { bg: '#fef9c3', color: '#854d0e' },
  OVERDUE: { bg: '#fee2e2', color: '#991b1b' },
  COMPLETED: { bg: '#e5f5ff', color: '#003d7a' },
  UNKNOWN: { bg: '#e5e7eb', color: '#111827' },
};

const formatTime = (ts) => (ts ? new Date(ts).toLocaleString() : 'N/A');



const RiskTag = ({ risk }) => {
  const tone = riskTone[risk] || riskTone.UNKNOWN;
  return (
    <span className="order-risk-tag" style={{ backgroundColor: tone.bg, color: tone.color }}>
      {risk || 'UNKNOWN'}
    </span>
  );
};

const AdminOrdersOversightPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState(null);
  const [meta, setMeta] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [delayReason, setDelayReason] = useState('');
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const selectedOrder = selectedOrderId ? orders.find(o => o.orderId === selectedOrderId) : null;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items, meta: m } = await ordersOversightService.getOversightOrders({ size: 1000 });
        setOrders(items);
        setMeta(m);
      } catch (err) {
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOverride = async (orderId, targetStatus = 'ASSIGNED') => {
    if (!window.confirm(`Override and set order ${orderId} to ${targetStatus}?`)) return;
    setActingId(orderId);
    try {
      await ordersOversightService.updateOrderStatus(orderId, targetStatus);
      
      // Refresh orders list from backend to get updated data
      const { items } = await ordersOversightService.getOversightOrders({ size: 1000 });
      setOrders(items);
      
      alert(`Order ${orderId} status updated to ${targetStatus}.`);
    } catch (err) {
      alert('Failed to override status.');
    } finally {
      setActingId(null);
    }
  };

  const handleUpdateDelay = async () => {
    if (!delayReason.trim()) {
      alert('Please provide a delay reason.');
      return;
    }
    try {
      setActingId(selectedOrderId);
      const updatedOrder = await ordersOversightService.updateOrderDelay(selectedOrderId, delayReason, delayMinutes);
      
      // Refresh orders list with updated order from backend
      const { items } = await ordersOversightService.getOversightOrders({ size: 1000 });
      setOrders(items);
      
      setDelayReason('');
      setDelayMinutes(30);
      alert('Delay updated successfully.');
    } catch (err) {
      alert('Failed to update delay.');
    } finally {
      setActingId(null);
    }
  };

  const filtered = useMemo(() => {
    const riskOrder = ['OVERDUE', 'DUE_SOON', 'ON_TRACK', 'COMPLETED', 'UNKNOWN'];
    const getRiskPriority = (risk) => {
      if (!risk) return riskOrder.length;
      const idx = riskOrder.indexOf(String(risk).toUpperCase());
      return idx === -1 ? riskOrder.length : idx;
    };

    return orders
      .filter((o) => (statusFilter === 'ALL' ? true : o.status === statusFilter))
      .filter((o) => (riskFilter === 'ALL' ? true : o.risk === riskFilter))
      .filter((o) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
          String(o.orderId || '').toLowerCase().includes(term) ||
          o.customer?.toLowerCase().includes(term) ||
          o.pickup?.city?.toLowerCase().includes(term) ||
          o.dropoff?.city?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        // First sort by risk priority (OVERDUE first)
        const riskPriorityDiff = getRiskPriority(a.risk) - getRiskPriority(b.risk);
        if (riskPriorityDiff !== 0) return riskPriorityDiff;
        // Within same risk level, sort by SLA due time (soonest first)
        const aSla = Date.parse(a.slaDue || 0);
        const bSla = Date.parse(b.slaDue || 0);
        return aSla - bSla;
      });
  }, [orders, riskFilter, search, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, riskFilter, search]);

  const paginatedOrders = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  if (loading) return <div className="card">Loading oversight data...</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="orders-oversight">
      <div className="oversight-header">
        <div>
          <h1>Orders & Trips Oversight</h1>
          <p className="muted">Admin visibility and compliance. Dispatcher console remains separate.</p>
        </div>
        <div className="oversight-filters" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
            <label style={{ marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>Search</label>
            <input
              type="text"
              placeholder="Search order, customer, city"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={{ marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={{ marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>Risk</label>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}>
              {riskOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

        {/* Meta info line removed as it's already shown at the bottom */}

      {filtered.length > 0 ? (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Driver</th>
                  <th>SLA Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((o) => (
                  <tr key={o.orderId}>
                    <td style={{ fontWeight: 600 }}>{o.orderId}</td>
                    <td>{o.customer}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div>{o.pickup?.city} → {o.dropoff?.city}</div>
                        <div className="muted small">{o.pickup?.address.substring(0, 35)}...</div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="order-badge"
                        style={{
                          backgroundColor: statusColor[o.status] || '#f3f4f6',
                          color: '#111827',
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <RiskTag risk={o.risk} />
                    </td>
                    <td>
                      {o.driver ? (
                        <div style={{ fontSize: '13px' }}>
                          <div style={{ fontWeight: 500 }}>{o.driver.name}</div>
                        </div>
                      ) : (
                        <span className="muted">Not assigned yet</span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      <div>{new Date(o.slaDue).toLocaleDateString()}</div>
                      <div className="muted small">{new Date(o.slaDue).toLocaleTimeString()}</div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn"
                          title="View details"
                          onClick={() => setSelectedOrderId(o.orderId)}
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filtered.length)} of{' '}
                {filtered.length} orders
              </div>
              <div className="pagination-controls">
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setPage(page + 1)}
                  disabled={page + 1 >= totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card">No orders match the current filters.</div>
      )}

      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              backgroundColor: '#fff',
              zIndex: 10,
            }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: '4px' }}>Order {selectedOrder.orderId}</h2>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{selectedOrder.customer}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrderId(null);
                  setDelayReason('');
                  setDelayMinutes(30);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Status and Risk */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div className="label">Status</div>
                  <span 
                    className="order-badge"
                    style={{
                      backgroundColor: statusColor[selectedOrder.status] || '#f3f4f6',
                      color: '#111827',
                    }}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <div className="label">Risk</div>
                  <RiskTag risk={selectedOrder.risk} />
                </div>
                <div>
                  <div className="label">Priority</div>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: selectedOrder.priority === 'URGENT' ? '#fee2e2' : '#dbeafe',
                    color: selectedOrder.priority === 'URGENT' ? '#dc2626' : '#2563eb'
                  }}>
                    {selectedOrder.priority || 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* Route */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '12px' }}>📍 Route</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div className="label">Pickup</div>
                    <div style={{ fontWeight: 600 }}>{selectedOrder.pickup?.city}</div>
                    <div className="muted small">{selectedOrder.pickup?.address}</div>
                  </div>
                  <div>
                    <div className="label">Dropoff</div>
                    <div style={{ fontWeight: 600 }}>{selectedOrder.dropoff?.city}</div>
                    <div className="muted small">{selectedOrder.dropoff?.address}</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '12px' }}>⏰ Timeline & Delivery Status</h3>
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  {/* Order Created */}
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>📝</span>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>Order Created</span>
                    </div>
                    <div style={{ marginLeft: '24px', fontSize: '15px', fontWeight: 500 }}>
                      {formatTime(selectedOrder.createdAt)}
                    </div>
                    <div style={{ marginLeft: '24px', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      When the order entered the system
                    </div>
                  </div>

                  {/* SLA Deadline */}
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>⚠️</span>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#dc2626' }}>Delivery Deadline (SLA)</span>
                      {selectedOrder.priority === 'URGENT' && (
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          backgroundColor: '#fee2e2', 
                          color: '#991b1b',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>
                          URGENT - 4hrs
                        </span>
                      )}
                    </div>
                    <div style={{ marginLeft: '24px', fontSize: '15px', fontWeight: 500, color: '#dc2626' }}>
                      {formatTime(selectedOrder.slaDue)}
                    </div>
                    <div style={{ marginLeft: '24px', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      Must deliver by this time to meet SLA
                    </div>
                  </div>

                  {/* Expected Arrival */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>🚚</span>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#059669' }}>Expected Arrival (ETA)</span>
                    </div>
                    <div style={{ marginLeft: '24px', fontSize: '15px', fontWeight: 500, color: '#059669' }}>
                      {formatTime(selectedOrder.eta)}
                    </div>
                    <div style={{ marginLeft: '24px', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      Estimated time of delivery
                    </div>
                  </div>

                  {/* Time Comparison Alert */}
                  {selectedOrder.slaDue && selectedOrder.eta && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      backgroundColor: 
                        new Date(selectedOrder.eta) > new Date(selectedOrder.slaDue) ? '#fee2e2' :
                        new Date(selectedOrder.eta).getTime() === new Date(selectedOrder.slaDue).getTime() ? '#fef3c7' :
                        '#dcfce7',
                      borderRadius: '6px',
                      borderLeft: '4px solid ' + (
                        new Date(selectedOrder.eta) > new Date(selectedOrder.slaDue) ? '#dc2626' :
                        new Date(selectedOrder.eta).getTime() === new Date(selectedOrder.slaDue).getTime() ? '#f59e0b' :
                        '#16a34a'
                      )
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        {new Date(selectedOrder.eta) > new Date(selectedOrder.slaDue) 
                          ? '⚠️ WARNING: ETA is after SLA deadline' 
                          : new Date(selectedOrder.eta).getTime() === new Date(selectedOrder.slaDue).getTime()
                          ? '⚡ TIGHT: ETA equals SLA deadline (no buffer)'
                          : '✅ ON TRACK: ETA is before SLA deadline'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#4b5563' }}>
                        {(() => {
                          const etaDate = new Date(selectedOrder.eta);
                          const slaDate = new Date(selectedOrder.slaDue);
                          const diffMinutes = Math.round((etaDate - slaDate) / 60000);
                          if (diffMinutes > 0) {
                            return `Delivery will be ${diffMinutes} minutes late`;
                          } else if (diffMinutes === 0) {
                            return 'No time buffer - any delay will cause SLA miss';
                          } else {
                            return `${Math.abs(diffMinutes)} minutes buffer before SLA deadline`;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver & Vehicle Assignment */}
              {(selectedOrder.driver || selectedOrder.vehicle) && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '12px' }}>👤 Assignment Details</h3>
                  <div style={{ 
                    backgroundColor: '#f9fafb', 
                    padding: '20px', 
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {/* Driver Section */}
                    {selectedOrder.driver && (
                      <div style={{ 
                        marginBottom: selectedOrder.vehicle ? '20px' : '0',
                        paddingBottom: selectedOrder.vehicle ? '20px' : '0',
                        borderBottom: selectedOrder.vehicle ? '2px solid #e5e7eb' : 'none'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          <span style={{ fontSize: '20px' }}>👨‍✈️</span>
                          <span style={{ fontWeight: 600, fontSize: '15px', color: '#374151' }}>Driver</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginLeft: '28px' }}>
                          <div>
                            <div className="label">Name</div>
                            <div style={{ fontWeight: 600, fontSize: '15px' }}>{selectedOrder.driver.name}</div>
                          </div>
                          {selectedOrder.driver.phone && (
                            <div>
                              <div className="label">Phone</div>
                              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                                📞 {selectedOrder.driver.phone}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {/* Vehicle Section */}
                    {selectedOrder.vehicle && (
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          <span style={{ fontSize: '20px' }}>
                            {(() => {
                              switch (selectedOrder.vehicle.type?.toLowerCase()) {
                                case 'motorbike': return '🏍️';
                                case 'van': return '🚐';
                                case 'truck': return '🚚';
                                case 'container': return '📦';
                                default: return '🚗';
                              }
                            })()}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '15px', color: '#374151' }}>Vehicle</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginLeft: '28px' }}>
                          <div>
                            <div className="label">License Plate</div>
                            <div style={{ 
                              fontFamily: 'monospace',
                              fontSize: '15px',
                              fontWeight: 700,
                              color: '#1f2937',
                              backgroundColor: '#fff',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '2px solid #e5e7eb',
                              display: 'inline-block'
                            }}>
                              {selectedOrder.vehicle.plate}
                            </div>
                          </div>
                          <div>
                            <div className="label">Type</div>
                            <div style={{ 
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: (() => {
                                switch (selectedOrder.vehicle.type?.toLowerCase()) {
                                  case 'motorbike': return '#fef3c7';
                                  case 'van': return '#dbeafe';
                                  case 'truck': return '#ede9fe';
                                  case 'container': return '#d1fae5';
                                  default: return '#f3f4f6';
                                }
                              })(),
                              color: (() => {
                                switch (selectedOrder.vehicle.type?.toLowerCase()) {
                                  case 'motorbike': return '#f59e0b';
                                  case 'van': return '#3b82f6';
                                  case 'truck': return '#8b5cf6';
                                  case 'container': return '#10b981';
                                  default: return '#6b7280';
                                }
                              })()
                            }}>
                              {(() => {
                                switch (selectedOrder.vehicle.type?.toLowerCase()) {
                                  case 'motorbike': return '🏍️ Motorbike';
                                  case 'van': return '🚐 Van';
                                  case 'truck': return '🚚 Truck';
                                  case 'container': return '📦 Container';
                                  default: return selectedOrder.vehicle.type;
                                }
                              })()}
                            </div>
                          </div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <div className="label">Capacity</div>
                            <div style={{ fontSize: '15px' }}>
                              <span style={{ fontWeight: 600, fontSize: '16px' }}>{(selectedOrder.vehicle.capacity / 1000).toFixed(1)}</span> 
                              <span style={{ fontWeight: 600, color: '#6b7280' }}> tons</span>
                              <span style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '8px' }}>
                                ({selectedOrder.vehicle.capacity} kg)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No Assignment */}
                    {!selectedOrder.driver && !selectedOrder.vehicle && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        color: '#9ca3af',
                        fontSize: '14px'
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                        <div>No driver or vehicle assigned yet</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delay Reason */}
              {selectedOrder.delayReason && (
                <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                  <div className="label">Delay Reason</div>
                  <div>{selectedOrder.delayReason}</div>
                </div>
              )}

              {/* Update Delay Section */}
              {!['DELIVERED', 'CANCELLED'].includes(selectedOrder.status) && (
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Update Delay</h3>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                      Delay Reason
                    </label>
                    <textarea
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      placeholder="e.g., Road closure, traffic, vehicle breakdown..."
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        minHeight: '60px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                      Extend SLA By (minutes)
                    </label>
                    <input
                      type="number"
                      value={delayMinutes}
                      onChange={(e) => setDelayMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      min="0"
                      step="15"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    onClick={handleUpdateDelay}
                    disabled={actingId === selectedOrderId || !delayReason.trim()}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: actingId === selectedOrderId || !delayReason.trim() ? 0.5 : 1,
                    }}
                  >
                    {actingId === selectedOrderId ? 'Updating...' : 'Update Delay'}
                  </button>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            {!['DELIVERED', 'CANCELLED'].includes(selectedOrder.status) && (
              <div style={{
                padding: '24px',
                borderTop: '1px solid #e5e7eb',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                <button
                  onClick={() => handleOverride(selectedOrderId, selectedOrder.status === 'PENDING' ? 'ASSIGNED' : 'DELIVERED')}
                  disabled={actingId === selectedOrderId}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: actingId === selectedOrderId ? 0.5 : 1,
                  }}
                >
                  {actingId === selectedOrderId ? 'Processing...' : `Override to ${selectedOrder.status === 'PENDING' ? 'ASSIGNED' : 'DELIVERED'}`}
                </button>
                <button
                  onClick={() => handleOverride(selectedOrderId, 'CANCELLED')}
                  disabled={actingId === selectedOrderId}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: actingId === selectedOrderId ? 0.5 : 1,
                  }}
                >
                  {actingId === selectedOrderId ? 'Processing...' : 'Cancel Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersOversightPage;
