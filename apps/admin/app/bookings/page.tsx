'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '../../components/AdminShell';
import { getAllBookingsAdmin } from '../../lib/api';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBookingsAdmin(statusFilter || undefined);
      setBookings(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'ACTIVE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'DISPUTED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <AdminShell>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Bookings & Leases Console</h1>
            <p className="text-slate-400 text-sm mt-1">
              Oversee property booking states, 24h payment reservation locks, and double-booking
              controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="REQUESTED">REQUESTED</option>
              <option value="AWAITING_PAYMENT">AWAITING_PAYMENT</option>
              <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="DISPUTED">DISPUTED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="my-6 p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            No bookings match the selected criteria.
          </div>
        ) : (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Tenant</th>
                    <th className="py-3 px-4">Landlord</th>
                    <th className="py-3 px-4">Initial Escrow (PKR)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Lock Expiration</th>
                    <th className="py-3 px-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {b.id.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {b.property?.title || 'Unknown Property'}
                      </td>
                      <td className="py-3 px-4">{b.tenant?.fullName || 'N/A'}</td>
                      <td className="py-3 px-4">{b.landlord?.fullName || 'N/A'}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        PKR {Number(b.totalInitialAmountPkr || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(b.status)}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {b.lockExpiresAt ? new Date(b.lockExpiresAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
