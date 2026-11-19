'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '../../components/AdminShell';
import {
  getIntelligenceOverviewAdmin,
  getLocalityIntelligenceAdmin,
  getFraudTrendsAdmin,
} from '../../lib/api';

export default function AdminIntelligencePage() {
  const [overview, setOverview] = useState<any | null>(null);
  const [localities, setLocalities] = useState<any[]>([]);
  const [fraudTrends, setFraudTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, locs, ft] = await Promise.all([
        getIntelligenceOverviewAdmin().catch(() => null),
        getLocalityIntelligenceAdmin().catch(() => []),
        getFraudTrendsAdmin().catch(() => []),
      ]);
      setOverview(ov);
      setLocalities(Array.isArray(locs) ? locs : []);
      setFraudTrends(Array.isArray(ft) ? ft : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch intelligence metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🧠</span> Marketplace Intelligence & Pricing Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Macroeconomic rental trends, supply vs demand velocity, locality price percentiles,
              and conversion funnel analytics.
            </p>
          </div>

          <button
            onClick={loadData}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
          >
            ↻ Refresh Metrics
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Top Funnel KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Demand Index
            </div>
            <div className="text-3xl font-extrabold text-sky-400 mt-2">
              {overview?.overallDemandIndex ?? '--'}{' '}
              <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Peshawar rental velocity</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Supply-Demand Ratio
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">
              {overview?.supplyDemandRatio ?? '--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Active units per inquiry</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Search → Inquiry
            </div>
            <div className="text-3xl font-extrabold text-amber-400 mt-2">
              {overview?.searchToInquiryConversionRate ?? '--'}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Discovery intent conversion</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Avg Days to Booking
            </div>
            <div className="text-3xl font-extrabold text-indigo-400 mt-2">
              {overview?.avgDaysToBooking ?? '--'}{' '}
              <span className="text-xs text-slate-400 font-normal">days</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Inquiry to finalized lease</div>
          </div>
        </div>

        {/* Secondary Metric Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Landlord Response Rate</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {overview?.averageLandlordResponseRate ?? 88}%
              </div>
            </div>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Listing Quality Score</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {overview?.listingQualityScoreAverage ?? 82} / 100
              </div>
            </div>
            <span className="text-2xl">✨</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Active Fraud Alerts</div>
              <div className="text-lg font-bold text-rose-400 mt-0.5">
                {overview?.fraudAlertsCount ?? 0}
              </div>
            </div>
            <span className="text-2xl">🚨</span>
          </div>
        </div>

        {/* Locality Intelligence Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">
            Locality Supply & Demand Ranking
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Real-time balance of tenant inquiry interest versus approved active property inventory
            across Peshawar sectors.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Peshawar Locality</th>
                  <th className="py-3 px-4">Demand Index</th>
                  <th className="py-3 px-4">Active Units</th>
                  <th className="py-3 px-4">30-Day Inquiries</th>
                  <th className="py-3 px-4">Median Rent</th>
                  <th className="py-3 px-4">Supply / Demand</th>
                  <th className="py-3 px-4">Growth Velocity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {localities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      {loading
                        ? 'Aggregating locality intelligence...'
                        : 'No locality metrics recorded'}
                    </td>
                  </tr>
                ) : (
                  localities.map((loc) => (
                    <tr key={loc.localityId} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-semibold text-white">{loc.localityName}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-sky-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, loc.demandIndex)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-xs text-sky-400 font-bold">
                            {loc.demandIndex}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{loc.activeListingsCount}</td>
                      <td className="py-3 px-4 font-mono text-xs text-emerald-400">
                        {loc.inquiryVolume30Days}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-200">
                        {loc.medianRentPkr > 0
                          ? `PKR ${loc.medianRentPkr.toLocaleString()}`
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {loc.supplyDemandRatio} : 1
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-emerald-400">
                        +{loc.growthTrendPercentage}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7-Day Fraud & Anomaly Trends */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            7-Day Fraud Prevention Trajectory
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {fraudTrends.map((ft) => (
              <div
                key={ft.date}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center"
              >
                <div className="text-[11px] font-mono text-slate-400">{ft.date.slice(5)}</div>
                <div className="text-xl font-extrabold text-white mt-1">{ft.flaggedCount}</div>
                <div className="text-[10px] text-slate-500">Flagged Cases</div>
                <div className="text-[10px] text-emerald-400 mt-1">{ft.resolvedCount} Resolved</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
