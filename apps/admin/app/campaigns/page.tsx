'use client';

import React, { useState, useEffect } from 'react';
import { getCampaignsAdmin, createCampaignAdmin } from '../../lib/api';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Campaign Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    channel: 'META_ADS',
    utmSource: 'facebook',
    utmMedium: 'cpc',
    utmCampaign: '',
    budgetPkr: 25000,
    startDate: new Date().toISOString().split('T')[0],
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaignsAdmin();
      setCampaigns(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load marketing campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCampaignAdmin({
        ...formData,
        budgetPkr: Number(formData.budgetPkr),
        startDate: new Date(formData.startDate || Date.now()).toISOString(),
      });
      setShowCreateModal(false);
      fetchCampaigns();
    } catch (err: any) {
      alert(err?.message || 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📢</span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Campaign Tracking & Attribution
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage multi-channel acquisition campaigns, UTM tracking governance, A/B variants, and
            CAC metrics.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
        >
          + Create Campaign
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500 animate-pulse">
            Loading campaigns & attribution models...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            No active campaigns found. Click &quot;+ Create Campaign&quot; to launch your first
            growth campaign.
          </div>
        ) : (
          campaigns.map((camp) => {
            const spent = Number(camp.spentPkr || 0);
            const budget = Number(camp.budgetPkr || 1);
            const pctSpent = Math.min(100, Math.round((spent / budget) * 100));

            return (
              <div
                key={camp.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-white">{camp.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700">
                        {camp.channel}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
                        Code: {camp.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">
                      utm_source={camp.utmSource} • utm_medium={camp.utmMedium} • utm_campaign=
                      {camp.utmCampaign}
                    </div>
                  </div>

                  {/* Budget & Spend Progress */}
                  <div className="md:w-64">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Spent: PKR {spent.toLocaleString()}</span>
                      <span className="text-slate-200">Budget: PKR {budget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pctSpent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Variants List */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    A/B Variants & Conversion Performance
                  </h4>
                  {camp.variants?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {camp.variants.map((v: any) => {
                        const imp = v.impressions || 0;
                        const clicks = v.clicks || 0;
                        const conv = v.conversions || 0;
                        const ctr = imp > 0 ? ((clicks / imp) * 100).toFixed(1) : '0.0';
                        const cac = conv > 0 ? Math.round(spent / conv) : 0;

                        return (
                          <div
                            key={v.id}
                            className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm text-slate-200">{v.name}</span>
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                                Weight: {v.trafficWeight}%
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                              <div>
                                <span className="text-slate-500 block text-[10px]">Clicks</span>
                                <span className="font-bold text-white">
                                  {clicks.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">CTR</span>
                                <span className="font-bold text-emerald-400">{ctr}%</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">
                                  Conversions
                                </span>
                                <span className="font-bold text-white">
                                  {conv.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Est. CAC</span>
                                <span className="font-bold text-peshawar-400">
                                  {cac > 0 ? `PKR ${cac}` : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No variants defined for this campaign yet.
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Create Growth Campaign</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Peshawar University Admissions 2026"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Unique Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="CAMP-UOP-2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="META_ADS">Meta (Facebook/Instagram)</option>
                    <option value="GOOGLE_ADS">Google Search / Display</option>
                    <option value="WHATSAPP">WhatsApp Outbound</option>
                    <option value="CAMPUS_AMBASSADOR">Campus Ambassador</option>
                    <option value="INFLUENCER">Local Influencer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    UTM Source
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.utmSource}
                    onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                    placeholder="facebook"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    UTM Medium
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.utmMedium}
                    onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                    placeholder="cpc"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    UTM Campaign
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.utmCampaign}
                    onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                    placeholder="students_spring_2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Allocated Budget (PKR)
                </label>
                <input
                  type="number"
                  required
                  value={formData.budgetPkr}
                  onChange={(e) => setFormData({ ...formData, budgetPkr: Number(e.target.value) })}
                  placeholder="25000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
