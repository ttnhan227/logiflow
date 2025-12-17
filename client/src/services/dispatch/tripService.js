import api from '../api';

const basePath = '/dispatch';

const getTrips = (params = {}) => api.get(`${basePath}/trips`, { params }).then(r => r.data);

const getTripById = (tripId) => api.get(`${basePath}/trips/${tripId}`).then(r => r.data);

const createTrip = (payload) => api.post(`${basePath}/trips`, payload).then(r => r.data);

const assignTrip = (tripId, payload) => api.put(`${basePath}/trips/${tripId}/assign`, payload).then(r => r.data);

const getRecommendedDrivers = (tripId, limit = 10) => api.get(`${basePath}/trips/${tripId}/recommended-drivers`, { params: { limit } }).then(r => r.data);

const updateTripStatus = (tripId, payload) => api.put(`${basePath}/trips/${tripId}/status`, payload).then(r => r.data);

const rerouteTrip = (tripId, payload) => api.put(`${basePath}/trips/${tripId}/reroute`, payload).then(r => r.data);

const cancelTrip = (tripId, payload) => api.put(`${basePath}/trips/${tripId}/cancel`, payload).then(r => r.data);

const getAvailableDrivers = (datetime) => api.get(`${basePath}/drivers/available`, { params: datetime ? { datetime } : {} }).then(r => r.data);

const tripService = {
  getTrips,
  getTripById,
  createTrip,
  assignTrip,
  updateTripStatus,
  rerouteTrip,
  cancelTrip,
  getAvailableDrivers,
  getRecommendedDrivers,
};

export default tripService;
