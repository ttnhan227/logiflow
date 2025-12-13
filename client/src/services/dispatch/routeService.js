import api from '../api';

const basePath = '/dispatch/routes';

const getRouteById = (routeId) => api.get(`${basePath}/${routeId}`).then(r => r.data);

const getAllRoutes = () => api.get(`${basePath}`).then(r => r.data);

const dispatchRouteService = {
  getRouteById,
  getAllRoutes,
};

export default dispatchRouteService;
