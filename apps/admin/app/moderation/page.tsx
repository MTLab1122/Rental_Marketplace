'use client';

import React, { useEffect, useState } from 'react';
import {
  getAdminProperties,
  getAdminProperty,
  approveProperty,
  rejectProperty,
  suspendProperty,
  restoreProperty,
} from '../../lib/api';

export default function ModerationQueuePage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING_REVIEW');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detail inspection modal
  const [inspectingProperty, setInspectingProperty] = useState<any | null>(null);

  // Reason modal
  const [actionType, setActionType] = useState<'REJECT' | 'SUSPEND' | null>(null);
  const [targetPropertyId, setTargetPropertyId] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchQueue = async (status: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminProperties({ status, limit: 50 });
      setProperties(res?.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(selectedStatus);
  }, [selectedStatus]);

  const handleInspect = async (id: string) => {
    try {
      const detail = await getAdminProperty(id);
      setInspectingProperty(detail);
    } catch (err: any) {
      alert(`Failed to load details: ${err?.message}`);
    }
  };

  const handleApprove = async (id: string) => {
    if (
      !confirm('Are you sure you want to APPROVE this property for publication in Peshawar search?')
    ) {
      return;
    }
    try {
      await approveProperty(id);
      setInspectingProperty(null);
      fetchQueue(selectedStatus);
    } catch (err: any) {
      alert(`Approval failed: ${err?.message}`);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreProperty(id);
      setInspectingProperty(null);
      fetchQueue(selectedStatus);
    } catch (err: any) {
      alert(`Restore failed: ${err?.message}`);
    }
  };

  const handleConfirmReasonAction = async () => {
    if (!targetPropertyId || !reasonText.trim()) {
      alert('A reason is mandatory for rejection or suspension.');
      return;
    }
    try {
      setActionLoading(true);
      if (actionType === 'REJECT') {
        await rejectProperty(targetPropertyId, reasonText.trim());
      } else if (actionType === 'SUSPEND') {
        await suspendProperty(targetPropertyId, reasonText.trim());
      }
      setActionType(null);
      setTargetPropertyId(null);
      setReasonText('');
      setInspectingProperty(null);
      fetchQueue(selectedStatus);
    } catch (err: any) {
      alert(`Action failed: ${err?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Property Moderation Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review, inspect, approve, or reject rental properties before publication
          </p>
        </div>
        <button
          onClick={() => fetchQueue(selectedStatus)}
          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        {[
          { label: 'Pending Review', value: 'PENDING_REVIEW' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Suspended', value: 'SUSPENDED' },
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

      {/* Properties Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading listings...</div>
        ) : properties.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            No properties found in {selectedStatus.replace('_', ' ')} status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Eligibility</th>
                  <th className="py-3.5 px-4">Locality</th>
                  <th className="py-3.5 px-4">Rent (PKR)</th>
                  <th className="py-3.5 px-4">Landlord</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {properties.map((p) => {
                  const firstImage = p.images?.[0]?.url;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {firstImage ? (
                              <img src={firstImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-base text-slate-500">🏠</span>
                            )}
                          </div>
                          <div className="truncate max-w-xs">
                            <div className="font-semibold text-slate-100 truncate">{p.title}</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {p.bedrooms || 1} Bed • {p.bathrooms || 1} Bath •{' '}
                              {p.furnishing || 'Unfurnished'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.eligibility === 'STUDENTS_ONLY'
                              ? 'bg-sky-950 text-sky-400 border border-sky-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {p.eligibility === 'STUDENTS_ONLY' ? 'Students' : 'Families'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {p.locality?.name || p.localityName || 'Peshawar'}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-emerald-400">
                        PKR {p.monthlyRentPkr?.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 truncate max-w-[140px]">
                        {p.landlord?.fullName || 'Verified Landlord'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : p.status === 'PENDING_REVIEW'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleInspect(p.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                        >
                          Inspect
                        </button>
                        {p.status === 'PENDING_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleApprove(p.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setActionType('REJECT');
                                setTargetPropertyId(p.id);
                              }}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {p.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setActionType('SUSPEND');
                              setTargetPropertyId(p.id);
                            }}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                          >
                            Suspend
                          </button>
                        )}
                        {(p.status === 'REJECTED' || p.status === 'SUSPENDED') && (
                          <button
                            onClick={() => handleRestore(p.id)}
                            className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
                          >
                            Restore
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

      {/* Inspect Modal Drawer */}
      {inspectingProperty && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{inspectingProperty.title}</h3>
                <p className="text-xs text-slate-400">
                  {inspectingProperty.locality?.name} • PKR{' '}
                  {inspectingProperty.monthlyRentPkr?.toLocaleString()}/mo
                </p>
              </div>
              <button
                onClick={() => setInspectingProperty(null)}
                className="text-slate-400 hover:text-slate-100 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Photos Grid */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase mb-2">
                Photo Gallery
              </div>
              {inspectingProperty.images?.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {inspectingProperty.images.map((img: any, idx: number) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt=""
                      className="w-full h-24 object-cover rounded-lg border border-slate-800"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">No photos provided</div>
              )}
            </div>

            {/* Description & Attributes */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="font-semibold text-slate-400 uppercase">Description</div>
                <div className="mt-1 text-slate-200 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                  {inspectingProperty.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Eligibility:</span>{' '}
                  <span className="font-bold text-slate-200">{inspectingProperty.eligibility}</span>
                </div>
                <div>
                  <span className="text-slate-400">Property Type:</span>{' '}
                  <span className="font-bold text-slate-200">
                    {inspectingProperty.propertyType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Coordinates:</span>{' '}
                  <span className="font-mono text-slate-200">
                    {inspectingProperty.latitude}, {inspectingProperty.longitude}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Security Deposit:</span>{' '}
                  <span className="font-bold text-emerald-400">
                    PKR {inspectingProperty.securityDepositPkr?.toLocaleString()}
                  </span>
                </div>
              </div>

              {inspectingProperty.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-400">
                  <span className="font-bold">Prior Rejection Reason:</span>{' '}
                  {inspectingProperty.rejectionReason}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex justify-end space-x-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setInspectingProperty(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Close
              </button>
              {inspectingProperty.status === 'PENDING_REVIEW' && (
                <>
                  <button
                    onClick={() => {
                      setActionType('REJECT');
                      setTargetPropertyId(inspectingProperty.id);
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition"
                  >
                    Reject Listing
                  </button>
                  <button
                    onClick={() => handleApprove(inspectingProperty.id)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition"
                  >
                    Approve for Search
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reason Modal (For Reject or Suspend) */}
      {actionType && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">
              {actionType === 'REJECT' ? 'Reject Property Listing' : 'Suspend Property Listing'}
            </h3>
            <p className="text-xs text-slate-400">
              Please state the exact reason for {actionType.toLowerCase()}ing. This reason will be
              logged to the immutable audit trail and notified to the landlord.
            </p>

            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="e.g. Inaccurate location pins, misleading photo quality, or duplicate address."
              rows={4}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setActionType(null);
                  setTargetPropertyId(null);
                  setReasonText('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !reasonText.trim()}
                onClick={handleConfirmReasonAction}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
