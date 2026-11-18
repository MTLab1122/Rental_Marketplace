'use client';

import React, { useEffect, useState } from 'react';
import { getAdminReports, resolveReport, dismissReport } from '../../lib/api';

export default function ReportsManagementPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED' | 'DISMISSED' | ''>(
    'PENDING',
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Resolution modal
  const [actionType, setActionType] = useState<'RESOLVE' | 'DISMISS' | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await getAdminReports(statusFilter || undefined);
      setReports(res || []);
    } catch (err: any) {
      alert(`Failed to load reports: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const handleAction = async () => {
    if (!selectedReport || !actionType) return;
    if (!resolutionNotes.trim()) {
      alert('Resolution notes are required.');
      return;
    }

    try {
      setActionLoading(true);
      if (actionType === 'RESOLVE') {
        await resolveReport(selectedReport.id, resolutionNotes.trim());
      } else {
        await dismissReport(selectedReport.id, resolutionNotes.trim());
      }
      setSelectedReport(null);
      setActionType(null);
      setResolutionNotes('');
      loadReports();
    } catch (err: any) {
      alert(`Action failed: ${err?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>⚠️</span> Report Resolution Console
          </h1>
          <p className="text-sm text-slate-400">
            Moderate community reports regarding fraudulent listings, spam, safety issues, or
            guideline violations
          </p>
        </div>
        <button
          onClick={loadReports}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            statusFilter === 'RESOLVED'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Resolved
        </button>
        <button
          onClick={() => setStatusFilter('DISMISSED')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            statusFilter === 'DISMISSED'
              ? 'bg-slate-800 text-slate-300 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Dismissed
        </button>
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            statusFilter === ''
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Reports
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No reports found for this status.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Report Details</th>
                  <th className="px-6 py-4">Category / Reason</th>
                  <th className="px-6 py-4">Reporter</th>
                  <th className="px-6 py-4">Target Listing / User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-semibold text-white truncate">
                        {r.title || r.reason || 'User Report'}
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                        {r.description || r.details || '—'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                        {r.category || r.reason || 'GENERAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-medium text-slate-200">
                        {r.reporter?.fullName || 'Anonymous'}
                      </div>
                      <div className="text-slate-400">
                        {r.reporter?.email || r.reporter?.phone || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {r.property ? (
                        <div>
                          <span className="text-sky-400 font-medium">
                            Property #{r.property.id?.slice(0, 8)}
                          </span>
                          <div className="text-slate-400 truncate max-w-[180px]">
                            {r.property.title}
                          </div>
                        </div>
                      ) : r.reportedUser ? (
                        <div>
                          <span className="text-amber-400 font-medium">
                            User #{r.reportedUser.id?.slice(0, 8)}
                          </span>
                          <div className="text-slate-400">{r.reportedUser.fullName}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500">General Platform</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {r.status === 'PENDING' && (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                          Pending
                        </span>
                      )}
                      {r.status === 'RESOLVED' && (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Resolved
                        </span>
                      )}
                      {r.status === 'DISMISSED' && (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Dismissed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {r.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedReport(r);
                              setActionType('RESOLVE');
                              setResolutionNotes('');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(r);
                              setActionType('DISMISS');
                              setResolutionNotes('');
                            }}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded border border-slate-700 transition"
                          >
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedReport(r);
                            setActionType(null);
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition"
                        >
                          View Details
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

      {/* Report Details & Resolution Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">
                {actionType === 'RESOLVE'
                  ? 'Resolve Report'
                  : actionType === 'DISMISS'
                    ? 'Dismiss Report'
                    : 'Report Inspection'}
              </h3>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Category / Reason:</span>
                <span className="font-semibold text-white">
                  {selectedReport.category || selectedReport.reason}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Report Description:</span>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 text-xs">
                  {selectedReport.description ||
                    selectedReport.details ||
                    'No additional description provided.'}
                </p>
              </div>

              {selectedReport.property && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="font-semibold text-sky-400 block mb-1">Target Property:</span>
                  <div className="text-slate-200">{selectedReport.property.title}</div>
                  <div className="text-slate-400">
                    {selectedReport.property.locality?.name || 'Peshawar'}
                  </div>
                </div>
              )}

              {selectedReport.resolutionNotes && (
                <div>
                  <span className="text-slate-400 block mb-1">Previous Resolution Notes:</span>
                  <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 text-xs">
                    {selectedReport.resolutionNotes}
                  </p>
                </div>
              )}

              {actionType && (
                <div>
                  <label className="text-slate-300 block font-medium mb-1">
                    {actionType === 'RESOLVE'
                      ? 'Resolution Notes (Remediation Taken):'
                      : 'Dismissal Reason / Notes:'}
                  </label>
                  <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                    rows={3}
                    placeholder="Provide details on the investigation, moderator action, or dismissal justification..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setActionType(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm"
              >
                Close
              </button>
              {actionType && (
                <button
                  onClick={handleAction}
                  disabled={actionLoading || !resolutionNotes.trim()}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition ${
                    actionType === 'RESOLVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {actionLoading
                    ? 'Saving...'
                    : actionType === 'RESOLVE'
                      ? 'Confirm Resolution'
                      : 'Confirm Dismissal'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
