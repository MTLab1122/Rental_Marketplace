'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { getMyInquiries } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import { InquiryResponseDto } from '@rental-peshawar/shared-types';

export default function InquiriesPage() {
  const { token, isAuthenticated } = useAuth();
  const [inquiries, setInquiries] = useState<InquiryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInquiries() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getMyInquiries(token);
        setInquiries(data || []);
      } catch (err) {
        console.error('Failed to load inquiries', err);
      } finally {
        setLoading(false);
      }
    }

    loadInquiries();
  }, [token]);

  if (!isAuthenticated) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon="🔒"
          title="Sign In to Track Inquiries"
          description="Log in to view inquiries submitted to Peshawar landlords and track application status."
          actionText="Sign In"
          actionHref="/login"
        />
      </main>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-0.5 rounded-m3-sm text-xs font-extrabold bg-peshawar-100 text-peshawar-800 border border-peshawar-300">
            ✓ Accepted by Landlord
          </span>
        );
      case 'DECLINED':
        return (
          <span className="px-2.5 py-0.5 rounded-m3-sm text-xs font-extrabold bg-red-100 text-red-800 border border-red-300">
            ✕ Declined
          </span>
        );
      case 'REPLIED':
        return (
          <span className="px-2.5 py-0.5 rounded-m3-sm text-xs font-extrabold bg-terracotta-100 text-terracotta-700 border border-terracotta-300">
            💬 Landlord Replied
          </span>
        );
      case 'SEEN':
        return (
          <span className="px-2.5 py-0.5 rounded-m3-sm text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
            👀 Seen
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-m3-sm text-xs font-extrabold bg-navy-100 text-navy-800 border border-navy-200">
            ⏳ Submitted
          </span>
        );
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-navy-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
          My Rental Inquiries
        </h1>
        <p className="text-xs sm:text-sm text-navy-500 mt-1">
          Track the status of your rental applications and communications with Peshawar landlords.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-white border border-navy-100 rounded-m3-lg p-5" />
          <div className="h-28 bg-white border border-navy-100 rounded-m3-lg p-5" />
          <div className="h-28 bg-white border border-navy-100 rounded-m3-lg p-5" />
        </div>
      ) : inquiries.length > 0 ? (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-white rounded-m3-lg border border-navy-100 p-5 shadow-xs space-y-3 hover:border-navy-200 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-navy-900 text-base">
                    {inq.property?.title || 'Property Listing'}
                  </h3>
                  <div className="text-xs text-navy-500 mt-0.5">
                    Landlord:{' '}
                    <span className="font-semibold text-navy-700">
                      {inq.landlord?.fullName || 'Verified Landlord'}
                    </span>
                    {inq.landlord?.phoneNumber && ` • Phone: ${inq.landlord.phoneNumber}`}
                  </div>
                </div>
                <div>{getStatusBadge(inq.status)}</div>
              </div>

              {/* Message block */}
              <div className="bg-navy-50/70 p-3 rounded-m3-md text-xs text-navy-800 leading-relaxed border border-navy-100">
                <span className="font-bold text-navy-900 block mb-1">Your Note:</span>
                &ldquo;{inq.message}&rdquo;
              </div>

              {/* Footer info */}
              <div className="pt-2 border-t border-navy-50 flex items-center justify-between text-[11px] text-navy-400">
                <div>
                  Submitted on {new Date(inq.createdAt).toLocaleDateString('en-PK')}
                  {inq.proposedMoveInDate && (
                    <span>
                      {' '}
                      • Move-In: {new Date(inq.proposedMoveInDate).toLocaleDateString('en-PK')}
                    </span>
                  )}
                </div>
                {inq.property && (
                  <Link
                    href={`/properties/${inq.property.slug || inq.property.id}`}
                    className="font-bold text-peshawar-700 hover:underline"
                  >
                    View Listing →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📬"
          title="No Inquiries Submitted"
          description="You haven't contacted any landlords yet. Browse verified Peshawar properties and send an inquiry to schedule a viewing."
          actionText="Find Accommodations"
          actionHref="/properties"
        />
      )}
    </main>
  );
}
