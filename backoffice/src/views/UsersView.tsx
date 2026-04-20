// ═══════════════════════════════════════════════════════════════
// Users View - Super Admin Backoffice
// Manage users and their roles
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Users as UsersIcon, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { User } from '../types';

const ROLE_CONFIG = {
  user: { label: 'User', color: 'bg-slate-100 text-slate-800', icon: '👤' },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800', icon: '👨‍💼' },
  super_admin: { label: 'Super Admin', color: 'bg-amber-100 text-amber-800', icon: '👑' },
};

export default function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    const response = await api.get<User[]>('/api/superadmin/users');

    if (response.success && response.data) {
      setUsers(response.data);
    } else {
      setError(response.error?.message || 'Failed to load users');
    }

    setLoading(false);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);

    const response = await api.patch(`/api/superadmin/users/${userId}/role`, {
      role: newRole,
    });

    if (response.success) {
      await loadUsers(); // Reload to get updated data
    } else {
      alert(response.error?.message || 'Failed to update role');
    }

    setUpdatingRole(null);
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return user.email.toLowerCase().includes(search) || user.id.toLowerCase().includes(search);
  });

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Users Management</h1>
            <p className="text-slate-600">Manage user accounts and assign roles</p>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by email or ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error Loading Users</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-2xl font-bold text-slate-900">
            {users.filter((u) => u.role === 'user').length}
          </div>
          <div className="text-sm text-slate-600">Regular Users</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter((u) => u.role === 'admin').length}
          </div>
          <div className="text-sm text-slate-600">Admins</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-2xl font-bold text-amber-600">
            {users.filter((u) => u.role === 'super_admin').length}
          </div>
          <div className="text-sm text-slate-600">Super Admins</div>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No users found</p>
          {searchTerm && <p className="text-slate-500 text-sm mt-2">Try adjusting your search</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{user.email}</div>
                      <div className="text-sm text-slate-500">{user.id.slice(0, 8)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role && ROLE_CONFIG[user.role] ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ROLE_CONFIG[user.role].color
                        }`}
                      >
                        {ROLE_CONFIG[user.role].icon}
                        {ROLE_CONFIG[user.role].label}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">No role</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{getRelativeTime(user.created_at)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => {
                        if (
                          confirm(
                            `Change role for ${user.email} to ${ROLE_CONFIG[e.target.value as keyof typeof ROLE_CONFIG].label}?`
                          )
                        ) {
                          handleUpdateRole(user.id, e.target.value);
                        }
                      }}
                      disabled={updatingRole === user.id}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                    >
                      {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.icon} {config.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <div className="mt-4 text-sm text-slate-600 text-center">
          Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
