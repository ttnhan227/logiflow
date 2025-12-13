import api from '../api';

const vehicleService = {
  getVehicleStatistics: () =>
    api.get('/admin/vehicles/statistics').then(res => res.data),
  
  getAllVehicles: () =>
    api.get('/admin/vehicles').then(res => res.data),
  
  getVehicleById: (vehicleId) =>
    api.get(`/admin/vehicles/${vehicleId}`).then(res => res.data),
  
  createVehicle: (vehicleData) =>
    api.post('/admin/vehicles', vehicleData).then(res => res.data),
  
  updateVehicle: (vehicleId, vehicleData) =>
    api.put(`/admin/vehicles/${vehicleId}`, vehicleData).then(res => res.data),
  
  deleteVehicle: (vehicleId) =>
    api.delete(`/admin/vehicles/${vehicleId}`).then(res => res.data),
};

export default vehicleService;
