import api from '../api';

const basePath = '/dispatch/vehicles';

const getAllVehicles = () => api.get(`${basePath}`).then(r => r.data);

const getAvailableVehicles = () => api.get(`${basePath}/available`).then(r => r.data);

const dispatchVehicleService = {
  getAllVehicles,
  getAvailableVehicles,
};

export default dispatchVehicleService;
