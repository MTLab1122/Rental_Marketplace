import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { constructMetadata } from '../../lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy | Peshawar Rentals Verified Portal',
  description:
    'Comprehensive privacy policy for Peshawar Rentals. Explains how tenant and landlord data, NADRA CNIC verification records, and municipal rental agreements are secured.',
  canonical: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-navy-900">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-navy-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold">Privacy Policy</span>
      </nav>

      <header className="border-b border-navy-200 pb-6 space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-navy-950">Privacy Policy</h1>
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
          Effective Date: November 20, 2026 | Governing Jurisdiction: Peshawar, Khyber Pakhtunkhwa,
          Pakistan
        </p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          1. Scope & Municipal Scope
        </h2>
        <p>
          This Privacy Policy governs the collection, processing, and protection of personal data by
          Peshawar Rentals (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), operating
          exclusively within the defined municipal and administrative boundaries of Peshawar, Khyber
          Pakhtunkhwa (33.90°N–34.15°N, 71.35°E–71.70°E).
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          2. Information We Collect
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Identity & Verification Data:</strong> Full legal name, Computerized National
            Identity Card (CNIC) number, biometric verification timestamps, and institutional
            student affiliation documents (for student-mode accounts).
          </li>
          <li>
            <strong>Property & Locality Records:</strong> Real property title documents, registry
            numbers, utility bill identifiers (PESCO electricity, SNGPL gas), and precise GPS
            coordinates bounded to Peshawar localities.
          </li>
          <li>
            <strong>Communication & Inquiries:</strong> Direct messages, booking requests, dispute
            logs, and review feedback exchanged between verified parties.
          </li>
          <li>
            <strong>Technical Telemetry:</strong> Anonymized IP address, device headers, user-agent,
            and cookie consent preferences.
          </li>
        </ul>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          3. PII Masking and Protection Standards
        </h2>
        <p>
          We adhere to strict zero-knowledge redaction principles. Phone numbers, WhatsApp contacts,
          and CNIC credentials are masked across public listings and search indices. Landlord direct
          communication channels are only revealed to tenants once an inquiry has been officially
          accepted through our verified escrow and booking flow.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          4. Data Storage and Security Controls
        </h2>
        <p>
          All personal data is encrypted in transit via TLS 1.3 and at rest using AES-256
          encryption. Authentication utilizes short-lived JSON Web Tokens (JWT) paired with secure,
          HTTP-only refresh tokens stored in memory. Verification scans are purged from
          public-accessible object storage upon administrative audit completion.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          5. Tenant Rights & Data Portability
        </h2>
        <p>
          Under Khyber Pakhtunkhwa consumer safety guidelines, users maintain the right to inspect,
          correct, export, or request permanent deletion of their profile records, active saved
          searches, and communication histories by contacting our verified support registry at{' '}
          <a
            href="mailto:privacy@rentpeshawar.pk"
            className="text-emerald-700 underline font-semibold"
          >
            privacy@rentpeshawar.pk
          </a>
          .
        </p>
      </section>
    </main>
  );
}
