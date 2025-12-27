import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, tripService, orderService, dispatchVehicleService, dispatchRouteService} from '../../services';
import RouteMapCard from './RouteMapCard';
import './dispatch.css';
import './modern-dispatch.css';

const TripCreatePage = () => {
    const navigate = useNavigate();
    const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
    const [tripType, setTripType] = useState('delivery');
    const [scheduledDeparture, setScheduledDeparture] = useState('');
    const [scheduledArrival, setScheduledArrival] = useState('');
    const [pendingOrders, setPendingOrders] = useState([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [orderTypeFilter, setOrderTypeFilter] = useState(''); // '', 'PORT_TERMINAL', 'WAREHOUSE'
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

    const toLocalDateTimeInputValue = (date) => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        const yyyy = date.getFullYear();
        const mm = pad(date.getMonth() + 1);
        const dd = pad(date.getDate());
        const hh = pad(date.getHours());
        const min = pad(date.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    };

    const nowMin = useMemo(() => toLocalDateTimeInputValue(new Date()), []);
    const arrivalMin = useMemo(() => {
        if (scheduledDeparture) return scheduledDeparture;
        return nowMin;
    }, [scheduledDeparture, nowMin]);

    useEffect(() => {
        const loadData = async () => {
            setLoadingOrders(true);
            try {
                const [ordersRes, vehiclesRes] = await Promise.all([
                    orderService.getOrders({ status: 'PENDING', page: 0, size: 200 }),
                    dispatchVehicleService.getAllVehicles(),
                ]);
                setPendingOrders(ordersRes?.orders || []);
                setVehicles(vehiclesRes || []);
            } catch (ex) {
                console.error(ex);
                setError(ex?.response?.data?.error || 'Failed to load data');
            } finally {
                setLoadingOrders(false);
            }
        };
        loadData();
    }, []);

    const toggleOrder = (orderId) => {
        setSelectedOrderIds((prev) =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const formatMoney = (amount) => {
        if (amount == null) return '—';
        try {
            return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 });
        } catch (_err) {
            return `${amount} VND`;
        }
    };

    const selectedOrdersData = useMemo(() => {
        const selected = pendingOrders.filter(o => selectedOrderIds.includes(o.orderId));
        if (selected.length === 0) return null;

        // Calculate totals for all selected orders
        const totalDistance = selected.reduce((sum, order) => sum + (order.distanceKm || 0), 0);
        const totalFee = selected.reduce((sum, order) => sum + (order.shippingFee || 0), 0);
        const totalWeightTons = selected.reduce((sum, order) => sum + (order.weightTons || 0), 0); // Keep in tons
        const orderCount = selected.length;

        return {
            orders: selected,
            totalDistance,
            totalFee,
            totalWeightTons,
            orderCount
        };
    }, [selectedOrderIds, pendingOrders]);

    // Calculate validation info
    const validationInfo = useMemo(() => {
        if (!selectedOrdersData?.totalWeightTons || vehicles.length === 0) {
            return { maxCapacityTons: 0, exceedsAllVehicles: false };
        }

        const totalWeight = selectedOrdersData.totalWeightTons;
        const maxCapacityTons = Math.max(...vehicles.map(v => v.capacityTons || 0));
        const exceedsAllVehicles = totalWeight > maxCapacityTons;

        return { maxCapacityTons, exceedsAllVehicles };
    }, [vehicles, selectedOrdersData?.totalWeightTons]);

    // Sort vehicles: Available first (by suitability), then unavailable (by status)
    const sortedVehicles = useMemo(() => {
        if (!selectedOrdersData?.totalWeightTons) {
            // No orders selected - sort by availability then capacity
            return [...vehicles].sort((a, b) => {
                const aAvailable = a.status === 'available';
                const bAvailable = b.status === 'available';

                if (aAvailable !== bAvailable) return bAvailable ? 1 : -1;

                // Within same status, sort by capacity (descending)
                const aCapacity = a.capacityTons || 0;
                const bCapacity = b.capacityTons || 0;
                return bCapacity - aCapacity;
            });
        }

        const totalWeight = selectedOrdersData.totalWeightTons;
        return [...vehicles].sort((a, b) => {
            const aCapacityTons = a.capacityTons || 0;
            const bCapacityTons = b.capacityTons || 0;
            const aAvailable = a.status === 'available';
            const bAvailable = b.status === 'available';
            const aCanHandle = aCapacityTons >= totalWeight && aAvailable;
            const bCanHandle = bCapacityTons >= totalWeight && bAvailable;

            // Available vehicles that can handle weight come first
            if (aCanHandle !== bCanHandle) return bCanHandle ? 1 : -1;

            // Then available vehicles that can't handle weight
            if (aAvailable !== bAvailable) return bAvailable ? 1 : -1;

            // Within same availability + suitability, sort by remaining capacity
            if (aCanHandle && bCanHandle) {
                const aRemaining = aCapacityTons - totalWeight;
                const bRemaining = bCapacityTons - totalWeight;
                return aRemaining - bRemaining;
            }

            // For vehicles that can't handle, sort by how close they are to capacity
            const aDiff = Math.abs(totalWeight - aCapacityTons);
            const bDiff = Math.abs(totalWeight - bCapacityTons);
            return aDiff - bDiff;
        });
    }, [vehicles, selectedOrdersData?.totalWeightTons]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selectedVehicle || !scheduledDeparture || !scheduledArrival || selectedOrderIds.length === 0) {
            setError('Please fill all required fields and select at least one order');
            return;
        }

        // Validate selected orders have pickupType and required dependent fields
        const selectedOrders = pendingOrders.filter(o => selectedOrderIds.includes(o.orderId));
        const invalids = [];
        for (const o of selectedOrders) {
            if (!o.pickupType) {
                invalids.push(`#${o.orderId} missing pickup type`);
                continue;
            }
            if (o.pickupType === 'PORT_TERMINAL' && (!o.containerNumber || !String(o.containerNumber).trim())) {
                invalids.push(`#${o.orderId} requires container number for port pickup`);
            }
        }
        if (invalids.length > 0) {
            setError(`Some orders are incomplete: ${invalids.join('; ')}`);
            return;
        }

        setLoading(true);
        try {
            // Create trip route from selected orders
            const route = await dispatchRouteService.createTripRoute(
                selectedOrderIds,
                `Trip: ${selectedOrderIds.length} orders`
            );

            const payload = {
                vehicleId: Number(selectedVehicle.vehicleId),
                routeId: Number(route.routeId),
                tripType,
                scheduledDeparture: new Date(scheduledDeparture).toISOString(),
                scheduledArrival: new Date(scheduledArrival).toISOString(),
                orderIds: selectedOrderIds,
            };

            const createdTrip = await tripService.createTrip(payload);
            setSuccess('Trip created successfully');
            setTimeout(() => navigate(`/dispatch/trips/${createdTrip.tripId}`), 800);
        } catch (ex) {
            console.error(ex);
            setError(ex?.response?.data?.error || ex?.message || 'Failed to create trip');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modern-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Create Trip</h1>
                    <p className="page-subtitle">Enter trip details and assign orders</p>
                </div>
                <div className="header-actions">
                    <button type="button" onClick={() => navigate('/dispatch/trips')} className="btn-secondary">
                        ← Back to Trips
                    </button>
                </div>
            </div>

            <form className="detail-card" style={{ padding: '1.5rem' }} onSubmit={onSubmit}>
                <div className="card-body" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                    <div className="form-group">
                        <label>Vehicle Selection {selectedOrdersData?.totalWeightTons ? `(Total weight: ${selectedOrdersData.totalWeightTons.toLocaleString()} t)` : ''}</label>

                        {/* Vehicle Cards Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1rem',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            padding: '1rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: '#f9fafb'
                        }}>
                            {sortedVehicles.map(v => {
                                const capacityTons = v.capacityTons || 0;
                                const totalWeight = selectedOrdersData?.totalWeightTons || 0;
                                const isAvailable = v.status === 'available';
                                const canHandleWeight = capacityTons >= totalWeight;
                                const canSelect = isAvailable && canHandleWeight;
                                const remaining = capacityTons - totalWeight;
                                const utilizationPercent = totalWeight > 0 ? (totalWeight / capacityTons) * 100 : 0;

                                // Status styling
                                let statusIcon = '✅';
                                let statusText = 'Available';
                                let statusColor = '#10b981';
                                let cardOpacity = 1;
                                let cardBorder = '2px solid #10b981';

                                if (!isAvailable) {
                                    cardOpacity = 0.6;
                                    cardBorder = '2px solid #9ca3af';
                                    if (v.status === 'maintenance') {
                                        statusIcon = '🔧';
                                        statusText = 'Maintenance';
                                        statusColor = '#f59e0b';
                                    } else if (v.status === 'in_use') {
                                        statusIcon = '🚛';
                                        statusText = 'In Use';
                                        statusColor = '#3b82f6';
                                    } else {
                                        statusIcon = '❌';
                                        statusText = v.status;
                                        statusColor = '#ef4444';
                                    }
                                } else if (!canHandleWeight) {
                                    statusIcon = '⚖️';
                                    statusText = 'Over Capacity';
                                    statusColor = '#ef4444';
                                    cardBorder = '2px solid #ef4444';
                                }

                                const isSelected = selectedVehicle?.vehicleId === v.vehicleId;

                                return (
                                    <div
                                        key={v.vehicleId}
                                        onClick={() => canSelect && setSelectedVehicle(isSelected ? null : v)}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: isSelected ? '2px solid #3b82f6' : cardBorder,
                                            backgroundColor: isSelected ? '#eff6ff' : 'white',
                                            opacity: cardOpacity,
                                            cursor: canSelect ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (canSelect) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (canSelect) {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)';
                                            }
                                        }}
                                    >
                                        {/* Selection Indicator */}
                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '0.5rem',
                                                right: '0.5rem',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: '#3b82f6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                            }}>
                                                ✓
                                            </div>
                                        )}

                                        {/* Header */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.75rem'
                                        }}>
                                            <div style={{
                                                fontSize: '1.1rem',
                                                fontWeight: '600',
                                                color: '#1e293b'
                                            }}>
                                                {v.vehicleType.charAt(0).toUpperCase() + v.vehicleType.slice(1)}
                                            </div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                color: statusColor,
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                <span>{statusIcon}</span>
                                                <span>{statusText}</span>
                                            </div>
                                        </div>

                                        {/* Capacity Info */}
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.25rem'
                                            }}>
                                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                    Capacity: {capacityTons.toLocaleString()} tons
                                                </span>
                                                {totalWeight > 0 && (
                                                    <span style={{
                                                        fontSize: '0.85rem',
                                                        color: canHandleWeight ? '#059669' : '#dc2626',
                                                        fontWeight: '500'
                                                    }}>
                                                        {canHandleWeight
                                                            ? `${remaining.toLocaleString()} t remaining`
                                                            : `${Math.abs(remaining).toLocaleString()} t over`
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            {/* Capacity Bar */}
                                            <div style={{
                                                width: '100%',
                                                height: '8px',
                                                backgroundColor: '#e5e7eb',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(utilizationPercent, 100)}%`,
                                                    height: '100%',
                                                    backgroundColor: utilizationPercent > 100 ? '#dc2626' : utilizationPercent > 80 ? '#f59e0b' : '#10b981',
                                                    transition: 'width 0.3s ease'
                                                }}></div>
                                            </div>
                                        </div>

                                        {/* License Info */}
                                        {v.requiredLicense && (
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: '#6b7280',
                                                backgroundColor: '#f3f4f6',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                display: 'inline-block'
                                            }}>
                                                License: {v.requiredLicense}
                                            </div>
                                        )}

                                        {/* License Plate */}
                                        <div style={{
                                            marginTop: '0.5rem',
                                            fontSize: '0.8rem',
                                            color: '#9ca3af',
                                            fontFamily: 'monospace'
                                        }}>
                                            {v.licensePlate}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{
                            marginTop: '0.5rem',
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            {selectedOrdersData?.totalWeightTons > 0 && (
                                <div>💡 Click on available vehicles that can handle your cargo weight</div>
                            )}
                            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                ✅ Available • 🔧 Maintenance • 🚛 In Use • ⚖️ Over capacity
                            </div>
                        </div>
                    </div>
                    {/* Route selection removed — AI auto-selects based on order addresses */}
                    <div className="form-group">
                        <label>Trip Type</label>
                        <select value={tripType} onChange={e => setTripType(e.target.value)}>
                            <option value="delivery">Delivery</option>
                            <option value="pickup">Pickup</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Scheduled Departure</label>
                        <input
                            type="datetime-local"
                            value={scheduledDeparture}
                            min={nowMin}
                            onChange={e => setScheduledDeparture(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Scheduled Arrival</label>
                        <input
                            type="datetime-local"
                            value={scheduledArrival}
                            min={arrivalMin}
                            onChange={e => setScheduledArrival(e.target.value)}
                        />
                    </div>
                </div>

                {selectedOrdersData && selectedOrdersData.orders.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.75rem'
                        }}>
                            <h4 style={{
                                margin: 0,
                                color: '#1e293b',
                                fontSize: '1rem',
                                fontWeight: '600'
                            }}>
                                Selected Orders ({selectedOrdersData.orderCount})
                            </h4>
                            <button
                                onClick={() => setSelectedOrderIds([])}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: '#f3f4f6',
                                    color: '#6b7280',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear All
                            </button>
                        </div>

                        <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            {/* Header Row */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '80px 1fr 140px 100px 100px 40px',
                                gap: '0.75rem',
                                padding: '0.5rem 0',
                                borderBottom: '2px solid #e5e7eb',
                                fontWeight: '600',
                                color: '#374151',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <div>Order</div>
                                <div>Customer</div>
                                <div>Type</div>
                                <div>Distance</div>
                                <div>Fee</div>
                                <div></div>
                            </div>

                            {/* Order Rows */}
                            {selectedOrdersData.orders.map((order, index) => (
                                <div key={order.orderId} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '80px 1fr 140px 100px 100px 40px',
                                    gap: '0.75rem',
                                    alignItems: 'center',
                                    padding: '0.75rem 0',
                                    borderBottom: index < selectedOrdersData.orders.length - 1 ? '1px solid #e5e7eb' : 'none'
                                }}>
                                    {/* Order ID */}
                                    <div>
                                        <span style={{
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            padding: '0.125rem 0.375rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            #{order.orderId}
                                        </span>
                                    </div>

                                    {/* Customer Name */}
                                    <div style={{
                                        fontWeight: '500',
                                        color: '#374151',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {order.customerName}
                                    </div>

                                    {/* Pickup Type */}
                                    <div>
                                        {order.pickupType && (
                                            <span style={{
                                                backgroundColor:
                                                    order.pickupType === 'PORT_TERMINAL' ? '#fef3c7' :
                                                    order.pickupType === 'WAREHOUSE' ? '#dbeafe' : '#f0fdf4',
                                                color:
                                                    order.pickupType === 'PORT_TERMINAL' ? '#92400e' :
                                                    order.pickupType === 'WAREHOUSE' ? '#0c4a6e' : '#166534',
                                                padding: '0.125rem 0.375rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                width: 'fit-content'
                                            }}>
                                                <span>
                                                    {order.pickupType === 'PORT_TERMINAL' ? '🚢' :
                                                     order.pickupType === 'WAREHOUSE' ? '🏭' : '📦'}
                                                </span>
                                                <span style={{
                                                    maxWidth: '100px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {order.pickupType}
                                                </span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Distance */}
                                    <div style={{
                                        color: '#6b7280',
                                        textAlign: 'right'
                                    }}>
                                        📍 {order.distanceKm ? `${order.distanceKm.toFixed(1)}km` : '—'}
                                    </div>

                                    {/* Fee */}
                                    <div style={{
                                        color: '#059669',
                                        fontWeight: '600',
                                        textAlign: 'right'
                                    }}>
                                        {order.shippingFee ? formatMoney(order.shippingFee) : '—'}
                                    </div>

                                    {/* Remove Button */}
                                    <div style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => toggleOrder(order.orderId)}
                                            style={{
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: '#9ca3af',
                                                cursor: 'pointer',
                                                fontSize: '1.25rem',
                                                padding: '0.25rem',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '24px',
                                                height: '24px'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Summary */}
                            <div style={{
                                marginTop: '1rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '1rem'
                            }}>
                                <span style={{
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    Trip Summary:
                                </span>
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    <span style={{ color: '#6b7280' }}>
                                        📏 {selectedOrdersData.totalDistance > 0 ? `${selectedOrdersData.totalDistance.toFixed(1)} km` : '—'}
                                    </span>
                                    <span style={{
                                        color: selectedOrdersData.totalWeightTons > 0 ? '#059669' : '#6b7280',
                                        fontWeight: '600'
                                    }}>
                                        ⚖️ {selectedOrdersData.totalWeightTons > 0 ? `${selectedOrdersData.totalWeightTons.toLocaleString()} t` : '—'}
                                    </span>
                                    <span style={{
                                        color: '#059669',
                                        fontWeight: '600'
                                    }}>
                                        💰 {selectedOrdersData.totalFee > 0 ? formatMoney(selectedOrdersData.totalFee) : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Weight Validation Warning */}
                {validationInfo.exceedsAllVehicles && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: '0.875rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                            <strong>Weight Limit Exceeded</strong>
                        </div>
                        <p style={{ margin: 0, marginBottom: '0.5rem' }}>
                            Total selected weight ({selectedOrdersData.totalWeightTons.toLocaleString()} t) exceeds the maximum vehicle capacity ({validationInfo.maxCapacityTons.toLocaleString()} t).
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>
                            Please remove some orders or contact fleet management for larger vehicles.
                        </p>
                    </div>
                )}

                <div className="detail-card" style={{ marginTop: '1rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: '600' }}>Select Pending Orders</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Filter by type:</span>
                            <select
                                value={orderTypeFilter}
                                onChange={e => setOrderTypeFilter(e.target.value)}
                                style={{
                                    padding: '0.375rem 0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    minWidth: '140px'
                                }}
                            >
                                <option value="">All Types</option>
                                <option value="PORT_TERMINAL">🚢 Port Terminal</option>
                                <option value="WAREHOUSE">🏭 Warehouse</option>
                                <option value="STANDARD">📦 Standard</option>
                            </select>
                        </div>
                    </div>

                    {loadingOrders && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '2rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                                <span style={{ color: '#64748b' }}>Loading pending orders...</span>
                            </div>
                        </div>
                    )}

                    {!loadingOrders && pendingOrders.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem 2rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No pending orders</h4>
                            <p style={{ margin: 0, color: '#64748b' }}>All orders have been assigned or there are no available orders.</p>
                        </div>
                    )}

                    {!loadingOrders && pendingOrders.length > 0 && (
                        <div style={{
                            display: 'grid',
                            gap: '0.75rem',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
                        }}>
                            {pendingOrders
                                .filter(o => !orderTypeFilter || o.pickupType === orderTypeFilter)
                                .map((o) => {
                                    const isSelected = selectedOrderIds.includes(o.orderId);
                                    return (
                                        <div
                                            key={o.orderId}
                                            onClick={() => toggleOrder(o.orderId)}
                                            style={{
                                                position: 'relative',
                                                backgroundColor: isSelected ? '#eff6ff' : 'white',
                                                border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                padding: '1rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                transform: isSelected ? 'translateY(-2px)' : 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                                                    e.currentTarget.style.transform = 'none';
                                                }
                                            }}
                                        >
                                            {/* Selection Checkbox */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '1rem',
                                                right: '1rem',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
                                                border: isSelected ? '2px solid #3b82f6' : '2px solid #d1d5db',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                {isSelected && (
                                                    <span style={{
                                                        color: 'white',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        lineHeight: 1
                                                    }}>✓</span>
                                                )}
                                            </div>

                                            {/* Order Header */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                marginBottom: '0.75rem'
                                            }}>
                                                <div style={{
                                                    backgroundColor: '#f1f5f9',
                                                    color: '#475569',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '6px'
                                                }}>
                                                    #{o.orderId}
                                                </div>
                                                <div style={{
                                                    fontSize: '1rem',
                                                    fontWeight: '600',
                                                    color: '#1e293b',
                                                    flex: 1
                                                }}>
                                                    {o.customerName}
                                                </div>
                                            </div>

                                            {/* Route Information */}
                                            <div style={{
                                                marginBottom: '0.75rem',
                                                padding: '0.5rem',
                                                backgroundColor: '#f8fafc',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>📍</span>
                                                    <span style={{
                                                        fontSize: '0.875rem',
                                                        color: '#374151',
                                                        flex: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {o.pickupAddress}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    margin: '0.25rem 0'
                                                }}>
                                                    <div style={{
                                                        width: '20px',
                                                        height: '1px',
                                                        backgroundColor: '#d1d5db',
                                                        position: 'relative'
                                                    }}>
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '-3px',
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            width: '0',
                                                            height: '0',
                                                            borderLeft: '3px solid transparent',
                                                            borderRight: '3px solid transparent',
                                                            borderTop: '3px solid #d1d5db'
                                                        }}></div>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <span style={{ color: '#10b981', fontSize: '0.875rem' }}>🎯</span>
                                                    <span style={{
                                                        fontSize: '0.875rem',
                                                        color: '#374151',
                                                        flex: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {o.deliveryAddress}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Order Details */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '0.5rem'
                                            }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {o.weightTons && (
                                                        <span style={{
                                                            backgroundColor: '#fef3c7',
                                                            color: '#92400e',
                                                            padding: '0.125rem 0.375rem',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '500'
                                                        }}>
                                                            ⚖️ {o.weightTons}t
                                                        </span>
                                                    )}
                                                    {o.pickupType && (
                                                        <span style={{
                                                            backgroundColor:
                                                                o.pickupType === 'PORT_TERMINAL' ? '#fef3c7' :
                                                                o.pickupType === 'WAREHOUSE' ? '#dbeafe' :
                                                                '#f0fdf4',
                                                            color:
                                                                o.pickupType === 'PORT_TERMINAL' ? '#92400e' :
                                                                o.pickupType === 'WAREHOUSE' ? '#0c4a6e' :
                                                                '#166534',
                                                            padding: '0.125rem 0.375rem',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            {o.pickupType === 'PORT_TERMINAL' ? '🚢' :
                                                             o.pickupType === 'WAREHOUSE' ? '🏭' : '📦'} {o.pickupType}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.875rem',
                                                    color: '#059669',
                                                    fontWeight: '600'
                                                }}>
                                                    {o.shippingFee ? formatMoney(o.shippingFee) : 'TBD'}
                                                </div>
                                            </div>

                                            {/* Container/Warehouse Info */}
                                            {(o.containerNumber || o.terminalName || o.warehouseName || o.dockNumber) && (
                                                <div style={{
                                                    marginTop: '0.5rem',
                                                    padding: '0.375rem 0.5rem',
                                                    backgroundColor: '#f8fafc',
                                                    borderRadius: '4px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '0.75rem',
                                                    color: '#64748b'
                                                }}>
                                                    {o.pickupType === 'PORT_TERMINAL' && (
                                                        <div>
                                                            {o.containerNumber && <span>🧾 Container: {o.containerNumber}</span>}
                                                            {o.containerNumber && o.terminalName && <span> • </span>}
                                                            {o.terminalName && <span>⚓ Terminal: {o.terminalName}</span>}
                                                        </div>
                                                    )}
                                                    {o.pickupType === 'WAREHOUSE' && (
                                                        <div>
                                                            {o.warehouseName && <span>🏭 Warehouse: {o.warehouseName}</span>}
                                                            {o.warehouseName && o.dockNumber && <span> • </span>}
                                                            {o.dockNumber && <span>🚪 Dock: {o.dockNumber}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {selectedOrdersData && selectedOrdersData.orders.length > 0 && (
                    <>
                        <div className="info-pill" style={{ marginTop: '1rem' }}>
                            Trip Route: {selectedOrdersData.orders.length} order{selectedOrdersData.orders.length > 1 ? 's' : ''} selected
                        </div>
                        <RouteMapCard
                            orders={selectedOrdersData.orders}
                        />
                    </>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button className="btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Trip'}
                    </button>
                    <button className="btn-secondary" type="button" onClick={() => navigate('/dispatch/trips')}>
                        Cancel
                    </button>
                </div>

                {error && <div className="error" style={{ marginTop: '1rem' }}>{error}</div>}
                {success && <div className="success" style={{ marginTop: '1rem' }}>{success}</div>}
            </form>
        </div>
    );
};

export default TripCreatePage;
