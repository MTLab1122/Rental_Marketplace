'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBookingRequest, getPropertyBySlugOrId } from '../../../lib/api';

function NewBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get('inquiryId') || '';
  const propertyId = searchParams.get('propertyId') || '';

  const [property, setProperty] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tenantCount, setTenantCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      getPropertyBySlugOrId(propertyId)
        .then(setProperty)
        .catch((err: any) => setError(err.message || 'Could not fetch property details'));
    }
  }, [propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryId || !propertyId) {
      setError('Missing inquiry or property ID. Bookings must originate from an accepted inquiry.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select both tenancy start and end dates.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const booking = await createBookingRequest(
        {
          inquiryId,
          propertyId,
          startDate,
          endDate,
          tenantCount,
          notes,
        },
        token,
      );

      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };

  const monthlyRent = Number(property?.monthlyRentPkr || 0);
  const securityDeposit = Number(property?.securityDepositPkr || property?.monthlyRentPkr || 0);
  const totalInitial = monthlyRent + securityDeposit;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Submit Rental Booking Request</h1>
      <p className="text-slate-600 mt-1">
        Official Peshawar rental reservation. An accepted inquiry is required.
      </p>

      {error && (
        <div className="my-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {property && (
        <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h2 className="font-semibold text-slate-900">{property.title}</h2>
          <p className="text-sm text-slate-500">{property.address || 'Peshawar'}</p>
          <div className="mt-3 flex gap-4 text-xs font-semibold text-slate-700">
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded">
              Eligibility: {property.eligibility}
            </span>
            <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded">
              Monthly Rent: PKR {monthlyRent.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tenancy Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tenancy End Date
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Number of Occupants
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={tenantCount}
            onChange={(e) => setTenantCount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Additional Notes / Move-in Requests
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special requests or timing for moving in..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-sm">
          <div className="flex justify-between text-slate-700">
            <span>Advance First Month Rent:</span>
            <span className="font-semibold">PKR {monthlyRent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Refundable Security Deposit:</span>
            <span className="font-semibold">PKR {securityDeposit.toLocaleString()}</span>
          </div>
          <div className="border-t border-emerald-300 pt-2 flex justify-between font-bold text-emerald-900 text-base">
            <span>Total Initial Escrow Amount:</span>
            <span>PKR {totalInitial.toLocaleString()}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting Request...' : 'Submit Booking Request'}
        </button>
      </form>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto p-8 text-center text-slate-500">
          Loading booking form...
        </div>
      }
    >
      <NewBookingContent />
    </Suspense>
  );
}
