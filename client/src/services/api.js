import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
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
    if ([401, 403].includes(error.response?.status)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle error response
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || error.message || 'An error occurred';
    
    // If response body is empty (400 from upload), provide generic message
    if (error.response?.status === 400 && !errorMessage) {
      return Promise.reject('Validation error: Invalid file or request');
    }
    
    return Promise.reject(errorData || errorMessage);
  }
);

export default api;
