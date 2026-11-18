'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminUsers, suspendUser, unsuspendUser } from '../../lib/api';

export default function LandlordsManagementPage() {
  const [landlords, setLandlords] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLandlord, setSelectedLandlord] = useState<any | null>(null);

  // Suspend modal state
  const [suspendTargetId, setSuspendTargetId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadLandlords = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { role: 'LANDLORD', limit: 100 };
      if (search) params.search = search;
      const res = await getAdminUsers(params);
      let list = res?.items || [];

      if (statusFilter === 'VERIFIED') {
        list = list.filter((l: any) => l.isCnicVerified || l.landlordProfile?.isVerified);
      } else if (statusFilter === 'UNVERIFIED') {
        list = list.filter((l: any) => !l.isCnicVerified && !l.landlordProfile?.isVerified);
      }

      setLandlords(list);
    } catch (err: any) {
      alert(`Failed to load landlords: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLandlords();
  }, [statusFilter]);

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
      loadLandlords();
    } catch (err: any) {
      alert(`Suspend failed: ${err?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (id: string) => {
    try {
      await unsuspendUser(id);
      loadLandlords();
    } catch (err: any) {
      alert(`Unsuspend failed: ${err?.message}`);
    }
  };

  const verifiedCount = landlords.filter(
    (l) => l.isCnicVerified || l.landlordProfile?.isVerified,
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🔑</span> Landlord Management
          </h1>
          <p className="text-sm text-slate-400">
            Verify CNIC credentials, monitor listings inventory, and regulate landlord
            communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/verifications"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition"
          >
            Go to Verification Queue →
          </Link>
          <button
            onClick={loadLandlords}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs uppercase font-semibold text-slate-400">Total Filtered Landlords</p>
          <p className="text-3xl font-extrabold text-white mt-2">{landlords.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs uppercase font-semibold text-emerald-400">
            CNIC Verified Landlords
          </p>
          <p className="text-3xl font-extrabold text-white mt-2">{verifiedCount}</p>
          <p className="text-xs text-slate-400 mt-1">
            Authorized to publish active Peshawar listings
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 border-l-4 border-l-amber-500">
          <p className="text-xs uppercase font-semibold text-amber-400">Pending / Unverified</p>
          <p className="text-3xl font-extrabold text-white mt-2">
            {landlords.length - verifiedCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Awaiting review or document upload</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search landlord by name, email, or CNIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLandlords()}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-4 py-2 w-full md:w-80 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={loadLandlords}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition"
          >
            Search
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Landlords
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Verified Only
          </button>
          <button
            onClick={() => setStatusFilter('UNVERIFIED')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              statusFilter === 'UNVERIFIED'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unverified
          </button>
        </div>
      </div>

      {/* Landlords Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading landlords...</div>
        ) : landlords.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No landlords found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Landlord</th>
                  <th className="px-6 py-4">CNIC Number</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">WhatsApp Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {landlords.map((l) => {
                  const isVerified = l.isCnicVerified || l.landlordProfile?.isVerified;
                  const profile = l.landlordProfile;

                  return (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{l.fullName}</div>
                        <div className="text-xs text-slate-400">{l.email}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{l.phone}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {profile?.cnicNumber || l.cnic || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {isVerified ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            ✓ Verified CNIC
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {profile?.whatsappNumber ? (
                          <span className="text-emerald-400 font-mono">
                            {profile.whatsappNumber}
                          </span>
                        ) : (
                          <span className="text-slate-500">Same as phone</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {l.isSuspended ? (
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
                          onClick={() => setSelectedLandlord(l)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition"
                        >
                          Details
                        </button>
                        {l.isSuspended ? (
                          <button
                            onClick={() => handleUnsuspend(l.id)}
                            className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 text-xs rounded transition"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSuspendTargetId(l.id);
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

      {/* Landlord Details Modal */}
      {selectedLandlord && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Landlord Profile Details</h3>
              <button
                onClick={() => setSelectedLandlord(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-medium text-white">{selectedLandlord.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{selectedLandlord.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Phone:</span>
                <span className="text-slate-200">{selectedLandlord.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CNIC Number:</span>
                <span className="font-mono text-white">
                  {selectedLandlord.landlordProfile?.cnicNumber ||
                    selectedLandlord.cnic ||
                    'Not submitted'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WhatsApp Contact:</span>
                <span className="text-slate-200">
                  {selectedLandlord.landlordProfile?.whatsappNumber || selectedLandlord.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verification Status:</span>
                <span
                  className={
                    selectedLandlord.isCnicVerified || selectedLandlord.landlordProfile?.isVerified
                      ? 'text-emerald-400 font-semibold'
                      : 'text-amber-400 font-semibold'
                  }
                >
                  {selectedLandlord.isCnicVerified || selectedLandlord.landlordProfile?.isVerified
                    ? 'VERIFIED'
                    : 'UNVERIFIED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Status:</span>
                <span
                  className={
                    selectedLandlord.isSuspended
                      ? 'text-red-400 font-semibold'
                      : 'text-emerald-400 font-semibold'
                  }
                >
                  {selectedLandlord.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Link href="/verifications" className="text-xs text-sky-400 hover:underline">
                Inspect pending documents in queue →
              </Link>
              <button
                onClick={() => setSelectedLandlord(null)}
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
            <h3 className="font-bold text-lg text-white">Suspend Landlord</h3>
            <p className="text-sm text-slate-400">
              Suspending this landlord immediately revokes active sessions and hides all their
              published listings from search discovery across Peshawar.
            </p>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-red-500"
              rows={3}
              placeholder="e.g. Fraudulent listing, invalid CNIC, severe tenant complaint..."
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
