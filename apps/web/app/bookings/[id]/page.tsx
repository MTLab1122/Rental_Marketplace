'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getBookingById, updateBookingStatus, cancelBooking } from '../../../lib/api';

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params['id'] as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const data = await getBookingById(bookingId, token);
      setBooking(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!confirm(`Are you sure you want to update booking status to ${status}?`)) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      await updateBookingStatus(bookingId, { status }, token);
      await loadBooking();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      await cancelBooking(bookingId, { cancellationReason: reason }, token);
      await loadBooking();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500">
        Loading booking details...
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
          {error || 'Booking not found'}
        </div>
      </div>
    );
  }

  const latestPayment =
    booking.payments && booking.payments.length > 0 ? booking.payments[0] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Booking #{booking.id.substring(0, 8)}
            </h1>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              {booking.status}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Created on {new Date(booking.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2">
          {booking.status === 'AWAITING_PAYMENT' && (
            <Link
              href={`/bookings/${booking.id}/payment`}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"
            >
              Proceed to Payment
            </Link>
          )}

          {booking.agreement?.id && (
            <Link
              href={`/agreements/${booking.agreement.id}/sign`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold"
            >
              Sign Tenancy Agreement
            </Link>
          )}

          {['CONFIRMED', 'ACTIVE'].includes(booking.status) && (
            <Link
              href={`/disputes?bookingId=${booking.id}`}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-sm font-semibold"
            >
              Dispute Resolution
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 space-y-6">
          {/* Property Summary */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Premises Details</h2>
            <h3 className="font-semibold text-slate-800 text-base">{booking.property?.title}</h3>
            <p className="text-slate-500 text-sm">{booking.property?.address}</p>
            <p className="text-slate-500 text-sm mt-1">
              Locality: {booking.property?.locality?.name}, Peshawar
            </p>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
              <div>
                <span className="text-slate-400 text-xs block">Tenancy Duration</span>
                <span className="font-medium text-slate-800">
                  {booking.startDate?.substring(0, 10)} to {booking.endDate?.substring(0, 10)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Lock Expiry Window</span>
                <span className="font-medium text-amber-700">
                  {booking.lockExpiresAt ? new Date(booking.lockExpiresAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Escrow Financial Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Monthly Rent:</span>
                <span className="font-semibold text-slate-900">
                  PKR {Number(booking.monthlyRentPkr).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Security Deposit (Refundable Escrow):</span>
                <span className="font-semibold text-slate-900">
                  PKR {Number(booking.securityDepositPkr).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-slate-900 text-base">
                <span>Total Initial Amount:</span>
                <span className="text-emerald-700">
                  PKR {Number(booking.totalInitialAmountPkr).toLocaleString()}
                </span>
              </div>
            </div>

            {latestPayment && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Payment Status</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {latestPayment.status}
                  </span>
                </div>
                {latestPayment.receipt?.receiptNumber && (
                  <Link
                    href={`/receipts/${latestPayment.receipt.receiptNumber}`}
                    className="text-xs text-emerald-600 hover:underline font-semibold"
                  >
                    View Official Receipt #{latestPayment.receipt.receiptNumber}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Parties Involved */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Tenancy Parties
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Tenant</span>
                <span className="font-semibold text-slate-800 block">
                  {booking.tenant?.fullName}
                </span>
                <span className="text-slate-500 text-xs">{booking.tenant?.phoneNumber}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Landlord</span>
                <span className="font-semibold text-slate-800 block">
                  {booking.landlord?.fullName}
                </span>
                <span className="text-slate-500 text-xs">{booking.landlord?.phoneNumber}</span>
              </div>
            </div>
          </div>

          {/* Landlord & Tenant Management Controls */}
          {booking.status === 'REQUESTED' && (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Booking Actions</h2>
              <div className="space-y-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleStatusUpdate('AWAITING_PAYMENT')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow"
                >
                  Accept & Request Payment (Landlord)
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleCancel}
                  className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-sm font-semibold rounded-lg"
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          )}

          {booking.status === 'CONFIRMED' && (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Tenancy Control</h2>
              <button
                disabled={actionLoading}
                onClick={() => handleStatusUpdate('ACTIVE')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow"
              >
                Confirm Move-in (Activate)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
