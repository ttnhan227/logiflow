import React, { useEffect, useState } from 'react';
import { userService } from '../../services';

// Role color mapping
const ROLE_COLORS = {
  ADMIN: '#9333ea',      // purple
  MANAGER: '#3b82f6',    // blue
  DISPATCHER: '#22c55e', // green
  DRIVER: '#f97316',     // orange
  CUSTOMER: '#64748b',   // gray
};

const ROLE_IDS = { ADMIN: 1, MANAGER: 2, DISPATCHER: 3, DRIVER: 4, CUSTOMER: 5 };

// Avatar component with initials
const Avatar = ({ name }) => {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  return (
    <div>
      {initials}
    </div>
  );
};

// Role badge with color
const RoleBadge = ({ role }) => {
  const cls = `role-badge ${role ? role.toLowerCase() : ''}`;
  return (
    <span className={cls}>
      {role || 'N/A'}
    </span>
  );
};

// Status toggle (styled switch)
const StatusToggle = ({ active, onChange }) => {
  return (
    <label className="status-toggle" aria-checked={!!active} role="switch">
      <input
        type="checkbox"
        checked={!!active}
        onChange={onChange}
        aria-label={active ? 'Deactivate user' : 'Activate user'}
      />
      <span className="slider" />
    </label>
  );
};

// Three-dot menu
const ActionsMenu = ({ user, onEdit, onDelete, onViewDetails }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
      >
        ⋮
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
          />
          <div>
            <button
              onClick={() => {
                onViewDetails(user);
                setOpen(false);
              }}
              onMouseEnter={(e) => (e.target.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.target.style.background = 'none')}
            >
              View Details
            </button>
            <button
              onClick={() => {
                onEdit(user);
                setOpen(false);
              }}
              onMouseEnter={(e) => (e.target.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.target.style.background = 'none')}
            >
              Send Email
            </button>
            <div />
            <button
              onClick={() => {
                onDelete(user);
                setOpen(false);
              }}
              onMouseEnter={(e) => (e.target.style.background = '#fef2f2')}
              onMouseLeave={(e) => (e.target.style.background = 'none')}
            >
              Delete User
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Modal for Add/Edit
const UserModal = ({ user, onClose, onSave, roles }) => {
  const [form, setForm] = useState({
    id: user?.id || null,
    username: user?.username || '',
    email: user?.email || '',
    phone: '',
    role: user?.role || 'DISPATCHER',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const rolePermissions = {
    ADMIN: ['Full system access', 'User management', 'System configuration'],
    MANAGER: ['View all routes', 'Assign drivers', 'Generate reports'],
    DISPATCHER: ['Create routes', 'Assign orders', 'Track drivers'],
    DRIVER: ['View assigned routes', 'Update delivery status', 'Upload photos'],
    CUSTOMER: ['Place orders', 'Track deliveries', 'View history'],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (form.id) {
        await onSave({ ...form });
      } else {
        const roleId = ROLE_IDS[form.role];
        if (!roleId) throw new Error('Invalid role selected');
        if (!form.password || form.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await onSave({ ...form, roleId });
      }
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
        >
          <h2>
            {form.id ? 'Edit User' : 'Add New User'}
          </h2>
          {error && (
            <div>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div>
              <label>
                Name *
              </label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label>
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label>
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label>
                Role *
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {!form.id && (
              <div>
                <label>
                  Password *
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!form.id}
                />
                <small>Minimum 6 characters</small>
              </div>
            )}
            {form.role && rolePermissions[form.role] && (
              <div>
                <div>Role Permissions:</div>
                <ul>
                  {rolePermissions[form.role].map((perm, idx) => (
                    <li key={idx}>{perm}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <button
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : form.id ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// Main component
const UserManagementPage = () => {
  const roles = ['ADMIN', 'MANAGER', 'DISPATCHER', 'DRIVER', 'CUSTOMER'];
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUsers(0, 1000); // Load all
      setUsers(data.content || []);
      setFilteredUsers(data.content || []);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
      );
    }
    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }
    setFilteredUsers(result);
    setPage(0);
  }, [searchTerm, roleFilter, users]);

  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleUserStatus(user.id);
      await loadUsers();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to toggle status');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.username}?`)) return;
    try {
      await userService.deleteUser(user.id);
      await loadUsers();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to delete user');
    }
  };

  const handleSave = async (formData) => {
    if (formData.id) {
      await userService.updateUser(formData);
    } else {
      await userService.createUser(formData);
    }
    await loadUsers();
  };

  const paginatedUsers = filteredUsers.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredUsers.length / size);

  return (
    <div className="user-management-container">
      {/* Header */}
      <div>
        <h1>
          User Management
        </h1>
        <p>
          Manage your team members and their permissions
        </p>
      </div>

      {/* Search, Filter, Add */}
      <div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
        >
          + Add User
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div>
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div>Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div>
          <div>👥</div>
          <div>No users found</div>
          <div>
            {searchTerm || roleFilter !== 'ALL'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first user'}
          </div>
        </div>
      ) : (
        <>
          <div>
            <table>
              <thead>
                <tr>
                  <th>
                    User
                  </th>
                  <th>
                    Email
                  </th>
                  <th>
                    Role
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <Avatar name={user.username} />
                        <div>
                          <div>{user.username}</div>
                          <div>ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {user.email}
                    </td>
                    <td>
                      <RoleBadge role={user.role} />
                    </td>
                    <td>
                      <StatusToggle
                        active={user.active}
                        onChange={() => handleToggleStatus(user)}
                      />
                    </td>
                    <td>
                      <div>
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowModal(true);
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                        >
                          🗑️
                        </button>
                        <ActionsMenu
                          user={user}
                          onEdit={(u) => {
                            setEditingUser(u);
                            setShowModal(true);
                          }}
                          onDelete={handleDelete}
                          onViewDetails={(u) => alert(`View details for ${u.username}`)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div>
              <div>
                Showing {page * size + 1} to {Math.min((page + 1) * size, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
              </div>
              <div>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page + 1 >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={handleSave}
          roles={roles}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
