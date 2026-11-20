'use client';

import React, { useState } from 'react';
import { createSavedSearch } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { AlertFrequency } from '@rental-peshawar/shared-types';

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Record<string, any>;
  onSuccess?: () => void;
}

export default function SaveSearchModal({
  isOpen,
  onClose,
  filters,
  onSuccess,
}: SaveSearchModalProps) {
  const { token, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [frequency, setFrequency] = useState<AlertFrequency>(AlertFrequency.INSTANT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      setError('Please log in to save searches and receive alerts.');
      return;
    }
    if (!name.trim()) {
      setError('Please provide a name for this saved search.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createSavedSearch(
        {
          name: name.trim(),
          filters,
          alertsEnabled,
          frequency,
        },
        token,
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to save search. Maximum limit is 25 searches.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-m3-lg border border-navy-100 p-6 max-w-md w-full shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-navy-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl"></span>
            <h3 className="font-extrabold text-navy-950 text-base">Save Search & Get Alerts</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-navy-400 hover:text-navy-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-m3-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-m3-sm font-bold flex items-center gap-2">
            <span>✓</span> Saved search created! Real-time alerts are active.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-800 mb-1">Search Name</label>
            <input
              type="text"
              placeholder="e.g. 2 Bed Family Flat in Hayatabad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-2.5 border border-navy-200 rounded-m3-sm focus:outline-none focus:border-peshawar-600 text-navy-900"
              required
            />
          </div>

          <div className="bg-navy-50 p-3 rounded-m3-sm border border-navy-100 space-y-1">
            <div className="text-[11px] font-bold text-navy-700">Captured Criteria:</div>
            <div className="text-[11px] text-navy-600 flex flex-wrap gap-1">
              {filters.localityId && (
                <span className="bg-white px-1.5 py-0.5 rounded border border-navy-200">
                  Locality Selected
                </span>
              )}
              {filters.propertyType && (
                <span className="bg-white px-1.5 py-0.5 rounded border border-navy-200">
                  {filters.propertyType}
                </span>
              )}
              {filters.bedrooms && (
                <span className="bg-white px-1.5 py-0.5 rounded border border-navy-200">
                  {filters.bedrooms}+ Beds
                </span>
              )}
              {filters.maxPrice && (
                <span className="bg-white px-1.5 py-0.5 rounded border border-navy-200">
                  ≤ PKR {filters.maxPrice.toLocaleString()}
                </span>
              )}
              {filters.eligibility && (
                <span className="bg-white px-1.5 py-0.5 rounded border border-navy-200">
                  {filters.eligibility}
                </span>
              )}
              {filters.furnishing && (
                <span className="bg-white px-1.5 py-0.5 rounded border border-navy-200">
                  {filters.furnishing}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-b border-navy-100 py-3">
            <div>
              <div className="text-xs font-bold text-navy-900">Enable Listing Alerts</div>
              <div className="text-[11px] text-navy-500">
                Notify when matching properties are listed
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-navy-200 peer-focus:outline-none rounded-md peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-md after:h-4 after:w-4 after:transition-all peer-checked:bg-peshawar-600"></div>
            </label>
          </div>

          {alertsEnabled && (
            <div>
              <label className="block text-xs font-bold text-navy-800 mb-1">
                Notification Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: AlertFrequency.INSTANT, label: 'Instant ' },
                  { id: AlertFrequency.DAILY, label: 'Daily Digest' },
                  { id: AlertFrequency.WEEKLY, label: 'Weekly' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFrequency(f.id)}
                    className={`py-2 text-xs font-bold rounded-m3-sm border transition text-center ${
                      frequency === f.id
                        ? 'bg-peshawar-600 text-white border-peshawar-600'
                        : 'bg-white text-navy-700 border-navy-200 hover:bg-navy-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-navy-200 rounded-m3-sm text-xs font-bold text-navy-700 hover:bg-navy-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-4 py-2 bg-peshawar-600 hover:bg-peshawar-700 disabled:opacity-50 text-white rounded-m3-sm text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              {loading ? 'Saving...' : 'Save & Enable Alerts'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
