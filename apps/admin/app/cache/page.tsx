'use client';

import React, { useState } from 'react';
import AdminShell from '../../components/AdminShell';
import { flushCacheAdmin, invalidateCacheAdmin } from '../../lib/api';

const CACHE_RULES = [
  {
    keyPattern: 'localities:*',
    ttl: '24 Hours',
    purpose: 'Municipal locality polygon boundaries & stats',
    invalidation: 'Locality updates',
  },
  {
    keyPattern: 'amenities:all',
    ttl: '24 Hours',
    purpose: 'Static amenity dictionary',
    invalidation: 'Amenity config changes',
  },
  {
    keyPattern: 'featured:properties',
    ttl: '5 Minutes',
    purpose: 'Homepage spotlight & boosted verified listings',
    invalidation: 'Property approval / rent status',
  },
  {
    keyPattern: 'property:details:*',
    ttl: '60 Seconds',
    purpose: 'Public property detail page payload',
    invalidation: 'Price, media or status edit',
  },
  {
    keyPattern: 'search:results:*',
    ttl: '30 Seconds',
    purpose: 'Common discovery filter queries & coordinates',
    invalidation: 'Listing lifecycle changes',
  },
  {
    keyPattern: 'locality:boundary:*',
    ttl: '24 Hours',
    purpose: 'PostGIS spatial bounding polygon cache',
    invalidation: 'Admin GIS updates',
  },
  {
    keyPattern: 'config:public',
    ttl: '10 Minutes',
    purpose: 'Platform configuration & dynamic feature flags',
    invalidation: 'Settings update',
  },
];

export default function AdminCachePage() {
  const [customPattern, setCustomPattern] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInvalidatePattern = async (pattern: string) => {
    if (!pattern.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await invalidateCacheAdmin(pattern.trim());
      setSuccessMessage(
        `Invalidated cache pattern "${pattern.trim()}": ${res.invalidatedCount || 0} keys evicted.`,
      );
      setCustomPattern('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to invalidate cache pattern');
    } finally {
      setLoading(false);
    }
  };

  const handleFlushAll = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: Are you sure you want to flush ALL Redis & memory caches? This will cause a brief cache cold start on discovery APIs.',
    );
    if (!confirmed) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await flushCacheAdmin();
      setSuccessMessage('Successfully executed emergency flush on all cache tiers.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to flush caches');
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
              <span>💾</span> Cache & Performance Optimization
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Redis multi-tier caching, automated TTL enforcement, surgical key eviction, and memory
              fallback health.
            </p>
          </div>

          <button
            onClick={handleFlushAll}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-semibold tracking-wide transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>🔥</span>
            <span>Emergency Flush All</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {successMessage && (
          <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-sm flex items-center justify-between">
            <span>✅ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-400 text-sm flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* System Resilience Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Tier 1 Cache (Redis)
            </div>
            <div className="text-lg font-bold text-emerald-400 mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Connected / Healthy</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Distributed memory layer on port 6379</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Tier 2 Degradation Fallback
            </div>
            <div className="text-lg font-bold text-sky-400 mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>In-Memory LRU Standby</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Zero downtime if Redis node fails</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Automatic Eviction
            </div>
            <div className="text-lg font-bold text-indigo-400 mt-2 flex items-center gap-2">
              <span>⚡ Reactive Hooks</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Property & locality edits auto-invalidate
            </div>
          </div>
        </div>

        {/* Pattern Invalidation Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-2">Targeted Cache Key Eviction</h2>
          <p className="text-xs text-slate-400 mb-4">
            Evict matching keys using prefix wildcards (e.g.{' '}
            <code className="text-sky-400">property:details:*</code> or{' '}
            <code className="text-sky-400">search:*</code>) without wiping unaffected caches.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInvalidatePattern(customPattern);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              placeholder="e.g. property:details:*"
              value={customPattern}
              onChange={(e) => setCustomPattern(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={loading || !customPattern.trim()}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition disabled:opacity-50"
            >
              Evict Pattern
            </button>
          </form>
        </div>

        {/* Cache Rules Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Configured TTL Rules & Policies</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Cache Key Pattern</th>
                  <th className="py-3 px-4">Configured TTL</th>
                  <th className="py-3 px-4">Stored Purpose</th>
                  <th className="py-3 px-4">Invalidation Trigger</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {CACHE_RULES.map((rule) => (
                  <tr key={rule.keyPattern} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-sky-400 font-medium text-xs">
                      {rule.keyPattern}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-200">{rule.ttl}</td>
                    <td className="py-3 px-4 text-xs text-slate-300">{rule.purpose}</td>
                    <td className="py-3 px-4 text-xs text-amber-300 font-mono">
                      {rule.invalidation}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleInvalidatePattern(rule.keyPattern)}
                        disabled={loading}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
                      >
                        Purge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
