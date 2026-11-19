'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyBookings, cancelBooking } from '../../lib/api';

export default function BookingsPage() {
  const [role, setRole] = useState<'TENANT' | 'LANDLORD'>('TENANT');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, [role]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const data = await getMyBookings(role, token);
      setBookings(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;
    try {
      const token = localStorage.getItem('token') || '';
      await cancelBooking(bookingId, { cancellationReason: reason }, token);
      await loadBookings();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'DISPUTED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rental Bookings & Tenancies</h1>
          <p className="text-slate-600 mt-1">
            Manage verified bookings, agreements, and escrow transactions in Peshawar.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={() => setRole('TENANT')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              role === 'TENANT'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            My Rental Bookings (Tenant)
          </button>
          <button
            onClick={() => setRole('LANDLORD')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              role === 'LANDLORD'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Property Tenancies (Landlord)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading bookings...</div>
      ) : error ? (
        <div className="my-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
          {error}
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-slate-500 text-lg">No {role.toLowerCase()} bookings found.</p>
          <p className="text-slate-400 text-sm mt-1">
            Submit an inquiry on an approved Peshawar listing to start a booking.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 mt-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(booking.status)}`}
                  >
                    {booking.status}
                  </span>
                  <span className="text-xs text-slate-400">ID: {booking.id.substring(0, 8)}</span>
                </div>

                <h2 className="text-lg font-semibold text-slate-900 mt-2">
                  {booking.property?.title || 'Rental Property'}
                </h2>
                <p className="text-sm text-slate-500">
                  {booking.property?.address || 'Peshawar, KP'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs block">Monthly Rent</span>
                    <span className="font-semibold text-slate-800">
                      PKR {Number(booking.monthlyRentPkr || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Security Deposit</span>
                    <span className="font-semibold text-slate-800">
                      PKR {Number(booking.securityDepositPkr || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Tenancy Dates</span>
                    <span className="text-slate-700 font-medium">
                      {booking.startDate?.substring(0, 10)} to {booking.endDate?.substring(0, 10)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col justify-center gap-2 min-w-[180px] border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
                <Link
                  href={`/bookings/${booking.id}`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm text-center font-medium"
                >
                  View Details
                </Link>

                {booking.status === 'AWAITING_PAYMENT' && role === 'TENANT' && (
                  <Link
                    href={`/bookings/${booking.id}/payment`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm text-center font-medium"
                  >
                    Pay & Upload Slip
                  </Link>
                )}

                {booking.agreement?.id && (
                  <Link
                    href={`/agreements/${booking.agreement.id}/sign`}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-sm text-center font-medium"
                  >
                    Digital Agreement
                  </Link>
                )}

                {['REQUESTED', 'AWAITING_PAYMENT'].includes(booking.status) &&
                  role === 'TENANT' && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium"
                    >
                      Cancel Booking
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
