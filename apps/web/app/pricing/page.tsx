'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheckIcon } from '../../components/Icons';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  const plans = [
    {
      id: 'STARTER',
      name: 'Starter Landlord',
      badge: 'Free Forever',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      description:
        'Ideal for homeowners renting an individual portion or single property in Peshawar.',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        'Up to 2 active property listings',
        'Standard municipal & CNIC verification',
        'Direct tenant chat & inquiries',
        'Standard search indexing',
        'Free digital rental agreement templates',
        'Basic listing performance metrics',
      ],
      notIncluded: [
        'Priority moderation queue',
        'Verified Landlord Gold badge',
        'Featured search placement',
        'Dedicated WhatsApp concierge',
      ],
      ctaText: 'Start Free Listing',
      ctaLink: '/landlord/properties/new',
      popular: false,
    },
    {
      id: 'PRO',
      name: 'Pro Landlord',
      badge: 'Most Popular',
      badgeColor: 'bg-peshawar-50 text-peshawar-700 border-peshawar-200',
      description:
        'Built for active landlords with multiple properties across Hayatabad, Town, and City.',
      monthlyPrice: 3500,
      annualPrice: 35000,
      features: [
        'Up to 8 active property listings',
        'Priority verification (Under 2 hours)',
        'Verified Landlord Trust Badge',
        '2 Free Featured Listing boosts / month',
        'Instant WhatsApp lead notifications',
        'Tenant credit & history verification',
        'Standard digital lease signing',
        'Priority phone & WhatsApp support',
      ],
      notIncluded: ['Bulk CSV property import', 'Dedicated account manager'],
      ctaText: 'Upgrade to Pro',
      ctaLink: '/checkout/promotion?plan=PRO',
      popular: true,
    },
    {
      id: 'AGENCY',
      name: 'Hostel & Agency Suite',
      badge: 'Commercial Scale',
      badgeColor: 'bg-navy-100 text-navy-800 border-navy-200',
      description:
        'Designed for private student hostel operators, estate consultants, and property management firms.',
      monthlyPrice: 9500,
      annualPrice: 95000,
      features: [
        'Up to 35 active property or hostel listings',
        'Instant moderation bypass (trusted status)',
        '10 Free Featured Listing boosts / month',
        'Locality sponsorship discounts',
        'Bulk CSV listing upload & API access',
        'Multi-agent team seats (3 sub-accounts)',
        'Automated rent reminder SMS to tenants',
        'Dedicated account manager in Peshawar',
      ],
      notIncluded: [],
      ctaText: 'Choose Agency Suite',
      ctaLink: '/checkout/promotion?plan=AGENCY',
      popular: false,
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-peshawar-100 text-peshawar-800 text-xs font-bold uppercase tracking-wider mb-4 border border-peshawar-200">
            Transparent PKR Pricing • No Hidden Broker Cuts
          </div>
          <h1 className="text-4xl font-extrabold text-navy-950 sm:text-5xl tracking-tight">
            Transparent Pricing for Peshawar Landlords
          </h1>
          <p className="mt-4 text-lg text-navy-600">
            List individual portions for free forever, or boost your rental occupancy with Pro
            verified visibility and lead acceleration.
          </p>

          {/* Tenant Guarantee Banner */}
          <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-md text-sm font-semibold">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>100% Free for Tenants:</strong> Zero search charges, zero contact fees, and
              zero commission on any booking.
            </span>
          </div>

          {/* Billing Toggle */}
          <div className="mt-8 flex justify-center items-center gap-3">
            <span
              className={`text-sm font-semibold ${billingCycle === 'MONTHLY' ? 'text-navy-900' : 'text-navy-500'}`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY')}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                billingCycle === 'ANNUAL' ? 'bg-peshawar-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-md bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  billingCycle === 'ANNUAL' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-sm font-semibold flex items-center gap-1.5 ${billingCycle === 'ANNUAL' ? 'text-navy-900' : 'text-navy-500'}`}
            >
              Annual
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                Save 17%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
          {plans.map((plan) => {
            const price = billingCycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
            const periodLabel = billingCycle === 'ANNUAL' ? '/year' : '/month';

            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between bg-white rounded-2xl p-8 border transition-all duration-200 ${
                  plan.popular
                    ? 'border-peshawar-500 ring-2 ring-peshawar-500 shadow-xl relative scale-105 z-10'
                    : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-peshawar-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-md shadow-md">
                    Recommended for Landlords
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-navy-950">{plan.name}</h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border ${plan.badgeColor}`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                  <p className="text-sm text-navy-600 mb-6 min-h-[40px]">{plan.description}</p>

                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-navy-950">
                        {price === 0 ? 'Free' : `PKR ${price.toLocaleString()}`}
                      </span>
                      {price > 0 && (
                        <span className="text-sm font-medium text-navy-500">{periodLabel}</span>
                      )}
                    </div>
                    {billingCycle === 'ANNUAL' && price > 0 && (
                      <p className="text-xs text-emerald-600 font-semibold mt-1">
                        Billed annually (Equivalent to PKR {Math.round(price / 12).toLocaleString()}
                        /mo)
                      </p>
                    )}
                  </div>

                  {/* Feature List */}
                  <div className="space-y-3 mb-8 text-sm">
                    <p className="text-xs font-bold text-navy-400 uppercase tracking-wider">
                      Features Included
                    </p>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <svg
                          className="w-5 h-5 text-peshawar-600 shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-navy-800 font-medium">{feature}</span>
                      </div>
                    ))}

                    {plan.notIncluded.length > 0 && (
                      <>
                        <div className="pt-2 text-xs font-bold text-navy-400 uppercase tracking-wider">
                          Not Included
                        </div>
                        {plan.notIncluded.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2.5 opacity-50">
                            <svg
                              className="w-5 h-5 text-slate-400 shrink-0 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            <span className="text-slate-500">{feature}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <Link
                  href={plan.ctaLink}
                  className={`w-full py-3 px-4 rounded-xl text-center font-bold text-sm transition-all duration-200 block shadow-sm ${
                    plan.popular
                      ? 'bg-peshawar-600 text-white hover:bg-peshawar-700 shadow-peshawar-200'
                      : 'bg-navy-900 text-white hover:bg-navy-800'
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Payment Methods Notice */}
        <div className="bg-white rounded-2xl border border-navy-100 p-8 shadow-sm mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h3 className="text-lg font-bold text-navy-900">
                Pakistani Payment Options & Offline Invoicing
              </h3>
              <p className="text-sm text-navy-600 mt-1">
                We accept direct bank transfers (Meezan Bank, HBL, Bank of Khyber), JazzCash, and
                EasyPaisa. Official digital KPRA-compliant tax receipts and credit notes are issued
                automatically for all commercial accounts.
              </p>
            </div>
            <div className="flex md:justify-end gap-3 items-center">
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold">
                JazzCash / EasyPaisa
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold">
                IBAN Transfer
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                KPRA Invoiced
              </span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-navy-950 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-navy-900">Are tenants really 100% free forever?</h4>
              <p className="text-sm text-navy-600 mt-2">
                Yes. Tenants pay zero fees to search, contact landlords, send inquiries, or sign
                agreements on Rental Peshawar. We strictly eliminate middleman brokerage
                commissions.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-navy-900">
                Can I pay offline using JazzCash or direct bank transfer?
              </h4>
              <p className="text-sm text-navy-600 mt-2">
                Yes! When selecting any Pro or Agency package, you receive our official bank IBAN
                and JazzCash till number. Submit your transaction ID or payment slip, and our team
                activates your account within 1 hour.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-navy-900">
                What happens if I exceed my active listings limit?
              </h4>
              <p className="text-sm text-navy-600 mt-2">
                Free Starter accounts can keep 2 active listings at any time. When you mark a
                listing as rented or draft, you can publish a new one, or upgrade to Pro (8
                listings) or Agency (35 listings) anytime.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-navy-900">What is the refund policy?</h4>
              <p className="text-sm text-navy-600 mt-2">
                We offer a 7-day money-back guarantee on annual plans if no promotional boosts have
                been redeemed. If a listing is rejected by our moderation team, any paid boost fee
                is refunded or credited immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
