import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PESHAWAR_LOCALITIES } from '../../../lib/seo-data';
import { constructMetadata } from '../../../lib/seo';
import { generateBreadcrumbSchema, generateFaqSchema } from '../../../lib/structured-data';
import JsonLd from '../../../components/JsonLd';

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
      title: 'Area Guide Not Found | RentPeshawar',
      noIndex: true,
    });
  }

  return constructMetadata({
    title: `${locality.name} Living Guide: Neighborhood, Rents & Transit in Peshawar | RentPeshawar`,
    description: `Complete neighborhood guide to living in ${locality.name}, Peshawar. Details on BRT access, utility stability, local schools, average rents, and tenant verification.`,
    canonical: `/areas/${locality.slug}`,
    keywords: [
      `${locality.name} area guide`,
      `living in ${locality.name} Peshawar`,
      `${locality.name} rent guide`,
      `${locality.name} safety and utilities`,
    ],
  });
}

export default async function AreaGuidePage({ params }: PageProps) {
  const { localitySlug } = await params;
  const locality = PESHAWAR_LOCALITIES.find(
    (l) => l.slug.toLowerCase() === localitySlug.toLowerCase(),
  );

  if (!locality) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Peshawar Area Guides', url: '/properties' },
    { name: `${locality.name} Guide`, url: `/areas/${locality.slug}` },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const faqSchema = generateFaqSchema(locality.faqs);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <JsonLd data={breadcrumbSchema} />
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
        <span className="text-navy-900 font-semibold">Living Guide</span>
      </nav>

      {/* Hero Header */}
      <article className="space-y-6">
        <div>
          <span className="text-xs font-black tracking-wider uppercase text-peshawar-700 bg-peshawar-50 px-3 py-1 rounded-m3-sm border border-peshawar-200 inline-block">
            Peshawar Locality Deep Dive
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-950 mt-3">
            Living in {locality.name}, Peshawar: Neighborhood & Rental Guide
          </h1>
          <p className="text-sm text-navy-500 mt-2">
            Published by RentPeshawar Editorial Research Desk • Updated November 2026
          </p>
        </div>

        {/* Direct Answer / Executive Summary */}
        <div className="bg-peshawar-50 border-l-4 border-peshawar-600 p-5 rounded-r-m3-md space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-peshawar-900">
            Neighborhood Summary
          </div>
          <p className="text-sm text-navy-800 leading-relaxed font-medium">
            {locality.tagline} {locality.description}
          </p>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-m3-md border border-navy-100 space-y-2 shadow-xs">
            <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <span>🚌</span> Public Transit & BRT
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">{locality.brtAccess}</p>
          </div>
          <div className="bg-white p-5 rounded-m3-md border border-navy-100 space-y-2 shadow-xs">
            <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <span>🏛️</span> Prominent Landmarks
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">{locality.landmarks.join(', ')}</p>
          </div>
          <div className="bg-white p-5 rounded-m3-md border border-navy-100 space-y-2 shadow-xs">
            <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <span>🎓</span> Universities & Colleges
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">
              {locality.universitiesNear.join(', ')}
            </p>
          </div>
          <div className="bg-white p-5 rounded-m3-md border border-navy-100 space-y-2 shadow-xs">
            <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <span>🏥</span> Hospitals & Medical Centers
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">
              {locality.hospitalsNear.join(', ')}
            </p>
          </div>
        </div>

        {/* Rental Market Rates */}
        <section
          aria-labelledby="rent-rates"
          className="bg-white p-6 rounded-m3-lg border border-navy-100 shadow-sm space-y-4"
        >
          <h2 id="rent-rates" className="text-lg font-bold text-navy-900">
            Current Rental Price Ranges in {locality.name}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-navy-100 text-navy-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Property Category</th>
                  <th className="py-2.5 px-3">Average Monthly Rent (PKR)</th>
                  <th className="py-2.5 px-3">Typical Target Demographic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                <tr>
                  <td className="py-3 px-3 font-semibold text-navy-900">Hostel Bed / Room</td>
                  <td className="py-3 px-3 text-navy-800 font-bold">
                    {locality.avgRent.hostelRoom}
                  </td>
                  <td className="py-3 px-3 text-navy-600">University students, interns</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-navy-900">1-Bedroom Apartment</td>
                  <td className="py-3 px-3 text-navy-800 font-bold">{locality.avgRent.flat1Bed}</td>
                  <td className="py-3 px-3 text-navy-600">Single executives, young couples</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-navy-900">2-Bedroom Apartment</td>
                  <td className="py-3 px-3 text-navy-800 font-bold">{locality.avgRent.flat2Bed}</td>
                  <td className="py-3 px-3 text-navy-600">Small families, doctors</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-navy-900">Upper/Lower Portion</td>
                  <td className="py-3 px-3 text-navy-800 font-bold">
                    {locality.avgRent.familyPortion}
                  </td>
                  <td className="py-3 px-3 text-navy-600">Medium families seeking lawn/terrace</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-navy-900">Independent House</td>
                  <td className="py-3 px-3 text-navy-800 font-bold">
                    {locality.avgRent.fullHouse}
                  </td>
                  <td className="py-3 px-3 text-navy-600">Large families, executive residences</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Call to Action: Explore Live Listings */}
        <section className="bg-peshawar-950 text-white p-6 sm:p-8 rounded-m3-lg space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Ready to Find a Rental in {locality.name}?</h3>
            <p className="text-xs text-navy-300">
              Browse verified listings with transparent rates and direct landlord contact.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/rentals/peshawar/${locality.slug}`}
              className="px-4 py-2.5 bg-peshawar-500 hover:bg-peshawar-600 text-white rounded-m3-sm text-xs font-bold transition shadow-sm"
            >
              View All {locality.name} Listings
            </Link>
            <Link
              href={`/rentals/peshawar/${locality.slug}/students`}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-m3-sm text-xs font-bold transition border border-white/20"
            >
              Browse Student Hostels
            </Link>
            <Link
              href={`/rentals/peshawar/${locality.slug}/families`}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-m3-sm text-xs font-bold transition border border-white/20"
            >
              Browse Family Portions
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
