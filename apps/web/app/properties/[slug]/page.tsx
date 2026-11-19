import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getPropertyBySlugOrId } from '../../../lib/api';
import { constructMetadata, buildPropertyTitle } from '../../../lib/seo';
import { generatePropertySchema, generateBreadcrumbSchema } from '../../../lib/structured-data';
import JsonLd from '../../../components/JsonLd';
import PropertyDetailClient from '../../../components/PropertyDetailClient';
import EmptyState from '../../../components/EmptyState';
import { PropertySummaryDto } from '@rental-peshawar/shared-types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const property = await getPropertyBySlugOrId(slug);
    if (!property) {
      return constructMetadata({
        title: 'Property Not Found | RentPeshawar',
        noIndex: true,
      });
    }

    const firstImage = property.images?.[0]
      ? typeof property.images[0] === 'string'
        ? property.images[0]
        : property.images[0].url
      : undefined;

    return constructMetadata({
      title: buildPropertyTitle(property.title, property.locality?.name),
      description:
        property.description ||
        `Verified rental property in ${property.locality?.name || 'Peshawar'}. Rent: PKR ${property.monthlyRentPkr || (property as any).rentAmount}/month. Direct landlord contact on RentPeshawar.`,
      canonical: `/properties/${slug}`,
      image: firstImage,
      keywords: [
        property.title,
        property.locality?.name || 'Peshawar',
        property.propertyType,
        'rent in Peshawar',
        'verified rental listing',
      ],
    });
  } catch {
    return constructMetadata({
      title: 'Property Details | RentPeshawar',
      noIndex: true,
    });
  }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let property: PropertySummaryDto | null = null;
  let error: string | null = null;

  try {
    property = await getPropertyBySlugOrId(slug);
  } catch (err: any) {
    error = err?.message || 'Property not found or access restricted.';
  }

  if (error || !property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon="🚫"
          title="Property Unavailable or Category Restricted"
          description={
            error ||
            'This property may have been rented, deleted, or belongs to a different tenant category.'
          }
          actionText="Back to Properties"
          actionHref="/properties"
        />
      </div>
    );
  }

  const localityName = property.locality?.name || 'Peshawar';
  const localitySlug = property.locality?.slug || localityName.toLowerCase().replace(/\s+/g, '-');

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Peshawar Rentals', url: '/properties' },
    { name: localityName, url: `/rentals/peshawar/${localitySlug}` },
    { name: property.title, url: `/properties/${slug}` },
  ];

  const propertySchema = generatePropertySchema(property);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Structured Data Scripts */}
      <JsonLd data={propertySchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* Server-Rendered Semantic Breadcrumbs */}
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
          href={`/rentals/peshawar/${localitySlug}`}
          className="hover:text-peshawar-600 transition"
        >
          {localityName}
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold truncate max-w-xs">{property.title}</span>
      </nav>

      {/* Server-Rendered Main Listing Info */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950">{property.title}</h1>
          <p className="text-sm text-navy-500 mt-1">
            Sector: <span className="font-semibold text-navy-800">{localityName}</span>
            {property.addressNote && ` • ${property.addressNote}`}
          </p>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-m3-md border border-navy-100 text-center shadow-xs">
          <div className="p-2 border-r border-navy-50">
            <div className="text-lg">🛏️</div>
            <div className="text-xs text-navy-400 font-semibold mt-1">Bedrooms</div>
            <div className="text-sm font-black text-navy-900">
              {property.bedrooms || 'Studio / N/A'}
            </div>
          </div>
          <div className="p-2 border-r border-navy-50">
            <div className="text-lg">🚿</div>
            <div className="text-xs text-navy-400 font-semibold mt-1">Bathrooms</div>
            <div className="text-sm font-black text-navy-900">
              {property.bathrooms || 'Shared / N/A'}
            </div>
          </div>
          <div className="p-2 border-r border-navy-50">
            <div className="text-lg">🛋️</div>
            <div className="text-xs text-navy-400 font-semibold mt-1">Furnishing</div>
            <div className="text-sm font-black text-navy-900 capitalize">
              {property.furnishing ? property.furnishing.toLowerCase() : 'Unfurnished'}
            </div>
          </div>
          <div className="p-2">
            <div className="text-lg">📐</div>
            <div className="text-xs text-navy-400 font-semibold mt-1">Area</div>
            <div className="text-sm font-black text-navy-900">
              {property.areaSqFt ? `${property.areaSqFt} Sq Ft` : 'Standard'}
            </div>
          </div>
        </div>

        {/* Server-Rendered Description */}
        <section
          aria-labelledby="desc-heading"
          className="bg-white p-6 rounded-m3-lg border border-navy-100 shadow-sm space-y-3"
        >
          <h2 id="desc-heading" className="text-base font-bold text-navy-900">
            About this Property
          </h2>
          <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-line">
            {property.description}
          </p>
        </section>

        {/* Server-Rendered Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <section
            aria-labelledby="amenities-heading"
            className="bg-white p-6 rounded-m3-lg border border-navy-100 shadow-sm space-y-3"
          >
            <h2 id="amenities-heading" className="text-base font-bold text-navy-900">
              Amenities & Services
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities.map((item) => (
                <div
                  key={typeof item === 'string' ? item : item.id}
                  className="flex items-center gap-2 p-2.5 rounded-m3-sm bg-navy-50 text-xs font-semibold text-navy-800 border border-navy-100"
                >
                  <span className="text-peshawar-600">✓</span>
                  <span>{typeof item === 'string' ? item : item.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Interactive Client Component for Gallery, Inquiry, Favorites, Carousel */}
      <PropertyDetailClient property={property} />
    </main>
  );
}
