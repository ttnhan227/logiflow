import api from '../api';

const userService = {
  getUsers: (page = 0, size = 10) => 
    api.get('/admin/user-management', { params: { page, size } })
      .then(response => response.data),

  getUserById: (id) => 
    api.get(`/admin/user-management/${id}`)
      .then(response => response.data),

  getUsersByRole: (roleName) => 
    api.get(`/admin/user-management/role/${roleName}`)
      .then(response => response.data),

  getActiveUsers: () => 
    api.get('/admin/user-management/active')
      .then(response => response.data),

  searchUsers: (term, page = 0, size = 10) => 
    api.get('/admin/user-management/search', { params: { term, page, size } })
      .then(response => response.data),

  createUser: (userData) => 
    api.post('/admin/user-management', userData)
      .then(response => response.data),

  updateUser: (userData) => 
    api.put(`/admin/user-management/${userData.id}`, userData)
      .then(response => response.data),

  toggleUserStatus: (id) => 
    api.patch(`/admin/user-management/${id}/toggle-status`)
      .then(response => response.data),

  deleteUser: (id) => 
    api.delete(`/admin/user-management/${id}`)
};

export default userService;
