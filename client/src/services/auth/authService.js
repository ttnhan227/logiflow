import api from '../api';

// Get base URL (removes /api suffix)
const getBaseUrl = () => {
  const baseURL = api.defaults.baseURL; // http://localhost:8080/api
  return baseURL.replace(/\/api\/?$/, ''); // http://localhost:8080
};

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, username: returnedUsername, role, profilePictureUrl } = response.data;
    
    localStorage.setItem('token', token);
    
    // Build full user object with profilePictureUrl
    const userObj = {
      username: returnedUsername || username, 
      role,
      profilePictureUrl: profilePictureUrl 
        ? `${getBaseUrl()}${profilePictureUrl}`
        : null,
    };
    
    localStorage.setItem('user', JSON.stringify(userObj));
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear any auth headers
    delete api.defaults.headers.common['Authorization'];
    // Force a page reload to clear any application state
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getAuthHeader: () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  getBaseUrl,
};

export default authService;
