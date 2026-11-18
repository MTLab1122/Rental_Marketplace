'use client';

import React, { useEffect, useState } from 'react';
import {
  getAdminUsers,
  suspendUser,
  unsuspendUser,
  updateUserRole,
  deleteUser,
} from '../../lib/api';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);

  // Suspend Dialog
  const [suspendTargetId, setSuspendTargetId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Role Dialog
  const [roleTargetId, setRoleTargetId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('ADMIN');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { limit: 50 };
      if (search) params.search = search;
      if (selectedRole) params.role = selectedRole;
      const res = await getAdminUsers(params);
      setUsers(res?.items || []);
      setTotal(res?.total || 0);
    } catch (err: any) {
      alert(`Failed to load users: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const handleConfirmSuspend = async () => {
    if (!suspendTargetId || !suspendReason.trim()) {
      alert('A suspension reason is required.');
      return;
    }
    try {
      setActionLoading(true);
      await suspendUser(suspendTargetId, suspendReason.trim());
      setSuspendTargetId(null);
      setSuspendReason('');
      loadUsers();
    } catch (err: any) {
      alert(`Suspend failed: ${err?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (id: string) => {
    try {
      await unsuspendUser(id);
      loadUsers();
    } catch (err: any) {
      alert(`Unsuspend failed: ${err?.message}`);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleTargetId) return;
    try {
      setActionLoading(true);
      await updateUserRole(roleTargetId, newRole);
      setRoleTargetId(null);
      loadUsers();
    } catch (err: any) {
      alert(`Role change failed: ${err?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? Only SUPER_ADMIN can execute this.`)) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err: any) {
      alert(`Delete failed: ${err?.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            User Account Governance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, moderate, suspend, and configure roles across all platform accounts ({total}{' '}
            total)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
          placeholder="Search by full name, email, or Pakistani phone number..."
          className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
        />

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="TENANT">Tenants</option>
          <option value="LANDLORD">Landlords</option>
          <option value="ADMIN">Admins</option>
          <option value="MODERATOR">Moderators</option>
          <option value="SUPPORT">Support</option>
          <option value="SUPER_ADMIN">Super Admins</option>
        </select>

        <button
          onClick={loadUsers}
          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
        >
          Search
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading accounts...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Role(s)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">MFA</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => {
                  const roles = u.roles || [];
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">{u.fullName}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-mono">{u.phoneNumber}</td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {roles.map((r: string) => (
                            <span
                              key={r}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r === 'SUPER_ADMIN'
                                  ? 'bg-purple-950 text-purple-400 border border-purple-800'
                                  : r === 'ADMIN'
                                    ? 'bg-sky-950 text-sky-400 border border-sky-800'
                                    : r === 'LANDLORD'
                                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.isSuspended ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.isMfaEnabled ? (
                          <span className="text-emerald-400 font-bold">✓ Active</span>
                        ) : (
                          <span className="text-slate-500">Off</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setRoleTargetId(u.id);
                            setNewRole(roles[0] || 'ADMIN');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                        >
                          Role
                        </button>
                        {u.isSuspended ? (
                          <button
                            onClick={() => handleUnsuspend(u.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setSuspendTargetId(u.id)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(u.id, u.fullName)}
                          className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800 text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspend Reason Dialog */}
      {suspendTargetId && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Suspend User Account</h3>
            <p className="text-xs text-slate-400">
              Suspended users will immediately have all active sessions revoked and will be barred
              from signing in.
            </p>

            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Repeated scam reports, abusive behavior, or suspicious identity documents."
              rows={3}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setSuspendTargetId(null);
                  setSuspendReason('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !suspendReason.trim()}
                onClick={handleConfirmSuspend}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white disabled:opacity-50"
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Dialog */}
      {roleTargetId && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Change User Role</h3>
            <p className="text-xs text-slate-400">
              Requires SUPER_ADMIN authority. Existing user sessions will be refreshed.
            </p>

            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100"
            >
              <option value="TENANT">TENANT</option>
              <option value="LANDLORD">LANDLORD</option>
              <option value="SUPPORT">SUPPORT</option>
              <option value="MODERATOR">MODERATOR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setRoleTargetId(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmRoleChange}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white"
              >
                {actionLoading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
