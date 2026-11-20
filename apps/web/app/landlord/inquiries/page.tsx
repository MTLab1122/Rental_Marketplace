'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLandlordInquiries, updateLandlordInquiryStatus } from '../../../lib/api';

export default function LandlordInquiriesInboxPage() {
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please sign in as a landlord to access your inquiry inbox.');
        setLoading(false);
        return;
      }
      const list = await getLandlordInquiries(token);
      setInquiries(list || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      await updateLandlordInquiryStatus(id, status, undefined, token);
      await loadInquiries();
    } catch (err: any) {
      alert(`Error updating inquiry: ${err.message}`);
    }
  }

  const filtered = inquiries.filter((inq) => {
    if (filter === 'ALL') return true;
    return inq.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/landlord"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                ← Console Overview
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Tenant Inquiries Inbox</h1>
            <p className="text-sm text-slate-600 mt-1">
              Review and reply to rental inquiries from students and families across Peshawar.
            </p>
          </div>
          <button
            onClick={loadInquiries}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            ↻ Refresh Inbox
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['ALL', 'SUBMITTED', 'SEEN', 'REPLIED', 'ACCEPTED', 'DECLINED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
            <p className="mt-3">Loading inquiries...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No inquiries matching &quot;{filter}&quot; found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((inq) => (
              <div
                key={inq.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">
                      {inq.tenant?.fullName || 'Prospective Tenant'}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                        inq.status === 'SUBMITTED'
                          ? 'bg-amber-100 text-amber-800'
                          : inq.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inq.status === 'DECLINED'
                              ? 'bg-red-100 text-red-800'
                              : inq.status === 'REPLIED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {inq.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Received on {new Date(inq.createdAt).toLocaleDateString()} at{' '}
                    {new Date(inq.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-slate-800 bg-slate-50 rounded-lg p-3 italic">
                      &quot;{inq.message}&quot;
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                      {inq.proposedRentPkr && (
                        <span>
                          Proposed Rent:{' '}
                          <strong className="text-emerald-700">
                            PKR {Number(inq.proposedRentPkr).toLocaleString()}
                          </strong>
                        </span>
                      )}
                      {inq.proposedMoveInDate && (
                        <span>
                          Proposed Move-in:{' '}
                          <strong>{new Date(inq.proposedMoveInDate).toLocaleDateString()}</strong>
                        </span>
                      )}
                      {inq.preferredContactMethod && (
                        <span>
                          Contact Preference: <strong>{inq.preferredContactMethod}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                        Listing
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1">{inq.property?.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {inq.property?.localityName || 'Peshawar'}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {inq.status === 'SUBMITTED' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(inq.id, 'ACCEPTED')}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(inq.id, 'DECLINED')}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {inq.conversationId && (
                        <Link
                          href={`/messages?conversationId=${inq.conversationId}`}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Open Chat
                        </Link>
                      )}

                      {inq.whatsappUrl && inq.canContactWhatsapp && (
                        <a
                          href={inq.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
