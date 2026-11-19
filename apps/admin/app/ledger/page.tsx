'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '../../components/AdminShell';
import { getLedgerReconciliationAdmin, postLedgerAdjustmentAdmin } from '../../lib/api';

export default function AdminLedgerPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');
  const [adjustBookingId, setAdjustBookingId] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  useEffect(() => {
    loadLedger();
  }, []);

  const loadLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLedgerReconciliationAdmin();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load escrow ledger reconciliation');
    } finally {
      setLoading(false);
    }
  };

  const handlePostAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount || !adjustReason.trim() || !adjustDesc.trim()) {
      alert('Amount, description, and reason are required for audit-compliant adjustments.');
      return;
    }

    setAdjustSubmitting(true);
    try {
      await postLedgerAdjustmentAdmin({
        amountPkr: Number(adjustAmount),
        description: adjustDesc.trim(),
        reason: adjustReason.trim(),
        bookingId: adjustBookingId.trim() || undefined,
      });

      alert('Immutable ledger adjustment entry posted successfully!');
      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustReason('');
      setAdjustDesc('');
      setAdjustBookingId('');
      await loadLedger();
    } catch (err: any) {
      alert(err.message || 'Failed to post adjustment');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const summary = report?.summary || {};

  return (
    <AdminShell>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Escrow Trust Ledger & Reconciliation</h1>
            <p className="text-slate-400 text-sm mt-1">
              Immutable double-entry escrow records under Khyber Pakhtunkhwa rental compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdjustModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow"
            >
              Post Ledger Adjustment
            </button>
          </div>
        </div>

        {error && (
          <div className="my-6 p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">
              Active Escrow Balance
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              PKR {Number(report?.activeEscrowBalance || 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Trust funds currently held</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">
              Security Deposits Held
            </span>
            <div className="text-xl font-bold text-white mt-1">
              PKR {Number(summary.totalDepositsHeld || 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Gross deposits recorded</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">
              Deposits Released
            </span>
            <div className="text-xl font-bold text-white mt-1">
              PKR {Number(summary.totalDepositsReleased || 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Disbursed on vacancy</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">
              Refunds Processed
            </span>
            <div className="text-xl font-bold text-rose-400 mt-1">
              PKR {Number(summary.totalRefunds || 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Reversals & cancellations</span>
          </div>
        </div>

        {/* Ledger Entries Table */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Chronological Immutable Entries</h2>
            <span className="text-xs text-slate-400">
              Total Entries: {report?.totalEntries || 0}
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading ledger records...</div>
          ) : !report?.entries || report.entries.length === 0 ? (
            <div className="py-20 text-center text-slate-500">No ledger entries recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-3 px-4">Entry ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Debit Account</th>
                    <th className="py-3 px-4">Credit Account</th>
                    <th className="py-3 px-4">Amount (PKR)</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {report.entries.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {e.id.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs text-slate-200">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {e.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {e.debitAccount}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {e.creditAccount}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        PKR {Number(e.amountPkr).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">{e.description}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Post Ledger Adjustment */}
        {showAdjustModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-2">Post Audit Adjustment Entry</h2>
              <p className="text-xs text-slate-400 mb-4">
                Ledger entries are strictly immutable. Adjustments create an opposing balancing
                transaction.
              </p>

              <form onSubmit={handlePostAdjustment} className="space-y-4 text-sm">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Adjustment Amount (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustAmount}
                    onChange={(e) =>
                      setAdjustAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Positive amount"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={adjustDesc}
                    onChange={(e) => setAdjustDesc(e.target.value)}
                    placeholder="e.g. Reconciliation discrepancy correction"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Audit Reason</label>
                  <input
                    type="text"
                    required
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Regulatory or banking reference"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Related Booking ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={adjustBookingId}
                    onChange={(e) => setAdjustBookingId(e.target.value)}
                    placeholder="UUID"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow disabled:opacity-50"
                  >
                    {adjustSubmitting ? 'Posting...' : 'Post Entry'}
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
