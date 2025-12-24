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

  // PDF Download Methods
  downloadComprehensiveReport: (startDate, endDate) =>
    api.get('/admin/reports/comprehensive/pdf', {
      params: { startDate, endDate },
      responseType: 'blob'
    }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logiflow_business_intelligence_report_${startDate}_to_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }),
};

export default reportsService;
