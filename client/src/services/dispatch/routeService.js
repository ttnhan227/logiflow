import api from '../api';

const basePath = '/dispatch/routes';

const getRouteById = (routeId) => api.get(`${basePath}/${routeId}`).then(r => r.data);

const getAllRoutes = () => api.get(`${basePath}`).then(r => r.data);

const createRoute = (payload) => api.post(`${basePath}`, payload).then(r => r.data);

const dispatchRouteService = {
  getRouteById,
  getAllRoutes,
  createRoute,
};

export default dispatchRouteService;
