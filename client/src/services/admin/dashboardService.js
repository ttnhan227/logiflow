import api from '../api';

const dashboardService = {
  getDashboardOverview: () => 
    api.get('/admin/dashboard/overview')
      .then(response => response.data)
};

export default dashboardService;
