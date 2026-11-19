'use client';

import React, { useState, useEffect } from 'react';
import { getDiscoveryAnalytics, getDiscoveryAlerts, getLocalityDemand } from '../../lib/api';

export default function DiscoveryAdminPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [demand, setDemand] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [stats, alertLogs, demandSnapshots] = await Promise.all([
          getDiscoveryAnalytics().catch(() => null),
          getDiscoveryAlerts(25).catch(() => []),
          getLocalityDemand().catch(() => []),
        ]);

        setAnalytics(stats);
        setAlerts(Array.isArray(alertLogs) ? alertLogs : []);
        setDemand(Array.isArray(demandSnapshots) ? demandSnapshots : []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load discovery analytics.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-slate-900 rounded-lg border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <span>🔔</span> Saved Searches, Alerts & Discovery Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time delivery rates, user search demand patterns, and recommendation CTR in
            Peshawar.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-sky-950 text-sky-400 border border-sky-800 rounded-full">
          Live Tracking Active
        </span>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400">Total Impressions</div>
          <div className="text-2xl font-black text-slate-100">
            {analytics?.totalImpressions?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-500">Search & feed views</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400">Property Clicks</div>
          <div className="text-2xl font-black text-sky-400">
            {analytics?.totalClicks?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-500">Listing interactions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400">Discovery CTR</div>
          <div className="text-2xl font-black text-emerald-400">
            {analytics?.ctrPercent || '0.00'}%
          </div>
          <div className="text-[11px] text-slate-500">Recommendation efficiency</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400">Search Queries</div>
          <div className="text-2xl font-black text-amber-400">
            {analytics?.totalSearches?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-500">Queries logged</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400">Alerts Delivered</div>
          <div className="text-2xl font-black text-purple-400">
            {analytics?.totalAlertsDelivered?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-500">In-app & push alerts</div>
        </div>
      </div>

      {/* Popular Localities Heatmap / Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>📍</span> High-Demand Peshawar Localities
          </h2>
          <div className="space-y-3">
            {(analytics?.popularLocalities || []).map((loc: any, idx: number) => (
              <div key={loc.localityId || idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{loc.localityName}</span>
                  <span className="text-slate-400 font-mono">{loc.searches} searches</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (loc.searches / (analytics?.popularLocalities?.[0]?.searches || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(!analytics?.popularLocalities || analytics.popularLocalities.length === 0) && (
              <div className="text-xs text-slate-500 py-4 text-center">
                No search query logs recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Locality Snapshots Table */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>📊</span> Locality Demand Snapshots
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Locality</th>
                  <th className="pb-2">Searches</th>
                  <th className="pb-2">Impressions</th>
                  <th className="pb-2">Clicks</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {demand.slice(0, 5).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-semibold text-slate-200">
                      {d.locality?.name || 'Peshawar'}
                    </td>
                    <td className="py-2.5">{d.searchCount}</td>
                    <td className="py-2.5">{d.impressionCount}</td>
                    <td className="py-2.5">{d.clickCount}</td>
                    <td className="py-2.5 text-slate-500">
                      {new Date(d.snapshotDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {demand.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      No demand snapshots recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alert Delivery Log */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>⚡</span> Real-Time Alert Deliveries
          </h2>
          <span className="text-xs text-slate-500">Recent {alerts.length} dispatches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <tr>
                <th className="pb-2">Recipient</th>
                <th className="pb-2">Search Name</th>
                <th className="pb-2">Property</th>
                <th className="pb-2">Channel</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-medium text-slate-200">
                    {alert.searchAlert?.user?.fullName ||
                      alert.searchAlert?.user?.email ||
                      'Tenant'}
                  </td>
                  <td className="py-2.5 text-slate-300">
                    {alert.searchAlert?.savedSearch?.name || 'Saved Search'}
                  </td>
                  <td className="py-2.5 text-sky-400 font-semibold">
                    {alert.searchAlert?.property?.title || 'Listing'}
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                      {alert.channel}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.status === 'DELIVERED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : alert.status === 'SKIPPED'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                    {new Date(alert.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    No alert deliveries logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
