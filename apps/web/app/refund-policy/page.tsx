import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { constructMetadata } from '../../lib/seo';
import { ShieldCheckIcon, CheckIcon, ScaleIcon } from '../../components/Icons';

export const metadata: Metadata = constructMetadata({
  title: 'Refund & Escrow Cancellation Policy | Peshawar Rentals Verified Portal',
  description:
    'Comprehensive refund and escrow cancellation terms for tenants and landlords in Peshawar, Khyber Pakhtunkhwa. Clear rules for security deposit returns, booking cancellations, and fee disputes.',
  canonical: '/refund-policy',
});

export default function RefundPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-navy-900">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-navy-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold">Refund Policy</span>
      </nav>

      {/* Header */}
      <header className="border-b border-navy-200 pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-peshawar-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
          <ShieldCheckIcon className="w-4 h-4 text-peshawar-600" />
          <span>KP Tenancy Escrow Standards</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-navy-950">
          Refund & Escrow Cancellation Policy
        </h1>
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
          Effective Date: November 24, 2026 | Bounded to Peshawar Municipal Area, KP
        </p>
      </header>

      {/* Key Guarantees Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
          <div className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
            <CheckIcon className="w-4 h-4 text-emerald-600" />
            <span>100% Escrow Return</span>
          </div>
          <p className="text-xs text-emerald-800">
            Full refund of security deposit if property fails physical inspection audit.
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
          <div className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
            <ScaleIcon className="w-4 h-4 text-navy-700" />
            <span>3-5 Day Settlement</span>
          </div>
          <p className="text-xs text-navy-700">
            Instant Raast or direct IBAN bank transfers with zero platform handling deductions.
          </p>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
          <div className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
            <ShieldCheckIcon className="w-4 h-4 text-amber-600" />
            <span>Dispute Mediation</span>
          </div>
          <p className="text-xs text-amber-800">
            7-day arbitration window compliant with KP Restriction of Rented Buildings Act.
          </p>
        </div>
      </div>

      {/* Section 1: Escrow Security Deposits */}
      <section className="space-y-3 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          1. Security Deposits & Escrow Hold Protection
        </h2>
        <p>
          Peshawar Rentals holds tenant security deposits in segregated escrow trust accounts.
          Unlike traditional roadside brokers who demand non-refundable cash advances, your escrow
          deposit is fully protected until physical possession of the rented property is officially
          handed over.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
          <li>
            <strong>Pre-Move-In Landlord Cancellation:</strong> If a landlord cancels a confirmed
            booking or fails to hand over keys on the agreed start date, 100% of the deposit and any
            advance rent is refunded to the tenant within 3 business days.
          </li>
          <li>
            <strong>Material Property Discrepancy:</strong> If upon physical arrival the property
            deviates substantially from the verified listing (e.g. missing electricity meters,
            non-functional plumbing, or misstated bedroom counts), the tenant may reject the lease
            within 24 hours for a full 100% refund.
          </li>
          <li>
            <strong>Tenant Cancellation Before Signing:</strong> If a tenant voluntarily withdraws a
            booking request prior to signing the digital KP Tenancy Agreement, the escrow hold is
            released back in full.
          </li>
        </ul>
      </section>

      {/* Section 2: End of Tenancy Return */}
      <section className="space-y-3 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          2. End-of-Tenancy Security Deposit Clearance
        </h2>
        <p>
          In accordance with the Khyber Pakhtunkhwa Restriction of Rented Buildings (Security) Act
          2014:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
          <li>
            Upon normal lease conclusion, the landlord has 7 calendar days to conduct an exit
            inspection for documented utility arrears (PESCO electricity, SNGPL gas, municipal
            water) or structural damages beyond normal wear and tear.
          </li>
          <li>
            Any deductions must be substantiated with itemized contractor invoices or unpaid utility
            bills. The remaining balance is immediately cleared and refunded to the tenant.
          </li>
        </ul>
      </section>

      {/* Section 3: Listing Boosts & Subscriptions */}
      <section className="space-y-3 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          3. Landlord Subscriptions & Listing Boost Fees
        </h2>
        <p>
          Listing properties on Peshawar Rentals is 100% free forever for Starter landlords. For
          optional Pro and Agency subscriptions, or featured search boosts:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
          <li>
            <strong>Moderation Rejections:</strong> If a paid property boost cannot be fulfilled
            because the property deed fails title verification or violates geographic geofencing,
            100% of the boost fee is refunded immediately.
          </li>
          <li>
            <strong>Subscription Cancellations:</strong> Paid subscription tiers can be cancelled
            anytime from the Landlord Center. Unused full months are refunded on a pro-rata basis
            upon written request.
          </li>
        </ul>
      </section>

      {/* Section 4: Dispute Resolution & Payout Method */}
      <section className="space-y-3 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          4. Refund Processing Channels & Timelines
        </h2>
        <p>
          All approved refunds are settled exclusively through documented financial channels across
          Pakistan:
        </p>
        <div className="p-4 bg-navy-50 border border-navy-200 rounded-md space-y-2 text-xs">
          <div>
            <strong>Raast Instant Payout:</strong> Settled within 2 to 4 business hours to the
            linked Pakistani mobile number or IBAN.
          </div>
          <div>
            <strong>Direct Inter-Bank Transfer:</strong> 2 to 3 business days depending on the
            recipient commercial bank (e.g. Bank of Khyber, HBL, Meezan).
          </div>
          <div>
            <strong>Zero Processing Deductions:</strong> Peshawar Rentals charges PKR 0 in
            cancellation handling fees for verified claims.
          </div>
        </div>
      </section>

      {/* Section 5: Dispute Escalation */}
      <section className="space-y-3 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          5. Dispute Escalation & Conciliation Desk
        </h2>
        <p>
          If a landlord and tenant disagree over deposit deductions or cancellation terms, either
          party may trigger an escrow dispute freeze through our portal. Our Peshawar Conciliation
          Desk will review the digital lease agreement, timestamped photo evidence, and meter
          readings to issue an enforceable resolution within 5 working days.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            href="/disputes"
            className="px-4 py-2.5 bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs rounded-md shadow-xs transition"
          >
            File an Escrow Dispute →
          </Link>
          <Link
            href="/contact"
            className="px-4 py-2.5 bg-peshawar-50 hover:bg-peshawar-100 text-peshawar-800 font-bold text-xs rounded-md border border-peshawar-200 transition"
          >
            Contact Mediation Support
          </Link>
        </div>
      </section>
    </main>
  );
}
