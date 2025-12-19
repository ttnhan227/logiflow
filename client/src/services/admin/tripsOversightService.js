import api from '../api';

// Risk calculation for trips based on SLA (but respect backend calculations)
const deriveTripRisk = (trip) => {
  // First check if backend already calculated risk AND if trip is completed
  if (trip.risk && trip.tripStatus === 'completed') {
    return 'COMPLETED'; // Backend override for completed trips
  }

  const now = Date.now();
  const slaTs = trip?.slaDue ? Date.parse(trip.slaDue) : null;
  if (!slaTs) return trip.risk || 'UNKNOWN';
  const deltaMinutes = (slaTs - now) / 60000;
  if (deltaMinutes < 0) return 'OVERDUE';
  if (deltaMinutes <= 240) return 'DUE_SOON'; // 4 hours
  return 'ON_TRACK';
};

// Normalize trip data from backend
const normalizeTrips = (trips = []) =>
  trips.map((trip) => ({
    // Trip-level information
    tripId: trip.tripId,
    tripStatus: trip.tripStatus,
    tripType: trip.tripType,
    scheduledDeparture: trip.scheduledDeparture,
    scheduledArrival: trip.scheduledArrival,
    actualDeparture: trip.actualDeparture,
    actualArrival: trip.actualArrival,
    createdAt: trip.createdAt,
    slaDue: trip.slaDue,
    eta: trip.eta,
    delayReason: trip.delayReason,

    // Route information
    originAddress: trip.originAddress,
    destinationAddress: trip.destinationAddress,
    originCity: trip.originCity,
    destinationCity: trip.destinationCity,
    totalDistanceKm: trip.totalDistanceKm,
    totalWeightTon: trip.totalWeightTon,

    // Assignment information
    driver: trip.driver ? {
      name: trip.driver.fullName,
      compliance: trip.driver.complianceFlags || [],
      phone: trip.driver.phone,
      status: trip.driver.status,
    } : null,
    vehicle: trip.vehicle ? {
      plate: trip.vehicle.licensePlate,
      capacity: trip.vehicle.capacity,
      type: trip.vehicle.vehicleType,
      status: trip.vehicle.status,
    } : null,
    assignmentStatus: trip.assignmentStatus,

    // Risk assessment
    risk: deriveTripRisk(trip),
    hasUrgentOrders: trip.hasUrgentOrders,

    // Creator information
    createdByUserId: trip.createdByUserId,
    createdByUsername: trip.createdByUsername,

    // Orders within this trip (normalized from embedded OrderSummaryDto)
    orders: (trip.orders || []).map(order => ({
      orderId: order.orderId,
      customer: order.customerName,
      customerPhone: order.customerPhone,
      pickup: {
        address: order.pickupAddress,
        city: extractCity(order.pickupAddress)
      },
      dropoff: {
        address: order.deliveryAddress,
        city: extractCity(order.deliveryAddress)
      },
      packageDetails: order.packageDetails,
      weightTon: order.weightTon,
      packageValue: order.packageValue,
      orderStatus: order.orderStatus,
      priorityLevel: order.priorityLevel,
      slaDue: order.slaDue,
      eta: order.eta,
    }))
  }));

// Extract city from address (simple implementation)
const extractCity = (address) => {
  if (!address) return 'N/A';
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 1].trim() : address;
};

// Get trips oversight - now returns trip data instead of flattened orders
const getTripsOversight = async (params = {}) => {
  const merged = { page: 0, size: 50, ...params };
  try {
    const res = await api.get('/admin/trips/oversight', { params: merged });
    // Backend now returns { trips: [...], meta: {...} } instead of { orders: [...], ... }
    const payload = Array.isArray(res.data?.trips) ? res.data.trips : res.data;
    const meta = {
      currentPage: res.data?.currentPage ?? 0,
      pageSize: res.data?.pageSize ?? merged.size,
      totalItems: res.data?.totalItems ?? (payload?.length || 0),
      totalPages: res.data?.totalPages ?? 1,
      hasNext: res.data?.hasNext ?? false,
      hasPrevious: res.data?.hasPrevious ?? false,
    };
    return { items: normalizeTrips(payload || []), meta };
  } catch (err) {
    throw err;
  }
};

// Update trip status (was updateTripOrderStatus)
const updateTripOrderStatus = async (tripId, status) => {
  const res = await api.put(`/admin/trips/${tripId}/status`, { status });
  return res.data;
};

// Respond to trip delay report (was respondToTripDelayReport with different param)
const getTripOversight = async (tripId) => {
  const res = await api.get(`/admin/trips/${tripId}`);
  return res.data;
};

const respondToTripDelayReport = async (tripId, response, extensionMinutes) => {
  const res = await api.post(`/admin/trips/${tripId}/delay-response`, {
    responseType: response,
    extensionMinutes: extensionMinutes
  });
  return res.data;
};

// Get trips with pending delay reports
const getTripsWithDelayReports = async () => {
  try {
    const res = await api.get('/admin/trips/delay-reports');
    return normalizeTrips(res.data || []);
  } catch (err) {
    throw err;
  }
};

export const tripsOversightService = {
  getTripsOversight,
  getTripOversight,
  updateTripOrderStatus,
  respondToTripDelayReport,
  getTripsWithDelayReports,
};

export default tripsOversightService;
