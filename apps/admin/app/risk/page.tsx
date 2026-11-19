'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '../../components/AdminShell';
import {
  getRiskEntitiesAdmin,
  reviewEntityRiskAdmin,
  getModerationRecordsAdmin,
  reviewModerationRecordAdmin,
} from '../../lib/api';

export default function AdminRiskPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [moderationRecords, setModerationRecords] = useState<any[]>([]);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState('');
  const [isResolvedFilter, setIsResolvedFilter] = useState('false');
  const [activeTab, setActiveTab] = useState<'risk' | 'moderation'>('risk');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Review modal
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED_CLEARED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [entityTypeFilter, riskLevelFilter, isResolvedFilter, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'risk') {
        const res = await getRiskEntitiesAdmin({
          entityType: entityTypeFilter || undefined,
          riskLevel: riskLevelFilter || undefined,
          isResolved: isResolvedFilter === 'all' ? undefined : isResolvedFilter === 'true',
        });
        setAssessments(res.assessments || []);
      } else {
        const res = await getModerationRecordsAdmin();
        setModerationRecords(res.records || []);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load risk data' });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;

    setActionLoading('review');
    try {
      await reviewEntityRiskAdmin(selectedEntity.entityType, selectedEntity.entityId, {
        isResolved: true,
        decision: reviewDecision,
        resolutionNotes,
      });
      setMessage({
        type: 'success',
        text: `Risk case resolved for ${selectedEntity.entityType} ${selectedEntity.entityId}`,
      });
      setSelectedEntity(null);
      setResolutionNotes('');
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to resolve risk entity' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleModerationAction = async (
    id: string,
    action: 'APPROVED' | 'BLOCKED' | 'DISMISSED',
  ) => {
    setActionLoading(id);
    try {
      await reviewModerationRecordAdmin(id, action);
      setMessage({ type: 'success', text: `Content marked as ${action}` });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Moderation action failed' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🛡️</span> Fraud Detection & Content Safety Radar
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Multi-signal risk scoring, anomaly detection, duplicate-listing collisions, and
              human-in-the-loop content safety moderation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('risk')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition ${
                activeTab === 'risk'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Entity Risk Queue
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition ${
                activeTab === 'moderation'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Content Safety Queue
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {message && (
          <div
            className={`p-4 rounded-lg border text-sm flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : 'bg-red-950/60 border-red-800 text-red-400'
            }`}
          >
            <span>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </span>
            <button onClick={() => setMessage(null)} className="hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {/* SECTION: Risk Entities Tab */}
        {activeTab === 'risk' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <h2 className="text-lg font-semibold text-white">
                Scored Entities Requiring Attention
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={entityTypeFilter}
                  onChange={(e) => setEntityTypeFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  <option value="">All Entities</option>
                  <option value="PROPERTY">Properties</option>
                  <option value="USER">Users</option>
                  <option value="INQUIRY">Inquiries</option>
                  <option value="REVIEW">Reviews</option>
                </select>

                <select
                  value={riskLevelFilter}
                  onChange={(e) => setRiskLevelFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  <option value="">All Risk Levels</option>
                  <option value="CRITICAL">Critical Risk (80-100)</option>
                  <option value="HIGH">High Risk (55-79)</option>
                  <option value="MEDIUM">Medium Risk (30-54)</option>
                  <option value="LOW">Low Risk (0-29)</option>
                </select>

                <select
                  value={isResolvedFilter}
                  onChange={(e) => setIsResolvedFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  <option value="false">Unresolved Only</option>
                  <option value="true">Resolved Only</option>
                  <option value="all">All Statuses</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Triggered Signals</th>
                    <th className="py-3 px-4">Automated Decision</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {assessments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        {loading
                          ? 'Evaluating risk radar...'
                          : '🎉 No flagged entities matching criteria!'}
                      </td>
                    </tr>
                  ) : (
                    assessments.map((item) => {
                      const levelColor =
                        item.riskLevel === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : item.riskLevel === 'HIGH'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : item.riskLevel === 'MEDIUM'
                              ? 'bg-yellow-950 text-yellow-400 border-yellow-800'
                              : 'bg-emerald-950 text-emerald-400 border-emerald-800';

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-mono text-xs">
                            <span className="font-semibold text-white block">
                              {item.entityType}
                            </span>
                            <span className="text-slate-500 truncate max-w-[120px] block">
                              {item.entityId}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-sm">
                            <span
                              className={
                                Number(item.riskScore) >= 60 ? 'text-rose-400' : 'text-slate-200'
                              }
                            >
                              {Number(item.riskScore).toFixed(1)} / 100
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${levelColor}`}
                            >
                              {item.riskLevel}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="space-y-1">
                              {(item.signals || []).map((s: any, idx: number) => (
                                <div key={idx} className="text-xs text-slate-300">
                                  • <strong className="text-sky-300 font-mono">{s.ruleName}</strong>
                                  : {s.description}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-400">
                            {item.decision}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                item.isResolved
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {item.isResolved ? 'RESOLVED' : 'PENDING REVIEW'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedEntity(item)}
                              className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition"
                            >
                              Inspect & Review
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION: Content Safety Tab */}
        {activeTab === 'moderation' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Content Moderation & Safety Queue
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Detected Flag</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Action Taken</th>
                    <th className="py-3 px-4 text-right">Human Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {moderationRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        {loading
                          ? 'Fetching moderation records...'
                          : '🎉 No moderation violations recorded!'}
                      </td>
                    </tr>
                  ) : (
                    moderationRecords.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-mono text-xs">
                          <span className="font-semibold text-white block">{m.entityType}</span>
                          <span className="text-slate-500 truncate max-w-[120px] block">
                            {m.entityId}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-sky-400">
                          {m.contentType}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                            {m.flag}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {(Number(m.confidence) * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300 max-w-xs">{m.reason}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">
                          {m.actionTaken}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleModerationAction(m.id, 'APPROVED')}
                            disabled={actionLoading === m.id}
                            className="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-medium transition"
                          >
                            Allow
                          </button>
                          <button
                            onClick={() => handleModerationAction(m.id, 'BLOCKED')}
                            disabled={actionLoading === m.id}
                            className="px-2.5 py-1 rounded bg-red-900 hover:bg-red-800 text-white text-xs font-medium transition"
                          >
                            Block
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {selectedEntity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-white">
                  Resolve Risk Flag:{' '}
                  <span className="font-mono text-sky-400">{selectedEntity.entityType}</span>
                </h3>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Administrative Decision
                  </label>
                  <select
                    value={reviewDecision}
                    onChange={(e) => setReviewDecision(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="APPROVED_CLEARED">Clear Risk / Verify Safe</option>
                    <option value="REQUIRE_CNIC_REVERIFICATION">
                      Require Landlord CNIC Re-verification
                    </option>
                    <option value="RESTRICT_ACCOUNT">Temporarily Restrict Account</option>
                    <option value="SUSPEND_LISTING">Suspend Property Listing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Audit Trail Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide justification for this risk override..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEntity(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={actionLoading === 'review'}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"
                >
                  Confirm & Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
