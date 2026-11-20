'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBookingById, createPaymentIntent, submitManualPaymentSlip } from '../../../../lib/api';

export default function BookingPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params['id'] as string;

  const [booking, setBooking] = useState<any>(null);
  const [method, setMethod] = useState<'MANUAL_BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA'>(
    'MANUAL_BANK_TRANSFER',
  );
  const [bankName, setBankName] = useState('Meezan Bank');
  const [txRef, setTxRef] = useState('');
  const [slipUrl, setSlipUrl] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      const token = localStorage.getItem('token') || '';
      getBookingById(bookingId, token)
        .then(setBooking)
        .catch((err) => setError(err.message || 'Failed to load booking'));
    }
  }, [bookingId]);

  const handleSubmitSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txRef || !slipUrl) {
      setError('Please provide transaction reference number and receipt slip URL.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const amountPkr = Number(booking.totalInitialAmountPkr);

      await submitManualPaymentSlip(
        {
          bookingId,
          bankName,
          transactionReference: txRef,
          slipUrl,
          amountPkr,
          accountTitle,
        },
        token,
      );

      alert('Payment slip submitted successfully! The landlord or admin will verify it shortly.');
      router.push(`/bookings/${bookingId}`);
    } catch (err: any) {
      setError(err.message || 'Payment submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitalGateway = async (providerMethod: 'JAZZCASH' | 'EASYPAISA') => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const intent = await createPaymentIntent(
        {
          bookingId,
          amountPkr: Number(booking.totalInitialAmountPkr),
          paymentMethodType: providerMethod,
        },
        token,
      );

      if (intent?.redirectUrl) {
        window.location.href = intent.redirectUrl;
      } else {
        alert('Gateway intent generated. Sandbox simulation active.');
        router.push(`/bookings/${bookingId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize gateway payment');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-slate-500">
        Loading payment details...
      </div>
    );
  }

  const initialAmount = Number(booking.totalInitialAmountPkr || 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Rental Escrow Payment</h1>
      <p className="text-slate-600 mt-1">
        Booking #{booking.id.substring(0, 8)} • {booking.property?.title}
      </p>

      {error && (
        <div className="my-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Amount Due Banner */}
      <div className="my-6 p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center">
        <div>
          <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider">
            Amount Due (Advance + Deposit)
          </span>
          <div className="text-2xl font-extrabold text-emerald-950 mt-1">
            PKR {initialAmount.toLocaleString()}
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-200 text-emerald-900 font-bold text-xs rounded-md">
          Secure Escrow Trust
        </span>
      </div>

      {/* Payment Method Selector */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setMethod('MANUAL_BANK_TRANSFER')}
          className={`flex-1 py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
            method === 'MANUAL_BANK_TRANSFER'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Offline IBFT Bank Transfer
        </button>
        <button
          type="button"
          onClick={() => setMethod('JAZZCASH')}
          className={`flex-1 py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
            method === 'JAZZCASH'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          JazzCash
        </button>
        <button
          type="button"
          onClick={() => setMethod('EASYPAISA')}
          className={`flex-1 py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
            method === 'EASYPAISA'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Easypaisa
        </button>
      </div>

      {method === 'MANUAL_BANK_TRANSFER' ? (
        <div className="space-y-6">
          {/* Escrow Bank Account Instructions */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3">
              Official Escrow Bank Account Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
              <div>
                <span className="text-slate-400 text-xs block">Bank Name</span>
                <span className="font-semibold text-slate-800">Bank of Khyber (BOK)</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Account Title</span>
                <span className="font-semibold text-slate-800">Peshawar Rental Escrow Trust</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">IBAN Number</span>
                <span className="font-mono font-semibold text-slate-800">
                  PK36BOKH0000001234567890
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Reference Code (Mandatory)</span>
                <span className="font-mono font-bold text-emerald-700">
                  BOOK-{booking.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Transfer PKR {initialAmount.toLocaleString()} via your mobile banking app or ATM, then
              upload the receipt below.
            </p>
          </div>

          {/* Submission Form */}
          <form
            onSubmit={handleSubmitSlip}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900">
              Upload Transfer Slip for Verification
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Your Bank Name
              </label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Meezan, HBL, Bank of Khyber, Faysal"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Transaction Reference / RRN Number
              </label>
              <input
                type="text"
                required
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="e.g. FT26054998234 or ATM Txn ID"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sender Account Title (Optional)
              </label>
              <input
                type="text"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                placeholder="Name on your bank account"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Receipt Slip Screenshot / Document URL
              </label>
              <input
                type="url"
                required
                value={slipUrl}
                onChange={(e) => setSlipUrl(e.target.value)}
                placeholder="https://storage.example.com/receipt-slip.jpg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
            >
              {loading
                ? 'Submitting Transfer Slip...'
                : 'Submit Slip for Landlord & Admin Verification'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center py-10">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Pay via {method}</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
            You will be redirected to the secure {method} payment portal to authorize PKR{' '}
            {initialAmount.toLocaleString()}.
          </p>
          <button
            onClick={() => handleDigitalGateway(method)}
            disabled={loading}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
          >
            {loading ? 'Connecting to Gateway...' : `Proceed with ${method}`}
          </button>
        </div>
      )}
    </div>
  );
}
