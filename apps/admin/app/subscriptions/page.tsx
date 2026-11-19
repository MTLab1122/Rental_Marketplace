'use client';

import React, { useState, useEffect } from 'react';
import { getSubscriptionsAdmin, createPromoCodeAdmin } from '../../lib/api';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Promo Code Creation Form State
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountPercent: 20,
    maxUses: 100,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [submittingPromo, setSubmittingPromo] = useState(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubscriptionsAdmin();
      setSubscriptions(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load landlord subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPromo(true);
    try {
      await createPromoCodeAdmin({
        code: promoForm.code.toUpperCase(),
        discountPercent: Number(promoForm.discountPercent),
        maxUses: Number(promoForm.maxUses),
        validUntil: new Date(promoForm.validUntil || Date.now()).toISOString(),
      });
      alert('Promo code created successfully!');
      setShowPromoModal(false);
      setPromoForm({
        code: '',
        discountPercent: 20,
        maxUses: 100,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    } catch (err: any) {
      alert(err?.message || 'Error creating promo code.');
    } finally {
      setSubmittingPromo(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Subscriptions & Promotions
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage landlord subscription tiers, active listing caps, boost packages, and promotional
            discount codes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPromoModal(true)}
            className="bg-peshawar-600 hover:bg-peshawar-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
          >
            + Create Promo Code
          </button>
          <button
            onClick={fetchSubscriptions}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-sm text-white">Active Landlord Subscriptions</h3>
          <span className="text-xs text-slate-400 font-mono">Total: {subscriptions.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Landlord</th>
                <th className="py-3 px-4">Plan & Tier</th>
                <th className="py-3 px-4">Billing Cycle</th>
                <th className="py-3 px-4">Listings Allowance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 animate-pulse">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No active landlord subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const maxListings = sub.plan?.maxActiveListings || 2;
                  const activeListings = sub.user?.properties?.length || 0;
                  const isNearCap = activeListings >= maxListings;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">
                          {sub.user?.fullName || sub.user?.email || 'Landlord'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {sub.user?.phoneNumber || sub.userId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700">
                          {sub.plan?.name || 'Starter Plan'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {sub.billingCycle} (PKR{' '}
                        {Number(sub.plan?.priceMonthly || 0).toLocaleString()})
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold font-mono ${isNearCap ? 'text-amber-400' : 'text-emerald-400'}`}
                          >
                            {activeListings} / {maxListings}
                          </span>
                          {isNearCap && (
                            <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.2 rounded font-bold">
                              Limit Reached
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(sub.startDate).toLocaleDateString()} →{' '}
                        {new Date(sub.endDate).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promo Code Creation Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Create Promotional Discount Code</h3>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  value={promoForm.code}
                  onChange={(e) =>
                    setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. PESHAWAR30"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Discount %
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={promoForm.discountPercent}
                    onChange={(e) =>
                      setPromoForm({ ...promoForm, discountPercent: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={promoForm.maxUses}
                    onChange={(e) =>
                      setPromoForm({ ...promoForm, maxUses: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={promoForm.validUntil}
                  onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPromo}
                  className="px-4 py-2 bg-peshawar-600 hover:bg-peshawar-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {submittingPromo ? 'Creating...' : 'Issue Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
