'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  StudentIcon,
  FamilyIcon,
  MapPinIcon,
  CheckIcon,
  ScaleIcon,
} from '../../components/Icons';

export default function AboutPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. Hero Section */}
      <section className="relative rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-peshawar-950 text-white p-8 sm:p-14 lg:p-16 overflow-hidden shadow-xl border border-navy-800">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-peshawar-600/30 border border-peshawar-500/50 text-peshawar-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <ShieldCheckIcon className="w-4 h-4 text-peshawar-400" />
            <span>Khyber Pakhtunkhwa Verified Housing Authority</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            Transforming Rental Housing in Peshawar
          </h1>

          <p className="text-base sm:text-lg text-navy-200 leading-relaxed">
            Peshawar Rentals is the dedicated, verified municipal rental marketplace engineered
            exclusively for the capital city of Khyber Pakhtunkhwa. We eliminate corrupt dealer
            brokerages, enforce strict single-eligibility living, and deliver 100% audited homes
            with legal peace of mind.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/properties"
              className="px-6 py-3 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-sm rounded-lg shadow-md transition"
            >
              Browse Verified Homes
            </Link>
            <Link
              href="/for-landlords"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-lg border border-white/20 transition backdrop-blur-sm"
            >
              Landlord Partner Program
            </Link>
          </div>
        </div>

        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0D7A5F_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </section>

      {/* 2. Key Stats Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-2xs text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-black text-peshawar-600">0%</div>
          <div className="text-sm font-bold text-navy-900">Dealer Brokerage</div>
          <p className="text-xs text-navy-500">Save 1 month rent on every lease</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-2xs text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-black text-navy-900">100%</div>
          <div className="text-sm font-bold text-navy-900">NADRA Verified</div>
          <p className="text-xs text-navy-500">Landlords & tenants biometric checked</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-2xs text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-black text-peshawar-600">15</div>
          <div className="text-sm font-bold text-navy-900">Peshawar Sectors</div>
          <p className="text-xs text-navy-500">From Hayatabad to Warsak Road</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-2xs text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-black text-navy-900">&lt; 2 Hrs</div>
          <div className="text-sm font-bold text-navy-900">Verification SLA</div>
          <p className="text-xs text-navy-500">Fast physical on-site audit</p>
        </div>
      </section>

      {/* 3. The 4 Non-Negotiable Pillars */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black text-peshawar-700 tracking-wider uppercase">
            Built on Integrity
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-navy-950">
            Our 4 Core Governance Standards
          </h2>
          <p className="text-sm text-navy-600">
            Unlike generic classified portals full of outdated, duplicate, or fake listings, every
            action on Peshawar Rentals is regulated by strict municipal rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pillar 1 */}
          <div className="bg-white p-8 rounded-xl border border-navy-100 shadow-sm space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-peshawar-700 flex items-center justify-center font-black text-xl">
              <MapPinIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-navy-950">
              1. Strict PostGIS Municipal Boundary Fencing
            </h3>
            <p className="text-sm text-navy-600 leading-relaxed">
              We exclusively serve the Peshawar municipal limits (33.90°N–34.15°N, 71.35°E–71.70°E).
              Every listing submission is verified against our GIS spatial polygon. Out-of-bounds
              properties from other cities are rejected automatically at the API layer.
            </p>
            <div className="text-xs font-mono text-peshawar-700 bg-emerald-50/50 p-2 rounded border border-emerald-100">
              Coverage: Hayatabad • Town • Cantt • Warsak • DHA • Regi
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-8 rounded-xl border border-navy-100 shadow-sm space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-navy-900 flex items-center justify-center font-black text-xl">
              <ShieldCheckIcon className="w-6 h-6 text-navy-700" />
            </div>
            <h3 className="text-xl font-bold text-navy-950">
              2. Strict Single-Eligibility Living Policy
            </h3>
            <p className="text-sm text-navy-600 leading-relaxed">
              We protect family peace and student dignity. Student hostel rooms and bachelor flats
              are 100% separated from family residences. There is zero cross-visibility or mixed
              tenancies without explicit mutual agreement, safeguarding family privacy in Peshawar.
            </p>
            <div className="text-xs font-semibold text-navy-700 bg-blue-50/50 p-2 rounded border border-blue-100 flex items-center gap-2">
              <StudentIcon className="w-4 h-4 text-emerald-600" />
              <span>Students Only</span>
              <span className="text-navy-300">|</span>
              <FamilyIcon className="w-4 h-4 text-blue-600" />
              <span>Families Only</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-8 rounded-xl border border-navy-100 shadow-sm space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xl">
              <span className="text-sm font-black text-amber-800">0%</span>
            </div>
            <h3 className="text-xl font-bold text-navy-950">
              3. Direct Landlord Connections (0% Brokerage)
            </h3>
            <p className="text-sm text-navy-600 leading-relaxed">
              Traditional Peshawar property dealers charge 1 month rent from the tenant and 1 month
              rent from the landlord. On Peshawar Rentals, tenants pay 0 PKR broker fees. Inquiries
              connect directly with verified owners, saving up to 80,000 PKR on a single lease.
            </p>
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-50/50 p-2 rounded border border-emerald-100 flex items-center gap-1.5">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>Verified WhatsApp contact revealed upon inquiry approval</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white p-8 rounded-xl border border-navy-100 shadow-sm space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-peshawar-50 text-peshawar-700 flex items-center justify-center font-black text-xl">
              <ScaleIcon className="w-6 h-6 text-peshawar-700" />
            </div>
            <h3 className="text-xl font-bold text-navy-950">
              4. KP Tenancy Act Enforceable Leases & Escrow
            </h3>
            <p className="text-sm text-navy-600 leading-relaxed">
              Rental disputes in Khyber Pakhtunkhwa are preventable with proper documentation. We
              provide legally vetted digital tenancy agreements compliant with the KP Tenancy Act,
              police verification paperwork support, and secure escrow holding for security
              deposits.
            </p>
            <div className="text-xs font-semibold text-navy-700 bg-navy-50/50 p-2 rounded border border-navy-100 flex items-center gap-1.5">
              <CheckIcon className="w-3.5 h-3.5 text-navy-700" />
              <span>Enforceable digital signature audit log & NADRA CNIC binding</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Problem We Solved */}
      <section className="bg-navy-900 text-white rounded-2xl p-8 sm:p-12 space-y-6">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-black text-peshawar-400 uppercase tracking-wider">
            Our Foundation Story
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            Why Peshawar Needed Its Own Dedicated Rental Portal
          </h2>
          <p className="text-sm sm:text-base text-navy-200 leading-relaxed">
            Finding a rental property in Peshawar used to mean wandering through University Town or
            Hayatabad, dealing with unregulated street brokers who demanded exorbitant commissions
            for properties that were already rented or lacked basic electricity meters.
          </p>
          <p className="text-sm sm:text-base text-navy-200 leading-relaxed">
            Students arriving at the University of Peshawar, UET, or Khyber Medical College faced
            substandard hostels with unverified food quality, surprise loadshedding without solar
            backup, and arbitrary price spikes.
          </p>
          <p className="text-sm sm:text-base text-navy-200 leading-relaxed">
            We built Peshawar Rentals to restore trust, dignity, and transparency to our city.
            Today, every room, portion, and house listed here is checked, coordinates verified, and
            backed by real local support right here in Peshawar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-navy-800 text-xs">
          <div className="flex items-center gap-2">
            <CheckIcon className="w-5 h-5 text-peshawar-400 shrink-0" />
            <span>Independent Wapda & Sub-Meter Audits</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon className="w-5 h-5 text-peshawar-400 shrink-0" />
            <span>Clean Tube-well & Municipal Water Check</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon className="w-5 h-5 text-peshawar-400 shrink-0" />
            <span>Transparent Solar / UPS Backup Disclosures</span>
          </div>
        </div>
      </section>

      {/* 5. Contact / Support Office */}
      <section className="bg-white rounded-xl p-8 border border-navy-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-black text-navy-950">Visit Our Peshawar Operations Center</h3>
          <p className="text-sm text-navy-600 max-w-xl">
            Have questions or need assistance verifying a property deed or hostel accreditation? Our
            local concierge desk is open 6 days a week on University Road and in Hayatabad.
          </p>
        </div>
        <div className="flex gap-4 shrink-0">
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-navy-900 hover:bg-navy-950 text-white font-bold text-sm rounded-lg transition"
          >
            Contact Desk
          </Link>
          <Link
            href="/services"
            className="px-5 py-2.5 bg-peshawar-50 hover:bg-peshawar-100 text-peshawar-800 font-bold text-sm rounded-lg border border-peshawar-200 transition"
          >
            View Services
          </Link>
        </div>
      </section>
    </main>
  );
}
