'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '../../components/AdminShell';
import { getAllDisputesAdmin, resolveDisputeAdmin, refundPaymentAdmin } from '../../lib/api';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolution modal state
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolveStatus, setResolveStatus] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [resolutionText, setResolutionText] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, [statusFilter]);

  const loadDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllDisputesAdmin(statusFilter || undefined);
      setDisputes(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !resolutionText.trim()) {
      alert('Please provide official resolution details.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Resolve dispute
      await resolveDisputeAdmin(selectedDispute.id, {
        status: resolveStatus,
        resolution: resolutionText.trim(),
      });

      // 2. If refund requested and payment exists, trigger refund
      if (
        refundAmount !== '' &&
        Number(refundAmount) > 0 &&
        selectedDispute.booking?.payments?.[0]?.id
      ) {
        await refundPaymentAdmin(selectedDispute.booking.payments[0].id, {
          amountPkr: Number(refundAmount),
          reason: `Dispute resolution: ${resolutionText.trim()}`,
        });
      }

      alert('Dispute resolved and recorded successfully!');
      setSelectedDispute(null);
      setResolutionText('');
      setRefundAmount('');
      await loadDisputes();
    } catch (err: any) {
      alert(err.message || 'Dispute resolution failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dispute & Mediation Console</h1>
            <p className="text-slate-400 text-sm mt-1">
              Investigate and resolve tenant-landlord disputes, enforce escrow holds, and execute
              refunds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="ESCALATED">ESCALATED</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="my-6 p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <div className="py-20 text-center text-slate-500">No disputes found.</div>
        ) : (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-3 px-4">Dispute ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Initiator</th>
                    <th className="py-3 px-4">Respondent</th>
                    <th className="py-3 px-4">Hold Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {d.id.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{d.category}</td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        {d.booking?.property?.title || 'Premises'}
                      </td>
                      <td className="py-3 px-4 text-xs">{d.initiator?.fullName || 'N/A'}</td>
                      <td className="py-3 px-4 text-xs">{d.respondent?.fullName || 'N/A'}</td>
                      <td className="py-3 px-4 text-xs font-bold text-amber-400">
                        {d.amountDisputedPkr
                          ? `PKR ${Number(d.amountDisputedPkr).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedDispute(d);
                            setResolutionText(d.resolution || '');
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
                        >
                          Review & Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resolve Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-2">Mediation Resolution Console</h2>
              <p className="text-xs text-slate-400 mb-4">
                Dispute #{selectedDispute.id.substring(0, 8)} • {selectedDispute.category}
              </p>

              <form onSubmit={handleResolve} className="space-y-4 text-sm">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Resolution Decision
                  </label>
                  <select
                    value={resolveStatus}
                    onChange={(e: any) => setResolveStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="RESOLVED">RESOLVED (Remedy or Disbursed)</option>
                    <option value="REJECTED">REJECTED (Claim Invalidated)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Official Resolution Findings
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Document investigation findings, agreed remediations, or eviction decisions..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Escrow Refund to Tenant (PKR, Optional)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) =>
                      setRefundAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDispute(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow disabled:opacity-50"
                  >
                    {submitting ? 'Applying...' : 'Enforce Resolution'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
