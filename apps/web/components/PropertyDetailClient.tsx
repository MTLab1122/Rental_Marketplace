'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { addFavorite, removeFavorite, getFavoriteIds } from '../lib/api';
import ImageGallery from './ImageGallery';
import InquiryModal from './InquiryModal';
import ReportModal from './ReportModal';
import SimilarPropertiesCarousel from './SimilarPropertiesCarousel';
import RecentlyViewedSection from './RecentlyViewedSection';
import { PropertySummaryDto, PropertyEligibility } from '@rental-peshawar/shared-types';

interface PropertyDetailClientProps {
  property: PropertySummaryDto;
}

export default function PropertyDetailClient({ property }: PropertyDetailClientProps) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    async function checkFav() {
      if (token && property?.id) {
        try {
          const favIds = await getFavoriteIds(token);
          setIsFavorited(favIds.includes(property.id));
        } catch {
          // ignore
        }
      }
    }
    checkFav();
  }, [token, property?.id]);

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

  const isStudent = property.eligibility === PropertyEligibility.STUDENTS_ONLY;
  const formattedRent = Number(
    property.monthlyRentPkr || (property as any).rentAmount || 0,
  ).toLocaleString('en-PK');
  const formattedDeposit = property.securityDepositPkr
    ? Number(property.securityDepositPkr).toLocaleString('en-PK')
    : null;

  return (
    <div className="space-y-8">
      {/* Top Actions */}
      <div className="flex items-center justify-end">
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
        <div className="lg:col-span-2">
          <ImageGallery images={property.images || []} title={property.title} />
        </div>

        <div className="bg-white rounded-m3-lg border border-navy-100 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
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

      {/* Similar Properties Carousel */}
      <SimilarPropertiesCarousel propertyId={property.id} />

      {/* Recently Viewed Section */}
      <RecentlyViewedSection />

      {/* Modals */}
      <InquiryModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
      />

      <ReportModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}
