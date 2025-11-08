import api from '../api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user, role } = response.data;
    
    localStorage.setItem('token', token);
    // Store the username correctly - if user is the username string, use it directly
    // If user is an object with a username property, use user.username
    const usernameToStore = typeof user === 'string' ? user : user?.username || username;
    localStorage.setItem('user', JSON.stringify({ 
      username: usernameToStore, 
      role 
    }));
    
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
};

export default authService;
