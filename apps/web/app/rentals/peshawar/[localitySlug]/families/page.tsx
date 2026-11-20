import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PESHAWAR_LOCALITIES } from '../../../../../lib/seo-data';
import { getProperties } from '../../../../../lib/api';
import { constructMetadata, buildFamilyCategoryTitle } from '../../../../../lib/seo';
import {
  generateBreadcrumbSchema,
  generateLocalityItemListSchema,
  generateFaqSchema,
} from '../../../../../lib/structured-data';
import JsonLd from '../../../../../components/JsonLd';
import PropertyCard from '../../../../../components/PropertyCard';
import EmptyState from '../../../../../components/EmptyState';
import { PropertySummaryDto, TenantType } from '@rental-peshawar/shared-types';

interface PageProps {
  params: Promise<{ localitySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { localitySlug } = await params;
  const locality = PESHAWAR_LOCALITIES.find(
    (l) => l.slug.toLowerCase() === localitySlug.toLowerCase(),
  );

  if (!locality) {
    return constructMetadata({
      title: 'Locality Not Found | RentPeshawar',
      noIndex: true,
    });
  }

  return constructMetadata({
    title: buildFamilyCategoryTitle(locality.name),
    description: `Rent family houses, independent upper & lower portions, and secure flats in ${locality.name}, Peshawar. Peaceful residential neighborhoods near top schools, parks, and hospitals.`,
    canonical: `/rentals/peshawar/${locality.slug}/families`,
    keywords: [
      `family portion for rent in ${locality.name}`,
      `house for rent in ${locality.name}`,
      `upper portion ${locality.name} Peshawar`,
      `lower portion ${locality.name} Peshawar`,
      `family flat ${locality.name}`,
    ],
  });
}

export default async function FamilyCategoryPage({ params }: PageProps) {
  const { localitySlug } = await params;
  const locality = PESHAWAR_LOCALITIES.find(
    (l) => l.slug.toLowerCase() === localitySlug.toLowerCase(),
  );

  if (!locality) {
    notFound();
  }

  let properties: PropertySummaryDto[] = [];
  try {
    const res = await getProperties({
      search: locality.name,
      tenantType: TenantType.FAMILY,
      limit: 24,
    });
    if (res && Array.isArray(res.items)) {
      properties = res.items;
    }
  } catch {
    // Quiet fallback
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Peshawar Rentals', url: '/properties' },
    { name: locality.name, url: `/rentals/peshawar/${locality.slug}` },
    { name: 'Family Houses & Portions', url: `/rentals/peshawar/${locality.slug}/families` },
  ];

  const familyFaqs = [
    {
      question: `Are utilities separate for upper and lower family portions in ${locality.name}?`,
      answer: `Yes, the majority of family portions in ${locality.name} feature independent PESCO electricity meters and separate gas connections or calibrated sub-meters.`,
    },
    {
      question: `What security measures are common in ${locality.name} family neighborhoods?`,
      answer: `Most residential blocks have neighborhood security chowkidars, gated street cul-de-sacs at night, and active police patrol coverage.`,
    },
    {
      question: `What is the standard lease term for family houses in Peshawar?`,
      answer: `Family tenancies are typically contracted for 11 months with an option to renew annually under standard 7%–10% escalation terms.`,
    },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const itemListSchema = generateLocalityItemListSchema(
    `${locality.name} Family Houses & Portions`,
    properties,
    `/rentals/peshawar/${locality.slug}/families`,
  );
  const faqSchema = generateFaqSchema(familyFaqs);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      <JsonLd data={faqSchema} />

      {/* Semantic Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-navy-500 flex items-center gap-2 flex-wrap"
      >
        <Link href="/" className="hover:text-peshawar-600 transition">
          Home
        </Link>
        <span>/</span>
        <Link href="/properties" className="hover:text-peshawar-600 transition">
          Peshawar Rentals
        </Link>
        <span>/</span>
        <Link
          href={`/rentals/peshawar/${locality.slug}`}
          className="hover:text-peshawar-600 transition"
        >
          {locality.name}
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold">Family Houses & Portions</span>
      </nav>

      {/* Hero */}
      <section className="bg-white p-6 sm:p-8 rounded-m3-lg border border-navy-100 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-black tracking-wider uppercase text-family-text bg-family-bg px-2.5 py-1 rounded-m3-sm border border-family-border inline-block">
            Family Living Hub
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-navy-950 mt-2">
            Family Houses & Portions for Rent in {locality.name}, Peshawar
          </h1>
        </div>

        <p className="text-sm sm:text-base text-navy-700 leading-relaxed max-w-4xl">
          Discover verified family residences in {locality.name}. Choose from spacious ground
          portions with dedicated car parking and private lawns, upper portions with scenic
          terraces, or full standalone homes in quiet, secure family neighborhoods.
        </p>

        {/* Filter Navigation */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={`/rentals/peshawar/${locality.slug}`}
            className="px-3.5 py-1.5 rounded-m3-sm bg-navy-100 hover:bg-navy-200 text-navy-800 text-xs font-semibold transition"
          >
            All {locality.name} Listings
          </Link>
          <Link
            href={`/rentals/peshawar/${locality.slug}/students`}
            className="px-3.5 py-1.5 rounded-m3-sm bg-navy-100 hover:bg-navy-200 text-navy-800 text-xs font-semibold transition"
          >
            Student Hostels & Rooms
          </Link>
          <Link
            href={`/rentals/peshawar/${locality.slug}/families`}
            className="px-3.5 py-1.5 rounded-m3-sm bg-peshawar-600 text-white text-xs font-bold shadow-xs"
          >
            Family Portions ({properties.length})
          </Link>
        </div>
      </section>

      {/* Listing Grid */}
      <section aria-labelledby="listings-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="listings-heading" className="text-xl font-bold text-navy-900">
            Active Family Listings in {locality.name}
          </h2>
          <span className="text-xs text-navy-500">
            {properties.length} verified {properties.length === 1 ? 'property' : 'properties'}
          </span>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-m3-lg border border-navy-100 p-8">
            <EmptyState
              icon=""
              title={`No Family Listings in ${locality.name} Right Now`}
              description={`Browse all properties in ${locality.name} or set an alert for upcoming family vacancies.`}
              actionText={`View All ${locality.name} Rentals`}
              actionHref={`/rentals/peshawar/${locality.slug}`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* FAQs */}
      <section
        aria-labelledby="family-faqs"
        className="bg-white p-6 sm:p-8 rounded-m3-lg border border-navy-100 shadow-sm space-y-4"
      >
        <h2 id="family-faqs" className="text-xl font-bold text-navy-900">
          Family Living FAQs: {locality.name}
        </h2>
        <div className="divide-y divide-navy-100">
          {familyFaqs.map((faq, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
              <h3 className="text-sm font-bold text-navy-900">{faq.question}</h3>
              <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
