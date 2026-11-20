'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getLandlordPropertyAnalytics } from '../../../../../lib/api';

export default function PropertyAnalyticsPage() {
  const params = useParams();
  const id = params['id'] as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }
        const analytics = await getLandlordPropertyAnalytics(id, token);
        setData(analytics);
      } catch (err: any) {
        setError(err?.message || 'Failed to load property analytics');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadAnalytics();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <p className="mt-4">Loading real property performance telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-bold">Analytics Notice</p>
          <p className="mt-1 text-sm">{error}</p>
          <Link
            href="/landlord/properties"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            ← Return to Properties
          </Link>
        </div>
      </div>
    );
  }

  const s = data?.viewsBySource || { mobile: 0, web: 0, adminReferral: 0 };
  const totalSrc = (s.mobile || 0) + (s.web || 0) + (s.adminReferral || 0) || 1;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <Link
            href="/landlord/properties"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            ← Back to My Listings
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
            Listing Telemetry & Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Performance metrics for <strong>{data?.propertyTitle}</strong>.
          </p>
        </div>

        {/* Real KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Views
            </span>
            <div className="mt-2 text-3xl font-black text-slate-900">{data?.totalViews ?? 0}</div>
            <p className="mt-1 text-xs text-slate-400">Total impression events</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Unique Viewers
            </span>
            <div className="mt-2 text-3xl font-black text-emerald-700">
              {data?.uniqueViews ?? 0}
            </div>
            <p className="mt-1 text-xs text-slate-400">Distinct tenants & IPs</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Favorites Saved
            </span>
            <div className="mt-2 text-3xl font-black text-rose-700">
              {data?.favoritesCount ?? 0}
            </div>
            <p className="mt-1 text-xs text-slate-400">Bookmarked listings</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Total Inquiries
            </span>
            <div className="mt-2 text-3xl font-black text-blue-700">
              {data?.inquiriesCount ?? 0}
            </div>
            <p className="mt-1 text-xs text-slate-400">Direct tenant applications</p>
          </div>
        </div>

        {/* Quality Score & Responsiveness */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Listing Quality Score
            </h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-emerald-600">
                {data?.qualityScore ?? 0}
              </span>
              <span className="text-sm text-slate-400">/ 100</span>
            </div>
            <div className="mt-3 overflow-hidden rounded-sm bg-slate-100">
              <div
                className="h-2 bg-emerald-500 rounded-sm"
                style={{ width: `${Math.min(data?.qualityScore ?? 0, 100)}%` }}
              ></div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Evaluated based on title length, detailed description, high-res photos, and locality
              notes.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Inquiry Response Rate
            </h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-navy-800">
                {data?.responseRatePercent !== null ? `${data.responseRatePercent}%` : 'N/A'}
              </span>
            </div>
            <div className="mt-3 overflow-hidden rounded-sm bg-slate-100">
              <div
                className="h-2 bg-navy-700 rounded-sm"
                style={{ width: `${Math.min(data?.responseRatePercent ?? 0, 100)}%` }}
              ></div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Percentage of received tenant inquiries responded to via in-app message or acceptance.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Avg Response Time
            </h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-teal-600">
                {data?.averageResponseTimeMinutes !== null
                  ? `${data.averageResponseTimeMinutes}m`
                  : 'N/A'}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Average minutes elapsed between tenant inquiry creation and your first reply message.
            </p>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Traffic Breakdown by Client Platform
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Web Browsers</span>
                  <span>
                    {s.web} views ({Math.round(((s.web || 0) / totalSrc) * 100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-sm bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${((s.web || 0) / totalSrc) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Mobile Applications (Flutter)</span>
                  <span>
                    {s.mobile} views ({Math.round(((s.mobile || 0) / totalSrc) * 100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-sm bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-navy-600"
                    style={{ width: `${((s.mobile || 0) / totalSrc) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Admin Referrals</span>
                  <span>
                    {s.adminReferral} views ({Math.round(((s.adminReferral || 0) / totalSrc) * 100)}
                    %)
                  </span>
                </div>
                <div className="h-2 rounded-sm bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-peshawar-600"
                    style={{ width: `${((s.adminReferral || 0) / totalSrc) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Locality Search Demand</h3>
            {!data?.viewsByLocality || Object.keys(data.viewsByLocality).length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Views are recorded when tenants filter or open this listing.
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.viewsByLocality).map(([locId, count]) => (
                  <div
                    key={locId}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs"
                  >
                    <span className="font-mono text-slate-600">
                      Locality {locId.slice(0, 8)}...
                    </span>
                    <span className="font-bold text-slate-900">{String(count)} views</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
