import api from '../api';

const reportsService = {
  getPerformanceReport: (startDate, endDate) =>
    api.get('/admin/reports/performance', {
      params: { startDate, endDate }
    }).then(res => res.data),

  getCostAnalysis: (startDate, endDate) =>
    api.get('/admin/reports/cost-analysis', {
      params: { startDate, endDate }
    }).then(res => res.data),

  getComplianceReport: (startDate, endDate) =>
    api.get('/admin/reports/compliance', {
      params: { startDate, endDate }
    }).then(res => res.data),

  getDriverPerformance: (startDate, endDate) =>
    api.get('/admin/reports/driver-performance', {
      params: { startDate, endDate }
    }).then(res => res.data),
};

export default reportsService;
