'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getReceiptByNumber } from '../../../lib/api';

export default function ReceiptPage() {
  const params = useParams();
  const receiptNumber = params['number'] as string;

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (receiptNumber) {
      setLoading(true);
      getReceiptByNumber(receiptNumber)
        .then(setReceipt)
        .catch((err: any) => setError(err.message || 'Failed to load receipt'))
        .finally(() => setLoading(false));
    }
  }, [receiptNumber]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-slate-500">
        Loading receipt #{receiptNumber}...
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
          {error || 'Receipt not found'}
        </div>
      </div>
    );
  }

  const payment = receipt.payment;
  const booking = payment?.booking;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
        >
          Print Receipt
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none">
        <div className="flex justify-between items-start pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900">PESHAWAR RENTAL MARKETPLACE</h1>
            <p className="text-xs text-slate-500 mt-1">Official Escrow Payment Receipt</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Receipt No.</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {receipt.receiptNumber}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-6 text-sm border-b border-slate-200">
          <div>
            <span className="text-xs text-slate-400 block">Issued To (Tenant)</span>
            <span className="font-semibold text-slate-800 block">{booking?.tenant?.fullName}</span>
            <span className="text-xs text-slate-500">{booking?.tenant?.email}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Paid To (Landlord Escrow)</span>
            <span className="font-semibold text-slate-800 block">
              {booking?.landlord?.fullName}
            </span>
            <span className="text-xs text-slate-500">{booking?.landlord?.email}</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-slate-400 block">Premises Description</span>
            <span className="font-medium text-slate-800">{booking?.property?.title}</span>
            <span className="text-xs text-slate-500 block">{booking?.property?.address}</span>
          </div>
        </div>

        <div className="py-6 border-b border-slate-200 text-sm space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Payment Method:</span>
            <span className="font-semibold text-slate-800">{payment?.paymentMethodType}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Transaction Reference:</span>
            <span className="font-mono text-slate-800">
              {payment?.providerTransactionId || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Payment Status:</span>
            <span className="font-semibold text-emerald-700">{payment?.status}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Issue Date:</span>
            <span className="text-slate-800">{new Date(receipt.issuedAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-6 flex justify-between items-center text-base font-bold text-slate-900">
          <span>Total Amount Paid (PKR):</span>
          <span className="text-emerald-700 text-xl">
            PKR {Number(payment?.amountPkr || 0).toLocaleString()}
          </span>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          This receipt certifies escrow payment held under Khyber Pakhtunkhwa Tenancy & Rental
          Regulations.
        </div>
      </div>
    </div>
  );
}
