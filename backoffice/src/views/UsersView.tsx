// ═══════════════════════════════════════════════════════════════
// Users View - Super Admin Backoffice
// Manage users and their roles
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Users as UsersIcon, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { User } from '../types';
import {
  Badge,
  Button,
  Input,
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from '../components/ui';

const ROLE_CONFIG = {
  user: { label: 'User', variant: 'user', icon: '👤' },
  admin: { label: 'Admin', variant: 'admin', icon: '👨‍💼' },
  super_admin: { label: 'Super Admin', variant: 'super_admin', icon: '👑' },
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
      await loadUsers();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
            <p className="text-slate-400">Manage user accounts and assign roles</p>
          </div>
          <Button variant="secondary" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            icon={<Search />}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by email or ID..."
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Error Loading Users</p>
            <p className="text-sm text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<UsersIcon />}
          label="Regular Users"
          value={users.filter((u) => u.role === 'user').length}
          subtext="Standard access level"
          color="purple"
        />
        <StatCard
          icon={<UsersIcon />}
          label="Admins"
          value={users.filter((u) => u.role === 'admin').length}
          subtext="Elevated privileges"
          color="blue"
        />
        <StatCard
          icon={<UsersIcon />}
          label="Super Admins"
          value={users.filter((u) => u.role === 'super_admin').length}
          subtext="Full system access"
          color="amber"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            <TableEmptyState
              icon={<UsersIcon className="w-12 h-12" />}
              title="No users found"
              description={searchTerm ? 'Try adjusting your search' : undefined}
            />
          </TableBody>
        </Table>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-white">{user.email}</div>
                    <div className="text-sm text-slate-500">{user.id.slice(0, 8)}...</div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.role && ROLE_CONFIG[user.role] ? (
                    <Badge variant={ROLE_CONFIG[user.role].variant as any}>
                      {ROLE_CONFIG[user.role].icon} {ROLE_CONFIG[user.role].label}
                    </Badge>
                  ) : (
                    <span className="text-sm text-slate-500">No role</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-400">{getRelativeTime(user.created_at)}</div>
                </TableCell>
                <TableCell>
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
                    className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50"
                  >
                    {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Results Count */}
      {!loading && (
        <div className="mt-4 text-sm text-slate-500 text-center">
          Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
