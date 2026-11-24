import axios from 'axios';
import { apiBaseUrl } from '../config/env';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

let csrfTokenFallback = null;

function readCookie(name) {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

// Attach CSRF token on mutating requests
api.interceptors.request.use(config => {
  const method = (config.method || 'get').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    const csrfToken = readCookie('XSRF-TOKEN') || csrfTokenFallback;
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  response => {
    const requestUrl = response.config?.url || '';
    if (requestUrl.includes('/auth/logout')) {
      csrfTokenFallback = null;
    } else {
      const headerToken =
        response.headers?.get?.('x-xsrf-token') ?? response.headers?.['x-xsrf-token'];
      if (typeof headerToken === 'string' && headerToken.trim().length > 0) {
        csrfTokenFallback = headerToken.trim();
      }
    }
    return response;
  },
  error => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/');

    if (error.response?.status === 401 || requestUrl.includes('/auth/logout')) {
      csrfTokenFallback = null;
    }

    // Keep original axios error for auth endpoints so pages can read HTTP status codes.
    if (isAuthRequest) {
      return Promise.reject(error);
    }

    // Only logout on 401 (token invalid/expired), not on 403 (permission denied)
    if (error.response?.status === 401) {
      try {
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: null }));
      } catch {
        window.dispatchEvent(new Event('userUpdated'));
      }
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
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
