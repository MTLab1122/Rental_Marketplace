import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { EDITORIAL_GUIDES } from '../../lib/seo-data';
import { constructMetadata } from '../../lib/seo';
import { generateBreadcrumbSchema } from '../../lib/structured-data';
import JsonLd from '../../components/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Peshawar Rental Guides & Tenant Advisory | RentPeshawar',
  description:
    'Comprehensive rental guides for Peshawar tenants and landlords. Read about BRT routes, student hostels, legal agreements, utility costs, and neighborhood safety.',
  canonical: '/guides',
  keywords: [
    'Peshawar rental guides',
    'tenant advisory Peshawar',
    'student hostel guide Peshawar',
    'KP rent agreement rules',
    'Hayatabad vs Warsak Road',
  ],
});

export default function GuidesIndexPage() {
  const categories = ['Students', 'Families', 'Legal & Norms', 'Transit & Living'] as const;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Peshawar Rental Guides', url: '/guides' },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <JsonLd data={breadcrumbSchema} />

      <nav aria-label="Breadcrumb" className="text-xs text-navy-500 flex items-center gap-2">
        <Link href="/" className="hover:text-peshawar-600 transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold">Rental Guides</span>
      </nav>

      <section className="bg-white p-6 sm:p-8 rounded-m3-lg border border-navy-100 shadow-sm space-y-3">
        <span className="text-xs font-black tracking-wider uppercase text-peshawar-600">
          Knowledge Base & Local Research
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-navy-950">
          Peshawar Rental Guides & Living Directory
        </h1>
        <p className="text-sm sm:text-base text-navy-700 leading-relaxed max-w-3xl">
          Verified, locally researched guides to help students, families, and professionals navigate
          the Peshawar rental marketplace with complete confidence.
        </p>
      </section>

      {categories.map((category) => {
        const guides = EDITORIAL_GUIDES.filter((g) => g.category === category);
        if (guides.length === 0) return null;

        return (
          <section key={category} className="space-y-4">
            <h2 className="text-xl font-bold text-navy-900 border-b border-navy-100 pb-2 flex items-center gap-2">
              <span></span> {category} Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="bg-white p-5 rounded-m3-md border border-navy-100 hover:border-peshawar-300 hover:shadow-md transition flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-peshawar-600">
                      {guide.readingTimeMinutes} min read • Updated Nov 2026
                    </span>
                    <h3 className="text-base font-bold text-navy-900 group-hover:text-peshawar-700 transition mt-1">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-navy-600 line-clamp-2 mt-2 leading-relaxed">
                      {guide.directAnswer}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-peshawar-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read Complete Guide →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
