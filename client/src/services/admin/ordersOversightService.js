import api from '../api';


const deriveRisk = (order) => {
  // Terminal states don't need risk tracking
  if (['DELIVERED', 'CANCELLED'].includes(order?.orderStatus)) {
    return 'COMPLETED';
  }
  const now = Date.now();
  const slaTs = order?.slaDue ? Date.parse(order.slaDue) : null;
  if (!slaTs) return order.risk || 'UNKNOWN';
  const deltaMinutes = (slaTs - now) / 60000;
  if (deltaMinutes < 0) return 'OVERDUE';
  if (deltaMinutes <= 60) return 'DUE_SOON';
  return 'ON_TRACK';
};

const normalizeOrders = (orders = []) =>
  orders.map((o) => ({
    orderId: o.orderId,
    customer: o.customerName,
    pickup: { 
      city: extractCity(o.pickupAddress), 
      address: o.pickupAddress 
    },
    dropoff: { 
      city: extractCity(o.deliveryAddress), 
      address: o.deliveryAddress 
    },
    status: o.orderStatus || 'UNKNOWN',
    priority: o.priorityLevel,
    createdAt: o.createdAt,
    slaDue: o.slaDue,
    eta: o.eta,
    driver: o.driver ? {
      name: o.driver.fullName,
      compliance: o.driver.complianceFlags || [],
      phone: o.driver.phone,
      status: o.driver.status,
    } : null,
    vehicle: o.vehicle ? {
      plate: o.vehicle.licensePlate,
      capacity: o.vehicle.capacity,
      type: o.vehicle.vehicleType,
      status: o.vehicle.status,
    } : null,
    trip: o.trip ? {
      tripId: o.trip.tripId,
      status: o.trip.status,
      scheduledDeparture: o.trip.scheduledDeparture,
      scheduledArrival: o.trip.scheduledArrival,
    } : null,
    risk: deriveRisk(o),
    delayReason: o.delayReason || null,
  }));

const extractCity = (address) => {
  if (!address) return 'N/A';
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 1].trim() : address;
};

const getOversightOrders = async (params = {}) => {
  const merged = { page: 0, size: 50, ...params };
  try {
    const res = await api.get('/admin/orders/oversight', { params: merged });
    const payload = Array.isArray(res.data?.orders) ? res.data.orders : res.data;
    const meta = {
      currentPage: res.data?.currentPage ?? 0,
      pageSize: res.data?.pageSize ?? merged.size,
      totalItems: res.data?.totalItems ?? (payload?.length || 0),
      totalPages: res.data?.totalPages ?? 1,
      hasNext: res.data?.hasNext ?? false,
      hasPrevious: res.data?.hasPrevious ?? false,
    };
    return { items: normalizeOrders(payload || []), meta };
  } catch (err) {
    throw err;
  }
};

const updateOrderStatus = async (orderId, status) => {
  const res = await api.put(`/admin/orders/${orderId}/status`, { status });
  return res.data;
};

const updateOrderDelay = async (orderId, delayReason, delayMinutes) => {
  const res = await api.put(`/admin/orders/${orderId}/delay`, { 
    delayReason,
    delayMinutesExtension: delayMinutes 
  });
  return res.data;
};

export const ordersOversightService = {
  getOversightOrders,
  updateOrderStatus,
  updateOrderDelay,
};

export default ordersOversightService;
