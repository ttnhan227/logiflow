import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { tripService, orderService, dispatchVehicleService, dispatchRouteService } from '../../services';
import RouteMapCard from './RouteMapCard';
import {
  Button,
  Card,
  Input,
  Select,
  Badge,
  PageHeader,
  Alert,
  LoadingSpinner,
} from '@/components/ui';
import {
  LuTruck,
  LuPackage,
  LuCalendar,
  LuMapPin,
  LuArrowLeft,
  LuCheck,
  LuX,
  LuWarehouse,
  LuContainer,
  LuClock,
} from 'react-icons/lu';

export const TripCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId');

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [tripType, setTripType] = useState('delivery');
  const [scheduledDeparture, setScheduledDeparture] = useState('');
  const [scheduledArrival, setScheduledArrival] = useState('');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
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
          dispatchVehicleService.getAvailableVehicles(),
        ]);
        const orders = ordersRes?.orders || [];
        setPendingOrders(orders);
        setVehicles(vehiclesRes || []);

        if (initialOrderId) {
          const matchingId = Number(initialOrderId);
          if (orders.some((o) => o.orderId === matchingId)) {
            setSelectedOrderIds([matchingId]);
          }
        }
      } catch (ex) {
        console.error(ex);
        setError(ex?.response?.data?.error || 'Failed to load pending dispatch orders.');
      } finally {
        setLoadingOrders(false);
      }
    };
    loadData();
  }, [initialOrderId]);

  const toggleOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const selectedOrdersData = useMemo(() => {
    const selected = pendingOrders.filter((o) => selectedOrderIds.includes(o.orderId));
    if (selected.length === 0) return null;

    const totalDistance = selected.reduce((sum, order) => sum + (order.distanceKm || 0), 0);
    const totalFee = selected.reduce((sum, order) => sum + (order.shippingFee || 0), 0);
    const totalWeightTons = selected.reduce((sum, order) => sum + (order.weightTons || 0), 0);
    const orderCount = selected.length;

    return {
      orders: selected,
      totalDistance,
      totalFee,
      totalWeightTons,
      orderCount,
    };
  }, [selectedOrderIds, pendingOrders]);

  const validationInfo = useMemo(() => {
    if (!selectedOrdersData?.totalWeightTons || vehicles.length === 0) {
      return { maxCapacityTons: 0, exceedsAllVehicles: false };
    }

    const totalWeight = selectedOrdersData.totalWeightTons;
    const availableVehicles = vehicles.filter((v) => v.status === 'available');
    const maxCapacityTons =
      availableVehicles.length > 0 ? Math.max(...availableVehicles.map((v) => v.capacityTons || 0)) : 0;
    const exceedsAllVehicles = totalWeight > maxCapacityTons;

    return { maxCapacityTons, exceedsAllVehicles };
  }, [vehicles, selectedOrdersData?.totalWeightTons]);

  const sortedVehicles = useMemo(() => {
    if (!selectedOrdersData?.totalWeightTons) {
      return [...vehicles].sort((a, b) => {
        const aAvailable = a.status === 'available';
        const bAvailable = b.status === 'available';
        if (aAvailable !== bAvailable) return aAvailable ? -1 : 1;
        return 0;
      });
    }

    const totalWeight = selectedOrdersData.totalWeightTons;
    return [...vehicles].sort((a, b) => {
      const aAvailable = a.status === 'available';
      const bAvailable = b.status === 'available';
      if (aAvailable !== bAvailable) return bAvailable ? 1 : -1;

      const aCapacityTons = a.capacityTons || 0;
      const bCapacityTons = b.capacityTons || 0;
      const aCanHandle = aCapacityTons >= totalWeight;
      const bCanHandle = bCapacityTons >= totalWeight;

      if (aCanHandle !== bCanHandle) return bCanHandle ? 1 : -1;
      if (aCanHandle && bCanHandle) {
        return aCapacityTons - totalWeight - (bCapacityTons - totalWeight);
      }
      return totalWeight - aCapacityTons - (totalWeight - bCapacityTons);
    });
  }, [vehicles, selectedOrdersData?.totalWeightTons]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedVehicle || !scheduledDeparture || !scheduledArrival || selectedOrderIds.length === 0) {
      setError('Please select a commercial vehicle, departure/arrival schedule, and at least one order.');
      return;
    }

    if (selectedVehicle.status !== 'available') {
      setError('The selected vehicle is currently not in available state.');
      return;
    }

    const selectedOrders = pendingOrders.filter((o) => selectedOrderIds.includes(o.orderId));
    const invalids = [];
    for (const o of selectedOrders) {
      if (!o.pickupType) {
        invalids.push(`#${o.orderId} missing pickup type`);
        continue;
      }
      if (o.pickupType === 'PORT_TERMINAL' && (!o.containerNumber || !String(o.containerNumber).trim())) {
        invalids.push(`#${o.orderId} requires container number for seaport drayage`);
      }
    }
    if (invalids.length > 0) {
      setError(`Some orders have incomplete parameters: ${invalids.join('; ')}`);
      return;
    }

    setLoading(true);
    try {
      const route = await dispatchRouteService.createTripRoute(
        selectedOrderIds,
        `Trip Route: ${selectedOrderIds.length} orders consolidated`
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
      setSuccess('Trip created successfully! Redirecting to manifest oversight...');
      setTimeout(() => navigate(`/dispatch/trips/${createdTrip.tripId}`), 800);
    } catch (ex) {
      console.error(ex);
      setError(ex?.response?.data?.error || ex?.message || 'Failed to create trip manifest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Create Linehaul Trip"
        description="Consolidate pending orders, allocate transport vehicle, and compute optimized multi-stop route."
        badge={<Badge variant="brand">Trip Builder</Badge>}
        actions={
          <Link to="/dispatch/trips">
            <Button variant="outline" size="sm" leftIcon={<LuArrowLeft size={14} />}>
              Back to Trips
            </Button>
          </Link>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Fleet & Schedule Parameters */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            1. Vehicle & Schedule Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <Select
                label={`Commercial Vehicle ${
                  selectedOrdersData?.totalWeightTons
                    ? `(Consolidated Weight: ${selectedOrdersData.totalWeightTons.toFixed(1)} T)`
                    : ''
                }`}
                value={selectedVehicle ? selectedVehicle.vehicleId : ''}
                onChange={(e) => {
                  const v = vehicles.find((x) => x.vehicleId === Number(e.target.value));
                  setSelectedVehicle(v || null);
                }}
                options={[
                  { value: '', label: '-- Select Commercial Vehicle --' },
                  ...sortedVehicles.map((v) => {
                    const capacityTons = v.capacityTons || 0;
                    const totalWeight = selectedOrdersData?.totalWeightTons || 0;
                    const canHandle = capacityTons >= totalWeight;
                    const isAvailable = v.status === 'available';
                    const remaining = capacityTons - totalWeight;

                    return {
                      value: v.vehicleId,
                      label: `${v.vehicleType} (${v.licensePlate || 'No Plate'}) [${capacityTons}T] ${
                        !isAvailable ? '(Unavailable)' : !canHandle ? '(Over Capacity)' : `(${remaining.toFixed(1)}T free)`
                      }`,
                    };
                  }),
                ]}
              />
            </div>

            <Select
              label="Trip Type"
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              options={[
                { value: 'delivery', label: 'Direct Delivery Linehaul' },
                { value: 'pickup', label: 'Consolidation Pickup' },
                { value: 'transfer', label: 'Hub-to-Hub Cross-dock Transfer' },
              ]}
            />

            <Input
              label="Scheduled Departure Time *"
              type="datetime-local"
              value={scheduledDeparture}
              min={nowMin}
              onChange={(e) => setScheduledDeparture(e.target.value)}
              required
            />

            <Input
              label="Scheduled Arrival Time *"
              type="datetime-local"
              value={scheduledArrival}
              min={arrivalMin}
              onChange={(e) => setScheduledArrival(e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Selected Orders Summary Bar */}
        {selectedOrdersData && (
          <Card style={{ padding: '20px', backgroundColor: 'var(--bg-surface-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Consolidated Orders ({selectedOrdersData.orderCount})
                </span>
                <Badge variant="brand" size="sm">
                  {selectedOrdersData.totalWeightTons.toFixed(1)} T Payload
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 'var(--text-xs)' }}>
                <span>Est. Linehaul Distance: <strong>{selectedOrdersData.totalDistance.toFixed(1)} km</strong></span>
                <span>Combined Revenue: <strong>{Number(selectedOrdersData.totalFee).toLocaleString()} VND</strong></span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrderIds([])}>
                  Clear Selection
                </Button>
              </div>
            </div>

            {/* List of selected pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedOrdersData.orders.map((o) => (
                <div
                  key={o.orderId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--border-default)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <strong style={{ color: 'var(--color-brand-700)' }}>#{o.orderId}</strong>
                  <span>{o.customerName}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({o.weightTons}T)</span>
                  <button
                    type="button"
                    onClick={() => toggleOrder(o.orderId)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 2px' }}
                  >
                    <LuX size={13} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Order Selection Grid */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
                2. Select Pending Orders to Consolidate
              </h3>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Click orders to include them in this multi-stop trip manifest.
              </span>
            </div>

            <div style={{ width: '180px' }}>
              <Select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Pickup Types' },
                  { value: 'PORT_TERMINAL', label: 'Port Terminal' },
                  { value: 'WAREHOUSE', label: 'Warehouse Hub' },
                  { value: 'STANDARD', label: 'Standard Delivery' },
                ]}
              />
            </div>
          </div>

          {loadingOrders ? (
            <div style={{ padding: '32px 0' }}>
              <LoadingSpinner text="Loading pending orders..." />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
              No pending orders are currently awaiting trip assignment.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
              {pendingOrders
                .filter((o) => !orderTypeFilter || o.pickupType === orderTypeFilter)
                .map((o) => {
                  const isSelected = selectedOrderIds.includes(o.orderId);

                  return (
                    <div
                      key={o.orderId}
                      onClick={() => toggleOrder(o.orderId)}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-lg)',
                        border: isSelected ? '2px solid var(--color-brand-600)' : '1px solid var(--border-default)',
                        backgroundColor: isSelected ? 'var(--color-brand-50)' : 'var(--color-white)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand-700)' }}>
                            #{o.orderId}
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {o.customerName}
                          </span>
                        </div>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? 'none' : '1px solid var(--border-default)',
                            backgroundColor: isSelected ? 'var(--color-brand-600)' : 'transparent',
                            color: 'var(--color-white)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <LuCheck size={12} />}
                        </div>
                      </div>

                      {/* Route overview */}
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          📍 <strong>From:</strong> {o.pickupAddress}
                        </div>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🎯 <strong>To:</strong> {o.deliveryAddress}
                        </div>
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Badge variant="neutral" size="sm">
                            {o.weightTons ? `${o.weightTons} T` : '0 T'}
                          </Badge>
                          {o.pickupType && o.pickupType !== 'STANDARD' && (
                            <Badge variant="warning" size="sm">
                              {o.pickupType}
                            </Badge>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-brand-700)' }}>
                          {o.shippingFee ? `${Number(o.shippingFee).toLocaleString()} VND` : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        {/* Live Route Map Telemetry */}
        {selectedOrdersData && selectedOrdersData.orders.length > 0 && (
          <RouteMapCard orders={selectedOrdersData.orders} />
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button type="button" variant="outline" onClick={() => navigate('/dispatch/trips')} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} leftIcon={<LuTruck size={16} />}>
            Create Dispatch Trip Manifest
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TripCreatePage;
