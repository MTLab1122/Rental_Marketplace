import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { constructMetadata } from '../../lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Cookie Policy | Peshawar Rentals Verified Portal',
  description:
    'Learn how Peshawar Rentals uses essential and analytical cookies to safeguard sessions, manage locality filters, and respect user privacy.',
  canonical: '/cookie-policy',
});

export default function CookiePolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-navy-900">
      <nav aria-label="Breadcrumb" className="text-xs text-navy-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold">Cookie Policy</span>
      </nav>

      <header className="border-b border-navy-200 pb-6 space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-navy-950">
          Cookie & Local Storage Policy
        </h1>
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
          Effective Date: November 20, 2026 | Peshawar Rentals Platform
        </p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          1. What Are Cookies?
        </h2>
        <p>
          Cookies and local storage tokens are small text records stored on your browser or device
          when you browse our marketplace. They allow our platform to keep your session
          authenticated, remember your student or family mode preference, and prevent automated spam
          bots from disrupting our search infrastructure.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          2. Categories of Cookies We Use
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-navy-50 border border-navy-200 rounded-md">
            <h3 className="font-bold text-navy-900">A. Strictly Necessary Cookies (Essential)</h3>
            <p className="text-xs text-navy-600 mt-1">
              Required for basic site navigation, CSRF protection, and JWT token rotation. These
              cannot be disabled as our verified marketplace security relies on them.
            </p>
          </div>

          <div className="p-4 bg-navy-50 border border-navy-200 rounded-md">
            <h3 className="font-bold text-navy-900">B. Functional & Preference Cookies</h3>
            <p className="text-xs text-navy-600 mt-1">
              Used to remember your locality filter choices (e.g. Hayatabad vs Cantt), selected
              bedroom counts, and recent searches so you do not have to reconfigure filters on every
              page load.
            </p>
          </div>

          <div className="p-4 bg-navy-50 border border-navy-200 rounded-md">
            <h3 className="font-bold text-navy-900">C. Performance & Diagnostic Telemetry</h3>
            <p className="text-xs text-navy-600 mt-1">
              Aggregated, privacy-preserving measurements that help our SRE and QA team monitor page
              response times, PostGIS query latencies, and Core Web Vitals across low-bandwidth
              3G/4G connections in KP.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-navy-800">
        <h2 className="text-lg font-bold text-navy-950 border-l-4 border-emerald-600 pl-3">
          3. Managing or Withdrawing Your Consent
        </h2>
        <p>
          You have full control over your cookie preferences at all times. You can open our consent
          manager and adjust your choices by using the button below, the link in the site footer, or
          by clearing your browser&apos;s site storage for rentpeshawar.pk.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/privacy-policy"
            className="px-4 py-2 bg-navy-50 hover:bg-navy-100 text-navy-800 border border-navy-200 rounded-md font-bold text-xs transition"
          >
            Review Privacy Policy →
          </Link>
          <Link
            href="/data-deletion"
            className="px-4 py-2 bg-navy-50 hover:bg-navy-100 text-navy-800 border border-navy-200 rounded-md font-bold text-xs transition"
          >
            Data Deletion Requests →
          </Link>
        </div>
      </section>
    </main>
  );
}
