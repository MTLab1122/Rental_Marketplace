'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import {
  getMyInquiries,
  getLandlordInquiries,
  updateInquiryStatus,
  deleteInquiry,
} from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import { InquiryResponseDto, InquiryStatus } from '@rental-peshawar/shared-types';

export default function InquiriesPage() {
  const { token, isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [sentInquiries, setSentInquiries] = useState<InquiryResponseDto[]>([]);
  const [receivedInquiries, setReceivedInquiries] = useState<InquiryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const isLandlord = user?.roles?.includes('LANDLORD') || user?.roles?.includes('ADMIN');

  const loadInquiries = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const myInqs = await getMyInquiries(token);
      setSentInquiries(myInqs || []);

      if (isLandlord) {
        try {
          const recInqs = await getLandlordInquiries(token);
          setReceivedInquiries(recInqs || []);
        } catch {
          // not a landlord or no properties
        }
      }
    } catch (err) {
      console.error('Failed to load inquiries', err);
    } finally {
      setLoading(false);
    }
  }, [token, isLandlord]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    if (!token) return;
    setStatusUpdating(inquiryId);
    try {
      await updateInquiryStatus(inquiryId, newStatus, token);
      await loadInquiries();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Could not update status. Please try again.');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleWithdraw = async (inquiryId: string) => {
    if (!token || !confirm('Are you sure you want to withdraw or close this inquiry?')) return;
    try {
      await deleteInquiry(inquiryId, token);
      await loadInquiries();
    } catch (err) {
      console.error('Failed to close inquiry', err);
    }
  };

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
            ✓ Accepted
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
            💬 Replied
          </span>
        );
      case 'SEEN':
        return (
          <span className="px-2.5 py-0.5 rounded-m3-sm text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
            👀 Seen
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 rounded-m3-sm text-xs font-extrabold bg-navy-100 text-navy-500 border border-navy-200">
            🔒 Closed
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

  const displayedList = activeTab === 'sent' ? sentInquiries : receivedInquiries;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-navy-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            Rental Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            Track inquiries, direct messages, and authorized WhatsApp contacts.
          </p>
        </div>

        {isLandlord && (
          <div className="flex rounded-m3-md bg-navy-100 p-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-3 py-1.5 text-xs font-bold rounded-m3-sm transition ${
                activeTab === 'sent'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              My Applications ({sentInquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-3 py-1.5 text-xs font-bold rounded-m3-sm transition ${
                activeTab === 'received'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              Received Inquiries ({receivedInquiries.length})
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-white border border-navy-100 rounded-m3-lg p-5" />
          <div className="h-28 bg-white border border-navy-100 rounded-m3-lg p-5" />
        </div>
      ) : displayedList.length > 0 ? (
        <div className="space-y-4">
          {displayedList.map((inq) => (
            <div
              key={inq.id}
              className="bg-white rounded-m3-lg border border-navy-100 p-5 shadow-xs space-y-4 hover:border-navy-200 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-navy-900 text-base">
                    {inq.property?.title || 'Peshawar Rental Listing'}
                  </h3>
                  <div className="text-xs text-navy-500 mt-0.5">
                    {activeTab === 'sent' ? (
                      <>
                        Landlord:{' '}
                        <span className="font-semibold text-navy-700">
                          {inq.landlord?.fullName || 'Verified Landlord'}
                        </span>
                      </>
                    ) : (
                      <>
                        Tenant applicant:{' '}
                        <span className="font-semibold text-navy-700">
                          {inq.tenant?.fullName || 'Verified Tenant'}
                        </span>
                        {inq.tenant?.email && ` (${inq.tenant.email})`}
                      </>
                    )}
                    {inq.proposedRentPkr && (
                      <span className="ml-2 font-bold text-peshawar-700">
                        • Proposed: PKR {inq.proposedRentPkr.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">{getStatusBadge(inq.status)}</div>
              </div>

              {/* Message block */}
              <div className="bg-navy-50/70 p-3 rounded-m3-md text-xs text-navy-800 leading-relaxed border border-navy-100">
                <span className="font-bold text-navy-900 block mb-1">
                  {activeTab === 'sent' ? 'Your Inquiring Message:' : 'Applicant Note:'}
                </span>
                &ldquo;{inq.message}&rdquo;
              </div>

              {/* Communication safety / WhatsApp section */}
              {inq.canContactWhatsapp && inq.whatsappUrl && (
                <div className="bg-peshawar-50 border border-peshawar-200 rounded-m3-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-peshawar-900">
                    <span className="font-extrabold block">✓ Contact Authorization Unlocked</span>
                    The landlord has accepted your inquiry and authorized direct WhatsApp
                    communication.
                  </div>
                  <a
                    href={inq.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-peshawar-600 hover:bg-peshawar-700 text-white font-extrabold text-xs rounded-m3-md transition shadow-xs whitespace-nowrap"
                  >
                    <span>💬</span> Chat on WhatsApp
                  </a>
                </div>
              )}

              {/* Landlord action buttons */}
              {activeTab === 'received' && (
                <div className="pt-2 border-t border-navy-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-navy-700 mr-2">Update Status:</span>
                  <button
                    disabled={statusUpdating === inq.id || inq.status === InquiryStatus.ACCEPTED}
                    onClick={() => handleStatusChange(inq.id, InquiryStatus.ACCEPTED)}
                    className="px-3 py-1 bg-peshawar-600 text-white rounded-m3-sm text-xs font-bold hover:bg-peshawar-700 transition disabled:opacity-50"
                  >
                    Accept & Reveal WhatsApp
                  </button>
                  <button
                    disabled={statusUpdating === inq.id || inq.status === InquiryStatus.REPLIED}
                    onClick={() => handleStatusChange(inq.id, InquiryStatus.REPLIED)}
                    className="px-3 py-1 bg-terracotta-600 text-white rounded-m3-sm text-xs font-bold hover:bg-terracotta-700 transition disabled:opacity-50"
                  >
                    Mark Replied
                  </button>
                  <button
                    disabled={statusUpdating === inq.id || inq.status === InquiryStatus.DECLINED}
                    onClick={() => handleStatusChange(inq.id, InquiryStatus.DECLINED)}
                    className="px-3 py-1 bg-red-600 text-white rounded-m3-sm text-xs font-bold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    disabled={statusUpdating === inq.id || inq.status === InquiryStatus.CLOSED}
                    onClick={() => handleStatusChange(inq.id, InquiryStatus.CLOSED)}
                    className="px-3 py-1 bg-navy-200 text-navy-800 rounded-m3-sm text-xs font-bold hover:bg-navy-300 transition disabled:opacity-50"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Footer info & Links */}
              <div className="pt-2 border-t border-navy-50 flex flex-wrap items-center justify-between text-[11px] text-navy-400 gap-2">
                <div>
                  Submitted on {new Date(inq.createdAt).toLocaleDateString('en-PK')}
                  {inq.proposedMoveInDate && (
                    <span>
                      {' '}
                      • Move-In: {new Date(inq.proposedMoveInDate).toLocaleDateString('en-PK')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {inq.conversationId && (
                    <Link
                      href={`/messages?conversationId=${inq.conversationId}`}
                      className="font-bold text-peshawar-700 hover:underline flex items-center gap-1"
                    >
                      💬 Open In-App Chat
                    </Link>
                  )}
                  {inq.property && (
                    <Link
                      href={`/properties/${inq.property.slug || inq.property.id}`}
                      className="font-bold text-navy-600 hover:text-navy-900 hover:underline"
                    >
                      View Listing →
                    </Link>
                  )}
                  {activeTab === 'sent' && inq.status !== InquiryStatus.CLOSED && (
                    <button
                      onClick={() => handleWithdraw(inq.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📬"
          title={activeTab === 'sent' ? 'No Inquiries Submitted' : 'No Inquiries Received'}
          description={
            activeTab === 'sent'
              ? 'Find a verified student or family home and reach out directly to the landlord.'
              : 'You have not received any inquiries for your rental properties yet.'
          }
          actionText={activeTab === 'sent' ? 'Browse Peshawar Properties' : undefined}
          actionHref={activeTab === 'sent' ? '/properties' : undefined}
        />
      )}
    </main>
  );
}
