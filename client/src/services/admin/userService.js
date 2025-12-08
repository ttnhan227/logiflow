import api from '../api';

// Get base URL (removes /api suffix)
const getBaseUrl = () => {
  const baseURL = api.defaults.baseURL; // http://localhost:8080/api
  return baseURL.replace(/\/api\/?$/, ''); // http://localhost:8080
};

// Map backend DTO -> UI shape
const mapDtoToUi = (u) => ({
  id: u?.userId,
  username: u?.username,
  email: u?.email,
  fullName: u?.fullName,
  phone: u?.phone,
  profilePictureUrl: u?.profilePictureUrl
    ? (u.profilePictureUrl.startsWith('http://') || u.profilePictureUrl.startsWith('https://')
        ? u.profilePictureUrl
        : `${getBaseUrl()}${u.profilePictureUrl.startsWith('/') ? '' : '/'}${u.profilePictureUrl}`)
    : null,
  role: u?.roleName,
  active: u?.isActive,
  createdAt: u?.createdAt,
  lastLogin: u?.lastLogin,
});

// Map Spring Page<UserDto> -> UI page with mapped content
const mapPage = (p) => ({
  content: Array.isArray(p?.content) ? p.content.map(mapDtoToUi) : [],
  totalElements: p?.totalElements ?? 0,
  number: p?.number ?? 0,
  size: p?.size ?? 0,
});

const userService = {
  // List with pagination
  getUsers: (page = 0, size = 10) =>
    api
      .get('/admin/user-management', { params: { page, size } })
      .then((res) => mapPage(res.data)),

  // Single user by id
  getUserById: (id) =>
    api
      .get(`/admin/user-management/${id}`)
      .then((res) => mapDtoToUi(res.data)),

  // Filter by role (backend returns array, not Page)
  getUsersByRole: (roleName) =>
    api
      .get(`/admin/user-management/role/${roleName}`)
      .then((res) => (Array.isArray(res.data) ? res.data.map(mapDtoToUi) : [])),

  // Active users (array)
  getActiveUsers: () =>
    api
      .get('/admin/user-management/active')
      .then((res) => (Array.isArray(res.data) ? res.data.map(mapDtoToUi) : [])),

  // Search (paged)
  searchUsers: (term, page = 0, size = 10) =>
    api
      .get('/admin/user-management/search', { params: { term, page, size } })
      .then((res) => mapPage(res.data)),

  // Create user: Backend requires password and roleId.
  // This call expects the caller to pass proper backend fields already.
  // We keep as-is to avoid guessing roleId/password from UI.
  createUser: (userData) =>
    api.post('/admin/user-management', userData).then((res) => res.data).then(mapDtoToUi),

  // Update user: map UI -> backend DTO shape
  // UI provides: { id, username, email, fullName, phone, profilePictureUrl, role, active }
  // Backend expects: { userId, username, email, fullName, phone, profilePictureUrl, roleId?, isActive? }
  updateUser: (userData) => {
    const payload = {
      userId: userData.id,
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone,
      profilePictureUrl: userData.profilePictureUrl,
      // roleId intentionally omitted unless provided; role name -> id mapping not available here
      isActive: userData.active,
    };
    // Include roleId if caller provides it explicitly
    if (userData.roleId != null) payload.roleId = userData.roleId;
    return api.put('/admin/user-management', payload).then((res) => mapDtoToUi(res.data));
  },

  // Toggle status returns a UserDto; map to UI
  toggleUserStatus: (id) =>
    api
      .put(`/admin/user-management/${id}/toggle-status`)
      .then((res) => mapDtoToUi(res.data)),
};

export default userService;
