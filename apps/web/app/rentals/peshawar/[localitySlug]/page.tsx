import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PESHAWAR_LOCALITIES } from '../../../../lib/seo-data';
import { getProperties } from '../../../../lib/api';
import { constructMetadata, buildLocalityTitle } from '../../../../lib/seo';
import {
  generateBreadcrumbSchema,
  generateLocalityItemListSchema,
  generateFaqSchema,
} from '../../../../lib/structured-data';
import JsonLd from '../../../../components/JsonLd';
import PropertyCard from '../../../../components/PropertyCard';
import EmptyState from '../../../../components/EmptyState';
import { PropertySummaryDto } from '@rental-peshawar/shared-types';

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
    title: buildLocalityTitle(locality.name),
    description: `Browse verified houses, apartments, student hostels, and family portions for rent in ${locality.name}, Peshawar. Verified landlords, transparent rent rates, and direct contact.`,
    canonical: `/rentals/peshawar/${locality.slug}`,
    keywords: [
      `Rent in ${locality.name}`,
      `${locality.name} flats for rent`,
      `${locality.name} hostels`,
      `${locality.name} houses Peshawar`,
      `property for rent in ${locality.name}`,
    ],
  });
}

export default async function LocalityHubPage({ params }: PageProps) {
  const { localitySlug } = await params;
  const locality = PESHAWAR_LOCALITIES.find(
    (l) => l.slug.toLowerCase() === localitySlug.toLowerCase(),
  );

  if (!locality) {
    notFound();
  }

  let properties: PropertySummaryDto[] = [];
  try {
    const res = await getProperties({ search: locality.name, limit: 24 });
    if (res && Array.isArray(res.items)) {
      properties = res.items;
    }
  } catch {
    // If backend is quiet, properties remain empty
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Peshawar Rentals', url: '/properties' },
    { name: locality.name, url: `/rentals/peshawar/${locality.slug}` },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const itemListSchema = generateLocalityItemListSchema(
    locality.name,
    properties,
    `/rentals/peshawar/${locality.slug}`,
  );
  const faqSchema = generateFaqSchema(locality.faqs);

  const nearbyLocalities = PESHAWAR_LOCALITIES.filter((l) => l.slug !== locality.slug).slice(0, 5);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Structured Data */}
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
        <span className="text-navy-900 font-semibold">{locality.name}</span>
      </nav>

      {/* Locality Header & Intro */}
      <section className="bg-white p-6 sm:p-8 rounded-m3-lg border border-navy-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black tracking-wider uppercase text-peshawar-600">
              Peshawar Neighborhood Hub
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-navy-950 mt-1">
              Houses, Flats & Hostels for Rent in {locality.name}, Peshawar
            </h1>
            {locality.urduName && (
              <p className="text-sm text-navy-400 font-urdu mt-0.5">{locality.urduName}</p>
            )}
          </div>
        </div>

        <p className="text-sm sm:text-base text-navy-700 leading-relaxed max-w-4xl">
          {locality.description}
        </p>

        {/* Transit & Landmark Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-navy-100 text-xs">
          <div className="bg-navy-50 p-3 rounded-m3-md">
            <span className="font-bold text-navy-900 block mb-1">BRT Connectivity</span>
            <p className="text-navy-600">{locality.brtAccess}</p>
          </div>
          <div className="bg-navy-50 p-3 rounded-m3-md">
            <span className="font-bold text-navy-900 block mb-1">Academic Hubs</span>
            <p className="text-navy-600">{locality.universitiesNear.join(', ')}</p>
          </div>
          <div className="bg-navy-50 p-3 rounded-m3-md">
            <span className="font-bold text-navy-900 block mb-1">Healthcare Centers</span>
            <p className="text-navy-600">{locality.hospitalsNear.join(', ')}</p>
          </div>
        </div>

        {/* Filter Shortcuts */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={`/rentals/peshawar/${locality.slug}`}
            className="px-3.5 py-1.5 rounded-m3-sm bg-peshawar-600 text-white text-xs font-bold shadow-xs"
          >
            All Listings ({properties.length})
          </Link>
          <Link
            href={`/rentals/peshawar/${locality.slug}/students`}
            className="px-3.5 py-1.5 rounded-m3-sm bg-navy-100 hover:bg-navy-200 text-navy-800 text-xs font-semibold transition"
          >
            Student Hostels & Rooms
          </Link>
          <Link
            href={`/rentals/peshawar/${locality.slug}/families`}
            className="px-3.5 py-1.5 rounded-m3-sm bg-navy-100 hover:bg-navy-200 text-navy-800 text-xs font-semibold transition"
          >
            Family Portions & Houses
          </Link>
          <Link
            href={`/areas/${locality.slug}`}
            className="px-3.5 py-1.5 rounded-m3-sm bg-navy-100 hover:bg-navy-200 text-navy-800 text-xs font-semibold transition"
          >
            {locality.name} Living Guide
          </Link>
        </div>
      </section>

      {/* Average Rent Snapshot Table */}
      <section className="bg-white p-6 rounded-m3-lg border border-navy-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900">
            Average Rent Snapshot: {locality.name}
          </h2>
          <span className="text-[11px] font-semibold text-navy-400">Updated November 2026</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-navy-50 rounded-m3-md border border-navy-100 text-center">
            <div className="text-xs text-navy-500 font-medium">Hostel Room</div>
            <div className="text-sm font-black text-navy-900 mt-1">
              {locality.avgRent.hostelRoom}
            </div>
            <span className="text-[10px] text-navy-400">per bed / mo</span>
          </div>
          <div className="p-3 bg-navy-50 rounded-m3-md border border-navy-100 text-center">
            <div className="text-xs text-navy-500 font-medium">1-Bed Flat</div>
            <div className="text-sm font-black text-navy-900 mt-1">{locality.avgRent.flat1Bed}</div>
            <span className="text-[10px] text-navy-400">monthly</span>
          </div>
          <div className="p-3 bg-navy-50 rounded-m3-md border border-navy-100 text-center">
            <div className="text-xs text-navy-500 font-medium">2-Bed Flat</div>
            <div className="text-sm font-black text-navy-900 mt-1">{locality.avgRent.flat2Bed}</div>
            <span className="text-[10px] text-navy-400">monthly</span>
          </div>
          <div className="p-3 bg-navy-50 rounded-m3-md border border-navy-100 text-center">
            <div className="text-xs text-navy-500 font-medium">Family Portion</div>
            <div className="text-sm font-black text-navy-900 mt-1">
              {locality.avgRent.familyPortion}
            </div>
            <span className="text-[10px] text-navy-400">monthly</span>
          </div>
          <div className="p-3 bg-navy-50 rounded-m3-md border border-navy-100 text-center col-span-2 sm:col-span-1">
            <div className="text-xs text-navy-500 font-medium">Full House</div>
            <div className="text-sm font-black text-navy-900 mt-1">
              {locality.avgRent.fullHouse}
            </div>
            <span className="text-[10px] text-navy-400">monthly</span>
          </div>
        </div>
      </section>

      {/* Listing Inventory */}
      <section aria-labelledby="listings-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="listings-heading" className="text-xl font-bold text-navy-900">
            Available Rentals in {locality.name}
          </h2>
          <span className="text-xs text-navy-500">
            {properties.length} verified {properties.length === 1 ? 'listing' : 'listings'}
          </span>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-m3-lg border border-navy-100 p-8">
            <EmptyState
              icon="home"
              title={`No Active Listings in ${locality.name} Right Now`}
              description={`New rentals are added daily. Explore nearby areas or set an alert for ${locality.name}.`}
              actionText="View All Peshawar Listings"
              actionHref="/properties"
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

      {/* Locality FAQs */}
      <section
        aria-labelledby="faqs-heading"
        className="bg-white p-6 sm:p-8 rounded-m3-lg border border-navy-100 shadow-sm space-y-4"
      >
        <h2 id="faqs-heading" className="text-xl font-bold text-navy-900">
          Frequently Asked Questions About Renting in {locality.name}
        </h2>
        <div className="divide-y divide-navy-100">
          {locality.faqs.map((faq, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
              <h3 className="text-sm font-bold text-navy-900">{faq.question}</h3>
              <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Internal Linking: Nearby Localities */}
      <section className="bg-navy-50 p-6 rounded-m3-lg border border-navy-100 space-y-3">
        <h3 className="text-sm font-bold text-navy-900">
          Explore Other Popular Rental Sectors in Peshawar
        </h3>
        <div className="flex flex-wrap gap-2">
          {nearbyLocalities.map((loc) => (
            <Link
              key={loc.slug}
              href={`/rentals/peshawar/${loc.slug}`}
              className="px-3 py-1.5 bg-white hover:bg-navy-100 text-navy-700 rounded-m3-sm text-xs font-semibold border border-navy-200 transition"
            >
              Rent in {loc.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
