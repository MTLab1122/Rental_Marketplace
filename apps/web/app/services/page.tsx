'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  StudentIcon,
  FamilyIcon,
  CheckIcon,
  ScaleIcon,
  HouseIcon,
} from '../../components/Icons';

export default function ServicesPage() {
  const servicesList = [
    {
      id: 'student-housing',
      badge: 'Academic Accommodations',
      title: 'Student Housing & Hostel Accreditation',
      description:
        'Curated accommodations engineered specifically for students of University of Peshawar, UET, Khyber Medical College, Agriculture University, and CECOS.',
      icon: <StudentIcon className="w-6 h-6 text-emerald-600" />,
      features: [
        'Walking-distance cluster mapping (UOP, KMC, UET, IM|Sciences)',
        'Independent solar inverter & generator power guarantee',
        '3-time hygienic meal & mess audits with resident reviews',
        'Strict biometric entrance & verified warden contact',
      ],
      linkText: 'Explore Student Hostels',
      linkHref: '/students',
    },
    {
      id: 'family-rentals',
      badge: 'Residential Homes',
      title: 'Family Houses & Independent Portions',
      description:
        'Peaceful family residences across Hayatabad Phases 1-7, University Town, Warsak Road, Cantt, and Regi Model Town with strictly zero bachelor presence.',
      icon: <FamilyIcon className="w-6 h-6 text-blue-600" />,
      features: [
        'Dedicated Wapda electricity meter or sub-meter verification',
        'Continuous tube-well & overhead water tank inspection',
        'Covered car porch & secure gated community streets',
        'Police registration support & legally vetted KP tenancy contracts',
      ],
      linkText: 'Browse Family Portions',
      linkHref: '/families',
    },
    {
      id: 'landlord-services',
      badge: 'Property Owners',
      title: 'Landlord Direct Listing (0% Brokerage)',
      description:
        'Eliminate property dealers taking 1 month rent broker fees. Connect directly with verified doctors, engineers, university professors, and pre-screened students.',
      icon: <ShieldCheckIcon className="w-6 h-6 text-amber-600" />,
      features: [
        'List up to 2 properties 100% free forever',
        'Verified Landlord Shield badge with NADRA CNIC clearance',
        'Direct inquiry management with safe WhatsApp reveal',
        'Pro listing boosts and priority search indexing',
      ],
      linkText: 'Post Property for Free',
      linkHref: '/for-landlords',
    },
    {
      id: 'legal-agreements',
      badge: 'Legal & Compliance',
      title: 'KP Tenancy Act Digital Leases',
      description:
        'Legally binding digital tenancy agreements designed according to Khyber Pakhtunkhwa rental regulations, protecting both owner and tenant.',
      icon: <ScaleIcon className="w-6 h-6 text-peshawar-700" />,
      features: [
        'Compliant with KP Tenancy & Urban Rent Laws',
        'Digital signature audit trail with timestamp & IP recording',
        'Police verification certificate generation assistance',
        'Clear terms on notice periods, rent revisions, and deposit return',
      ],
      linkText: 'Learn Legal Standards',
      linkHref: '/pricing',
    },
    {
      id: 'escrow-protection',
      badge: 'Financial Security',
      title: 'Escrow Security Deposit Protection',
      description:
        'Prevent deposit disputes at the end of tenancy. Security deposits and advance rents are tracked in a transparent escrow ledger until mutual handover.',
      icon: <ShieldCheckIcon className="w-6 h-6 text-emerald-700" />,
      features: [
        'Pakistani payment rails: JazzCash, EasyPaisa, Direct IBAN transfer',
        'Official digital tax receipts & KPRA-compliant invoices',
        'Instant digital ledger tracking all monthly rent payments',
        'Dispute mediation desk with 48-hour resolution turnaround',
      ],
      linkText: 'View Escrow Policies',
      linkHref: '/pricing',
    },
    {
      id: 'hostel-agency',
      badge: 'Commercial Enterprise',
      title: 'Private Hostel & Agency Management Suite',
      description:
        'Full property management platform for private hostel operators and multi-unit landlords managing 10 to 50+ rooms in Peshawar.',
      icon: <HouseIcon className="w-6 h-6 text-navy-800" />,
      features: [
        'Bulk CSV listing import & multi-room allocation engine',
        'Student occupancy tracking & automated rent reminder SMS',
        'Locality sponsorship & featured placement discounts',
        'Multi-agent team seats with dedicated Peshawar account manager',
      ],
      linkText: 'Explore Agency Suite',
      linkHref: '/pricing',
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-peshawar-600/20 text-peshawar-800 text-xs font-bold uppercase tracking-wider border border-peshawar-200">
          <ShieldCheckIcon className="w-4 h-4 text-peshawar-600" />
          <span>Full-Spectrum Peshawar Rental Solutions</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-navy-950 tracking-tight">
          Comprehensive Rental Services for Peshawar
        </h1>
        <p className="text-base sm:text-lg text-navy-600 leading-relaxed">
          From accredited student hostels near your campus to verified family portions in gated
          sectors and legal tenancy leases, we provide complete rental protection.
        </p>
      </section>

      {/* 2. Services Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {servicesList.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-xl p-8 border border-navy-100 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center">
                  {service.icon}
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-peshawar-700 bg-peshawar-50 px-2.5 py-1 rounded-md border border-peshawar-100">
                  {service.badge}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-navy-950">{service.title}</h2>
                <p className="text-xs sm:text-sm text-navy-600 mt-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-2 border-t border-navy-50 space-y-2">
                {service.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-navy-700">
                    <CheckIcon className="w-4 h-4 text-peshawar-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={service.linkHref}
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-lg bg-navy-50 hover:bg-peshawar-600 hover:text-white text-navy-900 font-bold text-xs transition border border-navy-200 hover:border-peshawar-600"
            >
              {service.linkText} →
            </Link>
          </div>
        ))}
      </section>

      {/* 3. Municipal Trust Guarantee Banner */}
      <section className="rounded-2xl bg-gradient-to-r from-navy-950 to-peshawar-950 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-navy-800">
        <div className="space-y-3 max-w-2xl">
          <span className="text-xs font-black text-peshawar-400 uppercase tracking-wider">
            Official Municipal Standards
          </span>
          <h3 className="text-2xl sm:text-3xl font-black">
            Are You a Peshawar Landlord or Hostel Operator?
          </h3>
          <p className="text-sm text-navy-200 leading-relaxed">
            Get your property certified with our on-site verification team. Landlords with verified
            credentials receive 3x faster tenant inquiries and digital lease automation at 0%
            brokerage.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            href="/for-landlords"
            className="px-6 py-3 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-sm rounded-lg shadow-md transition text-center"
          >
            List Property (Free)
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-lg border border-white/20 transition text-center"
          >
            Speak to Verification Desk
          </Link>
        </div>
      </section>
    </main>
  );
}
