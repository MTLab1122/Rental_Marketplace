'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLandlordDashboard, updateLandlordInquiryStatus } from '../../lib/api';

export default function LandlordDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please sign in as a landlord to access this dashboard.');
        setLoading(false);
        return;
      }
      const dashboard = await getLandlordDashboard(token);
      setData(dashboard);
    } catch (err: any) {
      setError(err?.message || 'Failed to load landlord dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleInquiryStatusChange(inquiryId: string, status: string) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      await updateLandlordInquiryStatus(inquiryId, status, undefined, token);
      await loadDashboard();
    } catch (err: any) {
      alert(`Error updating inquiry: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-slate-600">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <p className="mt-4">Loading your landlord operations dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-semibold text-lg">Access Notice</p>
          <p className="mt-2 text-sm">{error}</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const v = data?.verification;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Verification Alert Banner */}
        {v && !v.isVerified && (
          <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-200 text-amber-800 text-xs font-bold">
                    !
                  </span>
                  <h3 className="font-bold text-amber-900">
                    Identity Verification {v.status === 'PENDING' ? 'Pending Review' : 'Required'}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-amber-800">
                  {v.status === 'PENDING'
                    ? 'Your CNIC and selfie are currently being verified by Peshawar moderation admins. You can create listings, but they will be reviewed once verified.'
                    : 'To post property listings in Peshawar, government CNIC and selfie verification is required for trust and safety.'}
                </p>
              </div>
              <Link
                href="/landlord/verification"
                className="whitespace-nowrap rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-800 transition"
              >
                {v.status === 'PENDING' ? 'Check Verification Status' : 'Submit CNIC Verification'}
              </Link>
            </div>
          </div>
        )}

        {/* Header & Primary Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Landlord Operations Console</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your Peshawar properties, respond to tenant inquiries, and monitor real
              performance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/landlord/properties/new"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
            >
              + Create Listing Wizard
            </Link>
            <Link
              href="/landlord/properties"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Manage Listings
            </Link>
            <Link
              href="/landlord/inquiries"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Inquiries Inbox
            </Link>
          </div>
        </div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Properties
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {data?.totalProperties ?? 0}
              </span>
              <span className="text-xs text-slate-500">listings</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Active & Available
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-700">
                {data?.activeListings ?? 0}
              </span>
              <span className="text-xs text-slate-500">publicly searchable</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Pending Admin Review
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-700">
                {data?.pendingReview ?? 0}
              </span>
              <span className="text-xs text-slate-500">moderation queue</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Rented / Occupied
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {data?.rentedCount ?? 0}
              </span>
              <span className="text-xs text-slate-500">hidden from search</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Total Inquiries
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-700">
                {data?.totalInquiries ?? 0}
              </span>
              <span className="text-xs text-slate-500">({data?.unreadInquiries ?? 0} new)</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-navy-700">
              Total Listing Views
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy-900">{data?.totalViews ?? 0}</span>
              <span className="text-xs text-slate-500">verified impressions</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-peshawar-700">
              Inquiry Response Rate
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-peshawar-800">
                {data?.responseRatePercent !== null ? `${data.responseRatePercent}%` : 'N/A'}
              </span>
              <span className="text-xs text-slate-500">responsiveness</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
              Avg Response Time
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-teal-700">
                {data?.averageResponseTimeMinutes !== null
                  ? `${data.averageResponseTimeMinutes}m`
                  : 'N/A'}
              </span>
              <span className="text-xs text-slate-500">reply speed</span>
            </div>
          </div>
        </div>

        {/* Recent Inquiries Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Tenant Inquiries</h2>
            <Link
              href="/landlord/inquiries"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View All Inquiries →
            </Link>
          </div>

          {!data?.recentInquiries || data.recentInquiries.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p>No tenant inquiries received yet.</p>
              <p className="text-xs mt-1">
                Once verified and approved, tenants in Peshawar can submit direct inquiries.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentInquiries.map((inq: any) => (
                <div
                  key={inq.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {inq.tenant?.fullName || 'Tenant'}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          inq.status === 'SUBMITTED'
                            ? 'bg-amber-100 text-amber-800'
                            : inq.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inq.status === 'DECLINED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inq.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-2 italic">
                      &quot;{inq.message}&quot;
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>
                        Listing: <strong>{inq.property?.title}</strong>
                      </span>
                      {inq.proposedRentPkr && (
                        <span>Proposed: PKR {inq.proposedRentPkr.toLocaleString()}</span>
                      )}
                      {inq.proposedMoveInDate && (
                        <span>
                          Move-in: {new Date(inq.proposedMoveInDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {inq.status === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => handleInquiryStatusChange(inq.id, 'ACCEPTED')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleInquiryStatusChange(inq.id, 'DECLINED')}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {inq.conversationId && (
                      <Link
                        href={`/messages?conversationId=${inq.conversationId}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                      >
                        Chat
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
