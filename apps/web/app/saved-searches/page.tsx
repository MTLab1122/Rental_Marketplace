'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { getMySavedSearches, deleteSavedSearch, updateSavedSearchAlerts } from '../../lib/api';
import { SavedSearchDto, AlertFrequency } from '@rental-peshawar/shared-types';
import EmptyState from '../../components/EmptyState';
import { SearchIcon } from '../../components/Icons';

export default function SavedSearchesPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [searches, setSearches] = useState<SavedSearchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
      return;
    }

    async function loadSearches() {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getMySavedSearches(token);
        setSearches(Array.isArray(res) ? res : res?.items || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load saved searches.');
      } finally {
        setLoading(false);
      }
    }

    loadSearches();
  }, [token, isAuthenticated, router]);

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this saved search?')) return;
    try {
      await deleteSavedSearch(id, token);
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete saved search.');
    }
  };

  const handleToggleAlerts = async (
    id: string,
    currentStatus: boolean,
    frequency: AlertFrequency,
  ) => {
    if (!token) return;
    const nextStatus = !currentStatus;
    try {
      await updateSavedSearchAlerts(id, { alertsEnabled: nextStatus, frequency }, token);
      setSearches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, alertsEnabled: nextStatus } : s)),
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update alert settings.');
    }
  };

  const handleFrequencyChange = async (
    id: string,
    newFreq: AlertFrequency,
    alertsEnabled: boolean,
  ) => {
    if (!token) return;
    try {
      await updateSavedSearchAlerts(id, { alertsEnabled, frequency: newFreq }, token);
      setSearches((prev) => prev.map((s) => (s.id === id ? { ...s, frequency: newFreq } : s)));
    } catch (err: any) {
      alert(err?.message || 'Failed to update alert frequency.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-navy-200 rounded w-1/3" />
        <div className="h-24 bg-navy-50 rounded-m3-md border border-navy-100" />
        <div className="h-24 bg-navy-50 rounded-m3-md border border-navy-100" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-navy-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 flex items-center gap-2">
            My Saved Searches & Alerts
          </h1>
          <p className="text-xs text-navy-500 mt-1">
            Get instant or daily notifications whenever a new matching property is verified in
            Peshawar.
          </p>
        </div>
        <Link
          href="/properties"
          className="px-4 py-2 bg-peshawar-600 hover:bg-peshawar-700 text-white rounded-m3-sm text-xs font-bold transition shadow-xs self-start"
        >
          + Find More Properties
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-m3-sm font-semibold">
          {error}
        </div>
      )}

      {searches.length === 0 ? (
        <EmptyState
          icon=""
          title="No Saved Searches Yet"
          description="When browsing properties in Peshawar, click 'Save Search' to receive automatic alerts when new listings are posted."
          actionText="Browse Available Listings"
          actionHref="/properties"
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-navy-500">
            {searches.length} / 25 Searches Saved
          </div>

          {searches.map((search) => {
            const filters = search.filters || {};
            const searchParams = new URLSearchParams();
            if (filters.localityId) searchParams.set('localityId', filters.localityId);
            if (filters.propertyType) searchParams.set('propertyType', filters.propertyType);
            if (filters.minPrice) searchParams.set('minRent', filters.minPrice.toString());
            if (filters.maxPrice) searchParams.set('maxRent', filters.maxPrice.toString());
            if (filters.bedrooms) searchParams.set('bedrooms', filters.bedrooms.toString());
            if (filters.eligibility) searchParams.set('eligibility', filters.eligibility);

            return (
              <div
                key={search.id}
                className="bg-white rounded-m3-lg border border-navy-100 p-5 shadow-xs space-y-3 hover:border-navy-200 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-navy-950 flex items-center gap-2">
                      <span></span> {search.name}
                    </h2>
                    <div className="text-[11px] text-navy-400 mt-0.5">
                      Created on {new Date(search.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/properties?${searchParams.toString()}`}
                      className="px-3 py-1.5 bg-navy-50 hover:bg-navy-100 text-navy-800 text-xs font-bold rounded-m3-sm border border-navy-200 transition flex items-center gap-1"
                    >
                      <SearchIcon className="w-4 h-4 text-navy-400" /> Run Search
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(search.id)}
                      className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 font-bold border border-red-100 hover:border-red-200 rounded-m3-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Filter tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {filters.localityId && (
                    <span className="text-[11px] font-semibold bg-navy-50 text-navy-700 px-2 py-0.5 rounded border border-navy-100">
                      Locality Selected
                    </span>
                  )}
                  {filters.propertyType && (
                    <span className="text-[11px] font-semibold bg-navy-50 text-navy-700 px-2 py-0.5 rounded border border-navy-100">
                      {filters.propertyType}
                    </span>
                  )}
                  {filters.bedrooms && (
                    <span className="text-[11px] font-semibold bg-navy-50 text-navy-700 px-2 py-0.5 rounded border border-navy-100">
                      {filters.bedrooms}+ Beds
                    </span>
                  )}
                  {filters.maxPrice && (
                    <span className="text-[11px] font-semibold bg-navy-50 text-navy-700 px-2 py-0.5 rounded border border-navy-100">
                      ≤ PKR {Number(filters.maxPrice).toLocaleString('en-PK')}
                    </span>
                  )}
                  {filters.eligibility && (
                    <span className="text-[11px] font-semibold bg-navy-50 text-navy-700 px-2 py-0.5 rounded border border-navy-100">
                      {filters.eligibility}
                    </span>
                  )}
                </div>

                {/* Alert Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-navy-50 pt-3">
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={search.alertsEnabled}
                        onChange={() =>
                          handleToggleAlerts(search.id, search.alertsEnabled, search.frequency)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-navy-200 peer-focus:outline-none rounded-md peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-md after:h-3 after:w-3 after:transition-all peer-checked:bg-peshawar-600"></div>
                    </label>
                    <span className="text-xs font-bold text-navy-800">
                      {search.alertsEnabled ? 'Alerts Active' : 'Alerts Paused'}
                    </span>
                  </div>

                  {search.alertsEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-navy-500 font-medium">Frequency:</span>
                      <select
                        value={search.frequency}
                        onChange={(e) =>
                          handleFrequencyChange(
                            search.id,
                            e.target.value as AlertFrequency,
                            search.alertsEnabled,
                          )
                        }
                        className="text-xs font-bold bg-navy-50 border border-navy-200 rounded-m3-sm px-2 py-1 text-navy-900 focus:outline-none focus:border-peshawar-600"
                      >
                        <option value={AlertFrequency.INSTANT}>Instant </option>
                        <option value={AlertFrequency.DAILY}>Daily Digest</option>
                        <option value={AlertFrequency.WEEKLY}>Weekly</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
