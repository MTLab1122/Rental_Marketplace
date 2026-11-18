'use client';

import React, { useEffect, useState } from 'react';
import { getAdminUsers, suspendUser, unsuspendUser } from '../../lib/api';

export default function TenantsManagementPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [subType, setSubType] = useState<'ALL' | 'STUDENT' | 'FAMILY'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

  // Suspend modal state
  const [suspendTargetId, setSuspendTargetId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { role: 'TENANT', limit: 100 };
      if (search) params.search = search;
      const res = await getAdminUsers(params);
      let list = res?.items || [];

      // Filter by student vs family if subType is selected
      if (subType === 'STUDENT') {
        list = list.filter(
          (u: any) => u.tenantProfile?.subType === 'STUDENT' || u.tenantProfile?.studentDetails,
        );
      } else if (subType === 'FAMILY') {
        list = list.filter(
          (u: any) => u.tenantProfile?.subType === 'FAMILY' || u.tenantProfile?.familyDetails,
        );
      }

      setTenants(list);
    } catch (err: any) {
      alert(`Failed to load tenants: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [subType]);

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
      loadTenants();
    } catch (err: any) {
      alert(`Suspend failed: ${err?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (id: string) => {
    try {
      await unsuspendUser(id);
      loadTenants();
    } catch (err: any) {
      alert(`Unsuspend failed: ${err?.message}`);
    }
  };

  const studentCount = tenants.filter(
    (t) => t.tenantProfile?.subType === 'STUDENT' || t.tenantProfile?.studentDetails,
  ).length;
  const familyCount = tenants.filter(
    (t) => t.tenantProfile?.subType === 'FAMILY' || t.tenantProfile?.familyDetails,
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🎓</span> Tenant Management
          </h1>
          <p className="text-sm text-slate-400">
            Enforcing strict segregation between Student and Family tenant profiles across Peshawar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTenants}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs uppercase font-semibold text-slate-400">Total Filtered Tenants</p>
          <p className="text-3xl font-extrabold text-white mt-2">{tenants.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 border-l-4 border-l-sky-500">
          <p className="text-xs uppercase font-semibold text-sky-400">Student Tenants</p>
          <p className="text-3xl font-extrabold text-white mt-2">{studentCount}</p>
          <p className="text-xs text-slate-400 mt-1">UOP, IMSciences, UET, CECOS, etc.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs uppercase font-semibold text-emerald-400">Family Tenants</p>
          <p className="text-3xl font-extrabold text-white mt-2">{familyCount}</p>
          <p className="text-xs text-slate-400 mt-1">Verified Family units with family size</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTenants()}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-4 py-2 w-full md:w-80 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={loadTenants}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition"
          >
            Search
          </button>
        </div>

        {/* SubType tabs */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setSubType('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              subType === 'ALL'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Tenants
          </button>
          <button
            onClick={() => setSubType('STUDENT')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              subType === 'STUDENT'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Students Only
          </button>
          <button
            onClick={() => setSubType('FAMILY')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              subType === 'FAMILY'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Families Only
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading tenants...</div>
        ) : tenants.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            No tenants found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Tenant</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Profile Details</th>
                  <th className="px-6 py-4">Phone / Verified</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tenants.map((t) => {
                  const isStudent =
                    t.tenantProfile?.subType === 'STUDENT' || t.tenantProfile?.studentDetails;
                  const studentData = t.tenantProfile?.studentDetails;
                  const familyData = t.tenantProfile?.familyDetails;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{t.fullName}</div>
                        <div className="text-xs text-slate-400">{t.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {isStudent ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                            🎓 Student
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            👨‍👩‍👧 Family
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {isStudent ? (
                          <div>
                            <span className="text-slate-200 font-medium">
                              {studentData?.universityName || 'University Student'}
                            </span>
                            {studentData?.department && (
                              <div className="text-slate-400">{studentData.department}</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-200 font-medium">
                              Family Size: {familyData?.familySize || 'N/A'}
                            </span>
                            {familyData?.occupation && (
                              <div className="text-slate-400">
                                Occupation: {familyData.occupation}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-300">{t.phone}</div>
                        {t.isPhoneVerified ? (
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            ✓ Verified Phone
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {t.isSuspended ? (
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-950 text-red-400 border border-red-800">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedTenant(t)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition"
                        >
                          Details
                        </button>
                        {t.isSuspended ? (
                          <button
                            onClick={() => handleUnsuspend(t.id)}
                            className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 text-xs rounded transition"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSuspendTargetId(t.id);
                              setSuspendReason('');
                            }}
                            className="px-3 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 text-xs rounded transition"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tenant Details Drawer / Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Tenant Inspection</h3>
              <button
                onClick={() => setSelectedTenant(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-medium text-white">{selectedTenant.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{selectedTenant.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-200">{selectedTenant.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-sky-400">
                  {selectedTenant.tenantProfile?.subType || 'TENANT'}
                </span>
              </div>

              {selectedTenant.tenantProfile?.studentDetails && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 mt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Student Details
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">University:</span>
                    <span className="text-slate-200">
                      {selectedTenant.tenantProfile.studentDetails.universityName}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Student ID / Roll No:</span>
                    <span className="text-slate-200">
                      {selectedTenant.tenantProfile.studentDetails.studentId || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Department:</span>
                    <span className="text-slate-200">
                      {selectedTenant.tenantProfile.studentDetails.department || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Enrollment Year:</span>
                    <span className="text-slate-200">
                      {selectedTenant.tenantProfile.studentDetails.enrollmentYear || 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {selectedTenant.tenantProfile?.familyDetails && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 mt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Family Details
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Family Size:</span>
                    <span className="text-slate-200">
                      {selectedTenant.tenantProfile.familyDetails.familySize} members
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Occupation:</span>
                    <span className="text-slate-200">
                      {selectedTenant.tenantProfile.familyDetails.occupation || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Children:</span>
                    <span className="text-slate-200">
                      {selectedTenant.tenantProfile.familyDetails.childrenCount ?? 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedTenant(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendTargetId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">Suspend Tenant</h3>
            <p className="text-sm text-slate-400">
              Suspending this tenant revokes active sessions and blocks platform inquiries. Provide
              an audit reason:
            </p>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-red-500"
              rows={3}
              placeholder="e.g. Terms of service violation, disruptive inquiry spam..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSuspendTargetId(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={actionLoading || !suspendReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
