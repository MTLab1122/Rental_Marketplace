'use client';

import React, { useState, useEffect } from 'react';
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
import {
  ChatIcon,
  CheckIcon,
  CloseIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '../../components/Icons';

export default function InquiriesPage() {
  const { token, user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [sentInquiries, setSentInquiries] = useState<InquiryResponseDto[]>([]);
  const [receivedInquiries, setReceivedInquiries] = useState<InquiryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const isLandlord = user?.roles?.includes('LANDLORD');

  useEffect(() => {
    if (!token) return;

    async function loadInquiries() {
      setLoading(true);
      try {
        const sent = await getMyInquiries(token!);
        setSentInquiries(sent || []);

        if (isLandlord) {
          const rec = await getLandlordInquiries(token!);
          setReceivedInquiries(rec || []);
        }
      } catch (err) {
        console.error('Failed to load inquiries', err);
      } finally {
        setLoading(false);
      }
    }

    loadInquiries();
  }, [token, isLandlord]);

  const handleStatusChange = async (inquiryId: string, status: InquiryStatus) => {
    if (!token) return;
    setStatusUpdating(inquiryId);
    try {
      await updateInquiryStatus(inquiryId, status, token);
      const rec = await getLandlordInquiries(token);
      setReceivedInquiries(rec || []);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleWithdraw = async (inquiryId: string) => {
    if (!token || !confirm('Are you sure you want to withdraw this inquiry?')) return;
    try {
      await deleteInquiry(inquiryId, token);
      setSentInquiries((prev) => prev.filter((i) => i.id !== inquiryId));
    } catch (err) {
      console.error('Failed to withdraw inquiry', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={<ShieldCheckIcon className="w-10 h-10 text-navy-400" />}
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
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-peshawar-100 text-peshawar-800 border border-peshawar-300 inline-flex items-center gap-1">
            <CheckIcon className="w-3 h-3 text-peshawar-700" />
            <span>Accepted</span>
          </span>
        );
      case 'DECLINED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1">
            <CloseIcon className="w-3 h-3 text-red-700" />
            <span>Declined</span>
          </span>
        );
      case 'REPLIED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-terracotta-100 text-terracotta-700 border border-terracotta-300 inline-flex items-center gap-1">
            <ChatIcon className="w-3 h-3 text-terracotta-700" />
            <span>Replied</span>
          </span>
        );
      case 'SEEN':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
            Seen
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-navy-100 text-navy-600 border border-navy-200">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-navy-100 text-navy-800 border border-navy-200">
            Submitted
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
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Track inquiries, direct messages, and authorized WhatsApp contacts.
          </p>
        </div>

        {isLandlord && (
          <div className="flex rounded-md bg-navy-100 p-1 self-start sm:self-auto border border-navy-200">
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                activeTab === 'sent'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              My Applications ({sentInquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
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
        <div className="space-y-4">
          <div className="h-28 bg-white border border-navy-100 rounded-md p-5" />
          <div className="h-28 bg-white border border-navy-100 rounded-md p-5" />
        </div>
      ) : displayedList.length > 0 ? (
        <div className="space-y-4">
          {displayedList.map((inq: any) => (
            <div
              key={inq.id}
              className="bg-white rounded-md border border-navy-100 p-5 shadow-xs space-y-4 hover:border-navy-200 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-navy-900 text-base">
                    {inq.property?.title || 'Peshawar Rental Listing'}
                  </h3>
                  <div className="text-xs text-navy-600 mt-0.5">
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
              <div className="bg-navy-50/70 p-3 rounded-md text-xs text-navy-800 leading-relaxed border border-navy-100">
                <span className="font-bold text-navy-900 block mb-1">
                  {activeTab === 'sent' ? 'Your Inquiring Message:' : 'Applicant Note:'}
                </span>
                &ldquo;{inq.message}&rdquo;
              </div>

              {/* Communication safety / WhatsApp section */}
              {inq.canContactWhatsapp && inq.whatsappUrl && (
                <div className="bg-peshawar-50 border border-peshawar-200 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-peshawar-900">
                    <span className="font-extrabold block">Contact Authorization Unlocked</span>
                    The landlord has accepted your inquiry and authorized direct WhatsApp
                    communication.
                  </div>
                  <a
                    href={inq.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-peshawar-600 hover:bg-peshawar-700 text-white font-extrabold text-xs rounded-md transition shadow-xs whitespace-nowrap focus-visible:ring-2 focus-visible:ring-peshawar-500"
                  >
                    <ChatIcon className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
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
                    className="px-3 py-1 bg-peshawar-600 text-white rounded-md text-xs font-bold hover:bg-peshawar-700 transition disabled:opacity-50"
                  >
                    Accept & Reveal WhatsApp
                  </button>
                  <button
                    disabled={statusUpdating === inq.id || inq.status === InquiryStatus.REPLIED}
                    onClick={() => handleStatusChange(inq.id, InquiryStatus.REPLIED)}
                    className="px-3 py-1 bg-terracotta-600 text-white rounded-md text-xs font-bold hover:bg-terracotta-700 transition disabled:opacity-50"
                  >
                    Mark Replied
                  </button>
                  <button
                    disabled={statusUpdating === inq.id || inq.status === InquiryStatus.DECLINED}
                    onClick={() => handleStatusChange(inq.id, InquiryStatus.DECLINED)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    disabled={statusUpdating === inq.id || inq.status === InquiryStatus.CLOSED}
                    onClick={() => handleStatusChange(inq.id, InquiryStatus.CLOSED)}
                    className="px-3 py-1 bg-navy-200 text-navy-800 rounded-md text-xs font-bold hover:bg-navy-300 transition disabled:opacity-50"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Footer info & Links */}
              <div className="pt-2 border-t border-navy-50 flex flex-wrap items-center justify-between text-[11px] text-navy-500 gap-2">
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
                      <ChatIcon className="w-3.5 h-3.5" />
                      <span>Open In-App Chat</span>
                    </Link>
                  )}
                  {inq.property && (
                    <Link
                      href={`/properties/${inq.property.slug || inq.property.id}`}
                      className="font-bold text-navy-600 hover:text-navy-900 hover:underline flex items-center gap-1"
                    >
                      <span>View Listing</span>
                      <ArrowRightIcon className="w-3 h-3" />
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
          icon={<ChatIcon className="w-10 h-10 text-navy-400" />}
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
