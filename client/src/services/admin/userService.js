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

// Map driver DTO to UI shape
const mapDriverDtoToUi = (d) => ({
  id: d?.userId,
  username: d?.username,
  email: d?.email,
  fullName: d?.fullName,
  phone: d?.phone,
  profilePictureUrl: d?.profilePictureUrl
    ? (d.profilePictureUrl.startsWith('http://') || d.profilePictureUrl.startsWith('https://')
        ? d.profilePictureUrl
        : `${getBaseUrl()}${d.profilePictureUrl.startsWith('/') ? '' : '/'}${d.profilePictureUrl}`)
    : null,
  role: d?.roleName,
  active: d?.isActive,
  createdAt: d?.createdAt,
  lastLogin: d?.lastLogin,
  // Driver-specific fields
  licenseType: d?.licenseType,
  licenseNumber: d?.licenseNumber,
  licenseExpiryDate: d?.licenseExpiryDate,
  licenseIssueDate: d?.licenseIssueDate,
  yearsExperience: d?.yearsExperience,
  healthStatus: d?.healthStatus,
  currentLocationLat: d?.currentLocationLat,
  currentLocationLng: d?.currentLocationLng,
  rating: d?.rating,
  status: d?.status,
});

// Map customer DTO to UI shape
const mapCustomerDtoToUi = (c) => ({
  id: c?.userId,
  username: c?.username,
  email: c?.email,
  fullName: c?.fullName,
  phone: c?.phone,
  profilePictureUrl: c?.profilePictureUrl
    ? (c.profilePictureUrl.startsWith('http://') || c.profilePictureUrl.startsWith('https://')
        ? c.profilePictureUrl
        : `${getBaseUrl()}${c.profilePictureUrl.startsWith('/') ? '' : '/'}${c.profilePictureUrl}`)
    : null,
  role: c?.roleName,
  active: c?.isActive,
  createdAt: c?.createdAt,
  lastLogin: c?.lastLogin,
  // Customer-specific fields
  companyName: c?.companyName,
  companyCode: c?.companyCode,
  defaultDeliveryAddress: c?.defaultDeliveryAddress,
  preferredPaymentMethod: c?.preferredPaymentMethod,
  totalOrders: c?.totalOrders,
  totalSpent: c?.totalSpent,
  lastOrderDate: c?.lastOrderDate,
});

// Map dispatcher DTO to UI shape (same as regular user for now)
const mapDispatcherDtoToUi = mapDtoToUi;

// Map role-specific pages
const mapDriverPage = (p) => ({
  content: Array.isArray(p?.content) ? p.content.map(mapDriverDtoToUi) : [],
  totalElements: p?.totalElements ?? 0,
  number: p?.number ?? 0,
  size: p?.size ?? 0,
});

const mapCustomerPage = (p) => ({
  content: Array.isArray(p?.content) ? p.content.map(mapCustomerDtoToUi) : [],
  totalElements: p?.totalElements ?? 0,
  number: p?.number ?? 0,
  size: p?.size ?? 0,
});

const mapDispatcherPage = (p) => ({
  content: Array.isArray(p?.content) ? p.content.map(mapDispatcherDtoToUi) : [],
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

  // Role-specific methods
  getDrivers: (page = 0, size = 10) =>
    api
      .get('/admin/user-management/drivers', { params: { page, size } })
      .then((res) => mapDriverPage(res.data)),

  getCustomers: (page = 0, size = 10) =>
    api
      .get('/admin/user-management/customers', { params: { page, size } })
      .then((res) => mapCustomerPage(res.data)),

  getDispatchers: (page = 0, size = 10) =>
    api
      .get('/admin/user-management/dispatchers', { params: { page, size } })
      .then((res) => mapDispatcherPage(res.data)),

  searchDrivers: (term, page = 0, size = 10) =>
    api
      .get('/admin/user-management/drivers/search', { params: { term, page, size } })
      .then((res) => mapDriverPage(res.data)),

  searchCustomers: (term, page = 0, size = 10) =>
    api
      .get('/admin/user-management/customers/search', { params: { term, page, size } })
      .then((res) => mapCustomerPage(res.data)),

  searchDispatchers: (term, page = 0, size = 10) =>
    api
      .get('/admin/user-management/dispatchers/search', { params: { term, page, size } })
      .then((res) => mapDispatcherPage(res.data)),
};

export default userService;
