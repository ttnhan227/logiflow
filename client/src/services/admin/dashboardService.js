import api from '../api';

const dashboardService = {
  getDashboardData: () =>
    api.get('/admin/dashboard').then(res => res.data),
};

export default dashboardService;
