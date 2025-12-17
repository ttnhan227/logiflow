import api from '../api';

const basePath = '/dispatch/reports';

const getDailyReport = (startDate, endDate) =>
  api
    .get(`${basePath}/daily`, { params: { startDate, endDate } })
    .then((r) => r.data);

const reportsService = {
  getDailyReport,
};

export default reportsService;
