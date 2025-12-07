import api from '../api';

const basePath = '/dispatch/drivers';

const getAvailableDrivers = () => api.get(`${basePath}/available`).then(r => r.data);

const getAllDrivers = () => api.get(`${basePath}`).then(r => r.data);

const dispatchDriverService = {
  getAvailableDrivers,
  getAllDrivers,
};

export default dispatchDriverService;
