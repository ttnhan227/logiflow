const DEFAULT_API_BASE_URL = 'http://localhost:8080/api';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
const apiBaseUrl = rawApiBaseUrl.replace(/\/$/, '');
const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

export { apiBaseUrl, backendBaseUrl };