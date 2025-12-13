import api from '../api';

const routeService = {
  getRouteStatistics: () =>
    api.get('/admin/routes/statistics').then(res => res.data),
  
  getAllRoutes: () =>
    api.get('/admin/routes').then(res => res.data),
  
  getRouteById: (routeId) =>
    api.get(`/admin/routes/${routeId}`).then(res => res.data),
  
  createRoute: (routeData) =>
    api.post('/admin/routes', routeData).then(res => res.data),
  
  updateRoute: (routeId, routeData) =>
    api.put(`/admin/routes/${routeId}`, routeData).then(res => res.data),
  
  deleteRoute: (routeId) =>
    api.delete(`/admin/routes/${routeId}`).then(res => res.data),
};

export default routeService;
