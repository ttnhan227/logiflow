import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/manager';

// hàm chung lấy header Authorization
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
        return {};
    }
    return {
        Authorization: `Bearer ${token}`,
    };
}

export async function getOperationsPerformance(startDate, endDate) {
    const response = await axios.get(
        `${API_BASE_URL}/operations/performance`,
        {
            params: { startDate, endDate },
            headers: getAuthHeaders(),
            withCredentials: false,
        }
    );
    return response.data;
}

export async function getFleetStatus() {
    const response = await axios.get(
        `${API_BASE_URL}/fleet/status`,
        {
            headers: getAuthHeaders(),
            withCredentials: false,
        }
    );
    return response.data;
}

export async function getDeliveryReport(startDate, endDate) {
    const response = await axios.get(`${API_BASE_URL}/reports/deliveries`, {
        params: { startDate, endDate },
        headers: getAuthHeaders(),
        withCredentials: false,
    });
    return response.data;
}

export async function getIssueReports(startDate, endDate) {
    const response = await axios.get(`${API_BASE_URL}/reports/issues`, {
        params: { startDate, endDate },
        headers: getAuthHeaders(),
        withCredentials: false,
    });
    return response.data;
}

export async function getComplianceCheck(startDate, endDate) {
    const response = await axios.get(`${API_BASE_URL}/compliance/check`, {
        params: { startDate, endDate },
        headers: getAuthHeaders(),
        withCredentials: false,
    });
    return response.data;
}

export async function getRouteSummary(startDate, endDate) {
    const response = await axios.get(`${API_BASE_URL}/analytics/route-summary`, {
        params: { startDate, endDate },
        headers: getAuthHeaders(),
        withCredentials: false,
    });
    return response.data;
}

export async function getAlerts(startDate, endDate) {
    const response = await axios.get(`${API_BASE_URL}/alerts`, {
        params: { startDate, endDate },
        headers: getAuthHeaders(),
        withCredentials: false,
    });
    return response.data;
}

export async function getManagerActivities(startDate, endDate) {
    const response = await axios.get(`${API_BASE_URL}/audit/activities`, {
        params: { startDate, endDate },
        headers: getAuthHeaders(),
        withCredentials: false,
    });
    return response.data;
}
