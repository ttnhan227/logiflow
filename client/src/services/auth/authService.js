import api from '../api';

// Get base URL (removes /api suffix)
const getBaseUrl = () => {
  const baseURL = api.defaults.baseURL; // http://localhost:8080/api
  return baseURL.replace(/\/api\/?$/, ''); // http://localhost:8080
};

let currentUser = null;
let sessionPromise = null;

const normalizeProfilePicture = (profilePictureUrl) => {
  if (!profilePictureUrl) return null;
  if (profilePictureUrl.startsWith('http://') || profilePictureUrl.startsWith('https://')) {
    return profilePictureUrl;
  }
  return `${getBaseUrl()}${profilePictureUrl.startsWith('/') ? '' : '/'}${profilePictureUrl}`;
};

const notifyUserUpdated = (userObj) => {
  try {
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: userObj }));
  } catch {
    window.dispatchEvent(new Event('userUpdated'));
  }
};

const authService = {
  initSession: async () => {
    if (currentUser) return currentUser;
    if (!sessionPromise) {
      sessionPromise = api
        .get('/auth/me')
        .then((response) => {
          const { username, role, profilePictureUrl } = response.data || {};
          if (!username) {
            currentUser = null;
            return null;
          }
          currentUser = {
            username,
            role,
            profilePictureUrl: normalizeProfilePicture(profilePictureUrl),
          };
          notifyUserUpdated(currentUser);
          return currentUser;
        })
        .catch(() => {
          currentUser = null;
          return null;
        })
        .finally(() => {
          sessionPromise = null;
        });
    }
    return sessionPromise;
  },

  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { username: returnedUsername, role, profilePictureUrl } = response.data;

    const userObj = {
      username: returnedUsername || username,
      role,
      profilePictureUrl: normalizeProfilePicture(profilePictureUrl),
    };

    currentUser = userObj;
    notifyUserUpdated(userObj);

    return response.data;
  },

  logout: async () => {
    const user = currentUser;
    try {
      await api.post('/auth/logout', null, user?.username ? { params: { username: user.username } } : undefined);
    } catch (error) {
      console.error('Failed to log logout:', error);
    }

    currentUser = null;
    notifyUserUpdated(null);
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  },

  getCurrentUser: () => currentUser,

  setCurrentUser: (userObj) => {
    currentUser = userObj || null;
    notifyUserUpdated(currentUser);
  },

  getAuthHeader: () => ({}),

  getBaseUrl,
};

export default authService;
