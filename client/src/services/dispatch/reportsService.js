import api from '../api';

const basePath = '/dispatch/reports';

const getDailyReport = (startDate, endDate) =>
  api
    .get(`${basePath}/daily`, { params: { startDate, endDate } })
    .then((r) => r.data);

// Download dispatch daily report as PDF
const downloadDailyReportPdf = (startDate, endDate) =>
  api
    .get(`${basePath}/daily/pdf`, {
      params: { startDate, endDate },
      responseType: 'blob'
    })
    .then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logiflow_dispatch_daily_report_${startDate}_to_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

const reportsService = {
  getDailyReport,
  downloadDailyReportPdf,
};

export default reportsService;
