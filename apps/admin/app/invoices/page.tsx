'use client';

import React, { useState, useEffect } from 'react';
import { getAdminInvoices, refundInvoiceAdmin } from '../../lib/api';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refund Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminInvoices();
      setInvoices(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load commercial invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmittingRefund(true);
    try {
      await refundInvoiceAdmin(selectedInvoice.id, {
        reason: refundReason,
        amount: Number(refundAmount) || undefined,
      });
      alert('Refund processed and credit note generated successfully.');
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      alert(err?.message || 'Error processing refund.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧾</span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Commercial Invoices & Ledger
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Review KPRA-compliant tax invoices, bank transfer audit references, and process credit
            note refunds.
          </p>
        </div>

        <button
          onClick={fetchInvoices}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Billed To</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Tax (KPRA)</th>
                <th className="py-3 px-4">Total (PKR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 animate-pulse">
                    Loading commercial invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No invoices recorded in this billing cycle.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">
                        {inv.user?.fullName || 'User'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {inv.user?.email || inv.userId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      PKR {Number(inv.subtotal || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      PKR {Number(inv.taxAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      PKR {Number(inv.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
                            : inv.status === 'REFUNDED'
                              ? 'bg-amber-900/60 text-amber-300 border-amber-700'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.status === 'PAID' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setRefundAmount(Number(inv.totalAmount || 0));
                          }}
                          className="px-2.5 py-1 bg-red-950 text-red-400 border border-red-800 rounded-lg text-[11px] font-semibold hover:bg-red-900 transition"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Issue Refund & Credit Note</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Invoice:{' '}
              <strong className="text-white font-mono">{selectedInvoice.invoiceNumber}</strong>{' '}
              (Total: PKR {Number(selectedInvoice.totalAmount).toLocaleString()})
            </p>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Refund Amount (PKR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={Number(selectedInvoice.totalAmount)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Reason for Refund
                </label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Listing moderation rejection / landlord cancellation"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRefund}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {submittingRefund ? 'Processing...' : 'Execute Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
