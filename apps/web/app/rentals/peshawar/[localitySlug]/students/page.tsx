import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PESHAWAR_LOCALITIES } from '../../../../../lib/seo-data';
import { getProperties } from '../../../../../lib/api';
import { constructMetadata, buildStudentCategoryTitle } from '../../../../../lib/seo';
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
    title: buildStudentCategoryTitle(locality.name),
    description: `Find student hostels, shared rooms, and private rooms for rent in ${locality.name}, Peshawar. Near ${locality.universitiesNear.join(', ')}. Verified mess, high-speed Wi-Fi, and 24/7 power backup.`,
    canonical: `/rentals/peshawar/${locality.slug}/students`,
    keywords: [
      `student hostels in ${locality.name}`,
      `${locality.name} student rooms`,
      `hostels near ${locality.universitiesNear[0] || 'Peshawar universities'}`,
      `girls hostel ${locality.name}`,
      `boys hostel ${locality.name}`,
    ],
  });
}

export default async function StudentCategoryPage({ params }: PageProps) {
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
      tenantType: TenantType.STUDENT,
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
    { name: 'Student Hostels & Rooms', url: `/rentals/peshawar/${locality.slug}/students` },
  ];

  const studentFaqs = [
    {
      question: `Are meals and Wi-Fi included in student hostels in ${locality.name}?`,
      answer: `Yes, standard student hostels in ${locality.name} include high-speed Wi-Fi and 2 daily meals (breakfast and dinner) in the monthly rent package.`,
    },
    {
      question: `How far is ${locality.name} from major universities?`,
      answer: `${locality.name} provides direct or BRT transit access to ${locality.universitiesNear.join(', ')}.`,
    },
    {
      question: `What documents are required to secure a student hostel bed in ${locality.name}?`,
      answer: `Students must provide a valid CNIC/B-Form copy, university student ID card or admission letter, and parent/guardian contact details for police verification.`,
    },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const itemListSchema = generateLocalityItemListSchema(
    `${locality.name} Student Hostels`,
    properties,
    `/rentals/peshawar/${locality.slug}/students`,
  );
  const faqSchema = generateFaqSchema(studentFaqs);

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
        <span className="text-navy-900 font-semibold">Student Hostels & Rooms</span>
      </nav>

      {/* Hero & Academic Anchor */}
      <section className="bg-white p-6 sm:p-8 rounded-m3-lg border border-navy-100 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-black tracking-wider uppercase text-student-text bg-student-bg px-2.5 py-1 rounded-m3-sm border border-student-border inline-block">
            Student Housing Hub
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-navy-950 mt-2">
            Student Hostels & Rooms for Rent in {locality.name}, Peshawar
          </h1>
        </div>

        <p className="text-sm sm:text-base text-navy-700 leading-relaxed max-w-4xl">
          Browse verified boys and girls student hostels, shared dormitories, and private study
          rooms in {locality.name}. Conveniently located near {locality.universitiesNear.join(', ')}{' '}
          with reliable study environments, power backup, and mess facilities.
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
            className="px-3.5 py-1.5 rounded-m3-sm bg-peshawar-600 text-white text-xs font-bold shadow-xs"
          >
            Student Hostels ({properties.length})
          </Link>
          <Link
            href={`/rentals/peshawar/${locality.slug}/families`}
            className="px-3.5 py-1.5 rounded-m3-sm bg-navy-100 hover:bg-navy-200 text-navy-800 text-xs font-semibold transition"
          >
            Family Portions & Houses
          </Link>
        </div>
      </section>

      {/* Listing Grid */}
      <section aria-labelledby="listings-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="listings-heading" className="text-xl font-bold text-navy-900">
            Active Student Listings in {locality.name}
          </h2>
          <span className="text-xs text-navy-500">
            {properties.length} verified {properties.length === 1 ? 'hostel' : 'hostels'}
          </span>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-m3-lg border border-navy-100 p-8">
            <EmptyState
              icon=""
              title={`No Student Listings in ${locality.name} Right Now`}
              description={`Explore student hostels in neighboring sectors or check all available properties in ${locality.name}.`}
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
        aria-labelledby="student-faqs"
        className="bg-white p-6 sm:p-8 rounded-m3-lg border border-navy-100 shadow-sm space-y-4"
      >
        <h2 id="student-faqs" className="text-xl font-bold text-navy-900">
          Student Living FAQs: {locality.name}
        </h2>
        <div className="divide-y divide-navy-100">
          {studentFaqs.map((faq, idx) => (
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
