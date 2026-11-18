'use client';

import React, { useEffect, useState } from 'react';
import {
  getAdminVerifications,
  getAdminVerification,
  approveVerification,
  rejectVerification,
  expireVerification,
} from '../../lib/api';

export default function VerificationQueuePage() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inspection Drawer
  const [inspectingVer, setInspectingVer] = useState<any | null>(null);

  // Reject Reason Modal
  const [isRejectOpen, setIsRejectOpen] = useState<boolean>(false);
  const [targetVerId, setTargetVerId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchVerifications = async (status: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminVerifications(status);
      setVerifications(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications(selectedStatus);
  }, [selectedStatus]);

  const handleInspect = async (id: string) => {
    try {
      const data = await getAdminVerification(id);
      setInspectingVer(data);
    } catch (err: any) {
      alert(`Failed to load details: ${err?.message}`);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this landlord? They will immediately receive publishing permissions.')) {
      return;
    }
    try {
      await approveVerification(id, 'Identity and NADRA CNIC approved by admin');
      setInspectingVer(null);
      fetchVerifications(selectedStatus);
    } catch (err: any) {
      alert(`Approval failed: ${err?.message}`);
    }
  };

  const handleExpire = async (id: string) => {
    try {
      await expireVerification(id);
      setInspectingVer(null);
      fetchVerifications(selectedStatus);
    } catch (err: any) {
      alert(`Action failed: ${err?.message}`);
    }
  };

  const handleConfirmReject = async () => {
    if (!targetVerId || !rejectReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      setActionLoading(true);
      await rejectVerification(targetVerId, rejectReason.trim());
      setIsRejectOpen(false);
      setTargetVerId(null);
      setRejectReason('');
      setInspectingVer(null);
      fetchVerifications(selectedStatus);
    } catch (err: any) {
      alert(`Rejection failed: ${err?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Landlord Verification Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            NADRA CNIC & Selfie Liveness moderation for Peshawar property owners
          </p>
        </div>
        <button
          onClick={() => fetchVerifications(selectedStatus)}
          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        {[
          { label: 'Pending Queue', value: 'PENDING' },
          { label: 'Verified Landlords', value: 'VERIFIED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Expired', value: 'EXPIRED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              selectedStatus === tab.value
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading verifications...</div>
        ) : verifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            No verification records in {selectedStatus} status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">CNIC Number</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">
                        {v.user?.fullName || v.fullName || 'Landlord Applicant'}
                      </div>
                      <div className="text-[11px] text-slate-500">{v.user?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {v.cnicNumberMasked || '17301-*******-1'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {v.user?.phoneNumber || v.phoneNumber}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.status === 'VERIFIED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : v.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleInspect(v.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      >
                        Inspect Evidence
                      </button>
                      {v.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(v.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setTargetVerId(v.id);
                              setIsRejectOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {v.status === 'APPROVED' && (
                        <button
                          onClick={() => handleExpire(v.id)}
                          className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-800 text-xs font-semibold transition"
                        >
                          Expire
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Evidence Modal */}
      {inspectingVer && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  {inspectingVer.user?.fullName ||
                    inspectingVer.fullName ||
                    'Landlord Verification'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  CNIC: {inspectingVer.cnicNumberMasked || '17301-*******-1'}
                </p>
              </div>
              <button
                onClick={() => setInspectingVer(null)}
                className="text-slate-400 hover:text-slate-100 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Document Evidence Images */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-400 uppercase">
                Document Evidence
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">CNIC Front</div>
                  <div className="h-36 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                    {inspectingVer.cnicFrontUrl ? (
                      <img
                        src={inspectingVer.cnicFrontUrl}
                        alt="CNIC Front"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Not provided</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">CNIC Back</div>
                  <div className="h-36 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                    {inspectingVer.cnicBackUrl ? (
                      <img
                        src={inspectingVer.cnicBackUrl}
                        alt="CNIC Back"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Not provided</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">
                    Selfie / Liveness
                  </div>
                  <div className="h-36 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                    {inspectingVer.selfieUrl ? (
                      <img
                        src={inspectingVer.selfieUrl}
                        alt="Selfie"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Not provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {inspectingVer.reviewNotes && (
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
                <span className="font-bold text-slate-400">Review Notes:</span>{' '}
                {inspectingVer.reviewNotes}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setInspectingVer(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close
              </button>
              {inspectingVer.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      setTargetVerId(inspectingVer.id);
                      setIsRejectOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(inspectingVer.id)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                  >
                    Approve Verification
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Reject Landlord Verification</h3>
            <p className="text-xs text-slate-400">
              Provide specific feedback to the landlord (e.g. blurry CNIC photo, cropped edges, or
              face mismatch).
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. The photo of your CNIC front is blurry and text is unreadable. Please re-submit with clear lighting."
              rows={4}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setIsRejectOpen(false);
                  setTargetVerId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !rejectReason.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
