'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import {
  getPropertyBySlugOrId,
  addFavorite,
  removeFavorite,
  getFavoriteIds,
} from '../../../lib/api';
import ImageGallery from '../../../components/ImageGallery';
import InquiryModal from '../../../components/InquiryModal';
import ReportModal from '../../../components/ReportModal';
import EmptyState from '../../../components/EmptyState';
import SimilarPropertiesCarousel from '../../../components/SimilarPropertiesCarousel';
import RecentlyViewedSection from '../../../components/RecentlyViewedSection';
import { PropertySummaryDto, PropertyEligibility } from '@rental-peshawar/shared-types';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.['slug'] as string;
  const { token, isAuthenticated } = useAuth();

  const [property, setProperty] = useState<PropertySummaryDto | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const prop = await getPropertyBySlugOrId(slug, token);
        setProperty(prop);

        if (token && prop?.id) {
          try {
            const favIds = await getFavoriteIds(token);
            setIsFavorited(favIds.includes(prop.id));
          } catch {
            // ignore
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Property not found or access restricted.');
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [slug, token]);

  const handleFavoriteToggle = async () => {
    if (!property) return;
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }

    const nextState = !isFavorited;
    setIsFavorited(nextState);
    try {
      if (nextState) {
        await addFavorite(property.id, token);
      } else {
        await removeFavorite(property.id, token);
      }
    } catch {
      setIsFavorited(!nextState);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="aspect-[16/9] bg-navy-200 rounded-m3-lg" />
        <div className="h-8 bg-navy-200 rounded w-2/3" />
        <div className="h-5 bg-navy-100 rounded w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          <div className="h-16 bg-navy-100 rounded" />
          <div className="h-16 bg-navy-100 rounded" />
          <div className="h-16 bg-navy-100 rounded" />
          <div className="h-16 bg-navy-100 rounded" />
        </div>
      </div>
    );
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

  const isStudent = property.eligibility === PropertyEligibility.STUDENTS_ONLY;
  const formattedRent = Number(property.monthlyRentPkr).toLocaleString('en-PK');
  const formattedDeposit = property.securityDepositPkr
    ? Number(property.securityDepositPkr).toLocaleString('en-PK')
    : null;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/properties"
          className="text-xs font-bold text-peshawar-700 hover:text-peshawar-800 flex items-center gap-1"
        >
          ← Back to Discovery Feed
        </Link>
        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
        >
          🚩 Report Listing
        </button>
      </div>

      {/* Hero: Image Gallery & Key Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image Gallery (2 cols) */}
        <div className="lg:col-span-2">
          <ImageGallery images={property.images || []} title={property.title} />
        </div>

        {/* Right Column: Pricing & Booking Card (1 col) */}
        <div className="bg-white rounded-m3-lg border border-navy-100 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            {/* Eligibility Badge */}
            <div className="mb-3">
              <span
                className={`px-3 py-1 rounded-m3-sm text-xs font-extrabold uppercase tracking-wider border inline-block ${
                  isStudent
                    ? 'bg-student-bg text-student-text border-student-border'
                    : 'bg-family-bg text-family-text border-family-border'
                }`}
              >
                {isStudent ? 'Students Only' : 'Families Only'}
              </span>
            </div>

            {/* Rent and Security Deposit */}
            <div className="border-b border-navy-100 pb-4 mb-4">
              <div className="text-3xl font-black text-navy-950">
                PKR {formattedRent}
                <span className="text-sm text-navy-500 font-normal"> / month</span>
              </div>
              {formattedDeposit && (
                <div className="text-xs text-navy-500 mt-1">
                  Security Deposit:{' '}
                  <span className="font-bold text-navy-800">PKR {formattedDeposit}</span>
                </div>
              )}
            </div>

            {/* Availability & Landlord Badge */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-peshawar-700 bg-peshawar-50 px-3 py-2 rounded-m3-sm border border-peshawar-200">
                <span className="w-2 h-2 rounded-full bg-peshawar-500"></span>
                <span>Active & Verified by Peshawar Admin</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-navy-600 px-1">
                <span>📍</span>
                <span>{property.locality?.name || 'Peshawar, KP'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setInquiryModalOpen(true)}
              className="w-full py-3 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-sm rounded-m3-md transition shadow-md flex items-center justify-center gap-2"
            >
              <span>💬</span> Contact Landlord & Inquire
            </button>

            <button
              type="button"
              onClick={handleFavoriteToggle}
              className={`w-full py-2.5 font-bold text-xs rounded-m3-md transition border flex items-center justify-center gap-2 ${
                isFavorited
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  : 'bg-white text-navy-700 border-navy-200 hover:bg-navy-50'
              }`}
            >
              <span>{isFavorited ? '❤️' : '🤍'}</span>
              <span>{isFavorited ? 'Saved in Favorites' : 'Save to Favorites'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Property Details Grid & Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Headline */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-950">{property.title}</h1>
            <p className="text-sm text-navy-500 mt-1">
              Sector: {property.locality?.name}
              {property.addressNote && ` • ${property.addressNote}`}
            </p>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-m3-md border border-navy-100 text-center shadow-xs">
            <div className="p-2 border-r border-navy-50">
              <div className="text-lg">🛏️</div>
              <div className="text-xs text-navy-400 font-semibold mt-1">Bedrooms</div>
              <div className="text-sm font-black text-navy-900">{property.bedrooms}</div>
            </div>
            <div className="p-2 border-r border-navy-50">
              <div className="text-lg">🚿</div>
              <div className="text-xs text-navy-400 font-semibold mt-1">Bathrooms</div>
              <div className="text-sm font-black text-navy-900">{property.bathrooms}</div>
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

          {/* Description */}
          <div className="bg-white p-6 rounded-m3-lg border border-navy-100 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-navy-900">About this Property</h2>
            <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities & Utilities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="bg-white p-6 rounded-m3-lg border border-navy-100 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-navy-900">Amenities & Services</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2.5 rounded-m3-sm bg-navy-50 text-xs font-semibold text-navy-800 border border-navy-100"
                  >
                    <span>✓</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Locality & Trust Side Card */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-m3-lg border border-navy-100 shadow-sm space-y-3">
            <h3 className="font-bold text-navy-900 text-sm">Peshawar Locality Profile</h3>
            <p className="text-xs text-navy-600 leading-relaxed">
              <strong>{property.locality?.name}</strong> is an officially approved zone within the
              Peshawar municipal district, providing verified transport, water, electricity, and
              cellular network coverage.
            </p>
            <div className="p-3 bg-navy-50 rounded-m3-sm text-[11px] text-navy-500 font-mono">
              Postal Code: {property.locality?.postalCode || '25000'}
            </div>
          </div>

          <div className="bg-peshawar-950 text-white p-5 rounded-m3-lg space-y-2 border border-peshawar-800">
            <div className="text-sm font-bold text-peshawar-400">Security Guarantee</div>
            <p className="text-xs text-navy-300 leading-relaxed">
              Inquiries and favorites are encrypted. Exact street numbers are masked until your
              identity is verified by the landlord to safeguard tenant privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Similar Properties Carousel */}
      <SimilarPropertiesCarousel propertyId={property.id} />

      {/* Recently Viewed Section */}
      <RecentlyViewedSection />

      {/* Inquiry Modal */}
      <InquiryModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
      />

      {/* Report Modal */}
      <ReportModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </main>
  );
}
