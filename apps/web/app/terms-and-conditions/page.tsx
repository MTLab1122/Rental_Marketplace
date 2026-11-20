import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { constructMetadata } from '../../lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Terms and Conditions | Peshawar Rentals Verified Portal',
  description:
    'Legal terms of service and marketplace conditions governing tenants, verified landlords, and property seekers in Peshawar, Khyber Pakhtunkhwa.',
  canonical: '/terms-and-conditions',
});

export default function TermsAndConditionsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-navy-900">
      <nav aria-label="Breadcrumb" className="text-xs text-navy-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold">Terms and Conditions</span>
      </nav>

      <header className="border-b border-navy-200 pb-6 space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-navy-950">
          Terms & Conditions of Service
        </h1>
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
          Last Updated: November 20, 2026 | Peshawar Metropolitan Area
        </p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          1. Agreement to Terms
        </h2>
        <p>
          By accessing or utilizing Peshawar Rentals, you agree to comply with and be legally bound
          by these Terms and Conditions, all applicable local laws of Khyber Pakhtunkhwa, and the
          Pakistan Penal Code provisions regarding tenancy and property declarations.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          2. Non-Negotiable Eligibility Segregation
        </h2>
        <p>Our platform operates under strict, audited categorical boundaries:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Student Accommodations:</strong> Designated solely for active students and
            bachelor occupants. Cross-listing family homes in student categories is strictly
            prohibited.
          </li>
          <li>
            <strong>Family Residential Units:</strong> Reserved exclusively for married couples and
            nuclear or joint families. Bachelor occupancy inquiries on family properties will be
            rejected automatically.
          </li>
        </ul>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          3. Geographic Boundaries
        </h2>
        <p>
          All listings must physically reside within the authorized Peshawar municipal bounding box:
          latitude 33.90°N to 34.15°N and longitude 71.35°E to 71.70°E. Listings positioned outside
          these coordinates are automatically barred from publication.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          4. Zero Advance Fee Rule & Fraud Prevention
        </h2>
        <p>
          No user may request or transfer advance deposits or security fees through unofficial cash,
          EasyPaisa, or JazzCash transfers without an in-person viewing and an official signed
          agreement. Breaches of this rule trigger immediate account termination and reporting to
          the KP Consumer Protection Court and FIA Cybercrime Wing.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          5. Contact Information
        </h2>
        <p>
          Legal inquiries, dispute escalations, or tenancy complaints may be submitted to:
          <br />
          <strong>Legal Counsel & Marketplace Compliance</strong>
          <br />
          Peshawar Rentals Secretariat, University Town, Peshawar, Khyber Pakhtunkhwa
          <br />
          Email:{' '}
          <a
            href="mailto:legal@rentpeshawar.pk"
            className="text-emerald-700 underline font-semibold"
          >
            legal@rentpeshawar.pk
          </a>
        </p>
      </section>
    </main>
  );
}
