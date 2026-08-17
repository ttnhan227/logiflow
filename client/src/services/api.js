import axios from 'axios';
import { apiBaseUrl } from '../config/env';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token && !config.url.includes('/auth/')) {
    config.headers.Authorization = `Bearer ${token.replace(/^"|"$/g, '')}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  response => response,
  error => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/');

    // Keep original axios error for auth endpoints so pages can read HTTP status codes.
    if (isAuthRequest) {
      return Promise.reject(error);
    }

    // Only logout on 401 (token invalid/expired), not on 403 (permission denied)
    if (error.response?.status === 401) {
      // Token is invalid or expired - logout user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    
    // For 403, let the component handle it (user is authenticated but lacks permission)
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      return Promise.reject(errorData || new Error('You do not have permission to access this resource'));
    }
    
    // Handle other error responses
    const errorData = error.response?.data;
    const message =
      (typeof errorData === 'string' && errorData.trim().length > 0 ? errorData : null) ||
      errorData?.message ||
      (errorData?.fieldErrors ? Object.values(errorData.fieldErrors).join('; ') : null) ||
      error.message ||
      'An unexpected error occurred';

    const normalizedError = new Error(message);
    normalizedError.response = error.response;
    normalizedError.data = errorData;
    normalizedError.status = error.response?.status;
    normalizedError.code = errorData?.error || error.code;
    normalizedError.fieldErrors = errorData?.fieldErrors;

    return Promise.reject(normalizedError);
  }
);

export default api;
