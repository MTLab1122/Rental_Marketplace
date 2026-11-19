'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';

export default function PromotionCheckoutPage() {
  const { user } = useAuth();
  const defaultProperty = user ? `${user.id.slice(0, 8)}` : '';

  const [packageType, setPackageType] = useState<
    'FEATURED_LISTING' | 'TOP_SEARCH_PLACEMENT' | 'LOCALITY_SPONSORSHIP'
  >('FEATURED_LISTING');
  const [propertyId, setPropertyId] = useState(defaultProperty);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPct: number } | null>(
    null,
  );
  const [promoError, setPromoError] = useState<string | null>(null);
  const [txReference, setTxReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MEEZAN_BANK' | 'JAZZCASH' | 'EASYPAISA'>(
    'MEEZAN_BANK',
  );
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const packagePrices = {
    FEATURED_LISTING: {
      name: 'Featured Listing Badge',
      price: 1500,
      duration: '7 Days',
      description: 'Yellow highlight tag, pinned in locality top cards, 3x inquiry acceleration.',
    },
    TOP_SEARCH_PLACEMENT: {
      name: 'Top Search Placement',
      price: 2500,
      duration: '14 Days',
      description: 'Pinned at position #1-3 in all relevant student and family search queries.',
    },
    LOCALITY_SPONSORSHIP: {
      name: 'Exclusive Locality Sponsorship',
      price: 5000,
      duration: '30 Days',
      description: 'Sponsor a Peshawar locality (e.g. Hayatabad Phase 3) banner and search header.',
    },
  };

  const selectedPkg = packagePrices[packageType];
  const basePrice = selectedPkg.price;
  const discountAmount = appliedPromo
    ? Math.round((basePrice * appliedPromo.discountPct) / 100)
    : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoCode.trim().toUpperCase();

    if (code === 'PESHAWAR2026' || code === 'WELCOME20') {
      setAppliedPromo({ code, discountPct: 20 });
    } else if (code === 'FIRSTBOOST50') {
      setAppliedPromo({ code, discountPct: 50 });
    } else {
      setPromoError('Invalid or expired promo code. Try "PESHAWAR2026" or "WELCOME20".');
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      alert('Please enter or select your approved Property ID.');
      return;
    }
    if (!txReference) {
      alert('Please provide your Bank or Mobile Wallet transaction reference.');
      return;
    }

    setLoading(true);
    // Simulate transaction submission to monetization controller
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/pricing"
            className="text-xs font-bold text-navy-500 hover:text-navy-800 transition"
          >
            ← Back to Pricing
          </Link>
          <h1 className="text-3xl font-extrabold text-navy-950 mt-2">Boost Listing Visibility</h1>
          <p className="text-navy-600 text-sm mt-1">
            Accelerate verified tenant inquiries with targeted promotional placement across
            Peshawar.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-2xl p-8 border border-emerald-200 shadow-md text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-navy-950">Boost Request Submitted!</h2>
            <p className="text-navy-600 text-sm mt-2 max-w-lg mx-auto">
              We received your payment reference <strong>{txReference}</strong>. Once our accounting
              desk verifies the transfer ({paymentMethod}), your listing will be boosted within 30
              minutes.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/properties"
                className="bg-peshawar-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-peshawar-700 transition"
              >
                Go to Properties
              </Link>
              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition"
              >
                Confirm on WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="md:col-span-7 space-y-6">
              {/* Step 1: Package Selection */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider mb-4">
                  1. Select Promotion Package
                </h3>
                <div className="space-y-3">
                  {(
                    ['FEATURED_LISTING', 'TOP_SEARCH_PLACEMENT', 'LOCALITY_SPONSORSHIP'] as const
                  ).map((type) => {
                    const item = packagePrices[type];
                    const isSelected = packageType === type;
                    return (
                      <div
                        key={type}
                        onClick={() => setPackageType(type)}
                        className={`p-4 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'border-peshawar-600 bg-peshawar-50/50 ring-2 ring-peshawar-500'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-navy-950 text-sm">{item.name}</span>
                          <span className="font-extrabold text-peshawar-700 text-sm">
                            PKR {item.price.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-navy-600">{item.description}</p>
                        <span className="inline-block text-[11px] font-bold text-navy-400 mt-2">
                          Duration: {item.duration}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Property Selection */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider mb-4">
                  2. Select Approved Property
                </h3>
                <div>
                  <label className="block text-xs font-bold text-navy-700 uppercase mb-1">
                    Property ID or Listing Code
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    placeholder="e.g. prop-hayatabad-101 or UUID"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-peshawar-500 text-sm font-mono"
                  />
                  <p className="text-[11px] text-amber-700 mt-2 font-medium">
                    ⚠️ Rules: Only listings approved by Peshawar moderation with active availability
                    can be promoted.
                  </p>
                </div>
              </div>

              {/* Step 3: Offline Payment */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider mb-4">
                  3. Offline Payment & Transaction ID
                </h3>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['MEEZAN_BANK', 'JAZZCASH', 'EASYPAISA'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition ${
                        paymentMethod === method
                          ? 'bg-navy-900 text-white border-navy-900'
                          : 'bg-slate-50 text-navy-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method === 'MEEZAN_BANK'
                        ? 'Meezan Bank'
                        : method === 'JAZZCASH'
                          ? 'JazzCash'
                          : 'EasyPaisa'}
                    </button>
                  ))}
                </div>

                {/* Account Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono space-y-1 mb-4">
                  {paymentMethod === 'MEEZAN_BANK' && (
                    <>
                      <div className="font-bold text-navy-900">
                        Bank: Meezan Bank Ltd (Peshawar Saddar Branch)
                      </div>
                      <div>Account Title: Peshawar Rentals Pvt Ltd</div>
                      <div>Account No: 01020304050607</div>
                      <div>IBAN: PK65MEZN0001020304050607</div>
                    </>
                  )}
                  {paymentMethod === 'JAZZCASH' && (
                    <>
                      <div className="font-bold text-navy-900">JazzCash Till / Merchant ID</div>
                      <div>Merchant Code: 03001234567</div>
                      <div>Title: Rental Peshawar Services</div>
                    </>
                  )}
                  {paymentMethod === 'EASYPAISA' && (
                    <>
                      <div className="font-bold text-navy-900">EasyPaisa Account</div>
                      <div>Mobile No: 03451234567</div>
                      <div>Title: Rental Peshawar Services</div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-700 uppercase mb-1">
                    Transaction ID / Reference Number
                  </label>
                  <input
                    type="text"
                    required
                    value={txReference}
                    onChange={(e) => setTxReference(e.target.value)}
                    placeholder="e.g. TID-98237461 or Bank Ref"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-peshawar-500 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="md:col-span-5">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md sticky top-24">
                <h3 className="text-base font-bold text-navy-950 pb-4 border-b border-slate-100">
                  Order Summary
                </h3>

                <div className="py-4 space-y-2 text-sm border-b border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-navy-600">{selectedPkg.name}</span>
                    <span className="font-bold text-navy-950">
                      PKR {basePrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-navy-500">
                    <span>Duration</span>
                    <span>{selectedPkg.duration}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>
                        Promo ({appliedPromo.code} - {appliedPromo.discountPct}%)
                      </span>
                      <span>- PKR {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="py-4 border-b border-slate-100">
                  <label className="block text-xs font-bold text-navy-700 uppercase mb-1.5">
                    Have a Promo Code?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. PESHAWAR2026"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-peshawar-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-red-600 mt-1.5 font-medium">{promoError}</p>
                  )}
                  {appliedPromo && (
                    <p className="text-[11px] text-emerald-600 mt-1.5 font-bold">
                      ✓ Promo code {appliedPromo.code} applied successfully!
                    </p>
                  )}
                </form>

                {/* Total */}
                <div className="pt-4 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-navy-950">Total Payable</span>
                    <span className="text-2xl font-extrabold text-navy-950">
                      PKR {finalPrice.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    KPRA Sales Tax Included where applicable
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-3 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold rounded-xl shadow-md transition text-sm disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Submit Boost Order'}
                </button>

                <p className="text-[11px] text-slate-400 text-center mt-3">
                  🔒 Transactions are audited and backed by our Peshawar dispute escrow protocol.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
