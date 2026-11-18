'use client';

import React, { useEffect, useState } from 'react';
import { getAdminFeatureFlags, updateAdminFeatureFlag } from '../../lib/api';

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const res = await getAdminFeatureFlags();
      setFlags(res || []);
    } catch (err: any) {
      alert(`Failed to load feature flags: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (flag: any) => {
    try {
      setTogglingKey(flag.key);
      await updateAdminFeatureFlag(flag.key, !flag.enabled);
      loadFlags();
    } catch (err: any) {
      alert(`Failed to toggle flag: ${err?.message}`);
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🚩</span> Feature Flags & Operational Toggles
          </h1>
          <p className="text-sm text-slate-400">
            Dynamically enable or disable experimental features, security checks, and third-party
            integrations
          </p>
        </div>
        <button
          onClick={loadFlags}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
        >
          Refresh Flags
        </button>
      </div>

      {/* Feature Flags Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading feature flags...</div>
      ) : flags.length === 0 ? (
        <div className="py-20 text-center text-slate-400">No feature flags registered.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flags.map((flag) => {
            const isProcessing = togglingKey === flag.key;
            return (
              <div
                key={flag.id || flag.key}
                className={`p-5 rounded-xl border transition ${
                  flag.enabled
                    ? 'bg-slate-900/90 border-emerald-800/60 shadow-sm shadow-emerald-950'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-sm font-bold text-white">{flag.key}</span>
                    <p className="text-xs text-slate-400 mt-1">
                      {flag.description || 'Feature flag configuration switch'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(flag)}
                    disabled={isProcessing}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      flag.enabled ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        flag.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-mono">
                    Rollout:{' '}
                    {flag.rolloutPercentage !== undefined ? `${flag.rolloutPercentage}%` : '100%'}
                  </span>
                  <span
                    className={`font-semibold ${
                      flag.enabled ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {flag.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
