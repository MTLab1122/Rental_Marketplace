'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PropertySummaryDto, PropertyEligibility } from '@rental-peshawar/shared-types';
import { addFavorite, removeFavorite } from '../lib/api';
import { useAuth } from '../lib/auth-context';

interface PropertyCardProps {
  property: PropertySummaryDto;
  isFavoritedInitially?: boolean;
  onFavoriteToggle?: (propertyId: string, isFavorited: boolean) => void;
}

export default function PropertyCard({
  property,
  isFavoritedInitially = false,
  onFavoriteToggle,
}: PropertyCardProps) {
  const { token, isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(isFavoritedInitially);
  const [loadingFav, setLoadingFav] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !token) {
      window.location.href = '/login';
      return;
    }

    const nextState = !isFavorited;
    setIsFavorited(nextState); // Optimistic UI update
    setLoadingFav(true);

    try {
      if (nextState) {
        await addFavorite(property.id, token);
      } else {
        await removeFavorite(property.id, token);
      }
      onFavoriteToggle?.(property.id, nextState);
    } catch {
      setIsFavorited(!nextState); // Rollback on error
    } finally {
      setLoadingFav(false);
    }
  };

  const isStudent = property.eligibility === PropertyEligibility.STUDENTS_ONLY;
  const primaryImg =
    property.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';

  const formattedRent = Number(property.monthlyRentPkr).toLocaleString('en-PK');
  const formattedDeposit = property.securityDepositPkr
    ? Number(property.securityDepositPkr).toLocaleString('en-PK')
    : null;

  return (
    <div className="group bg-white rounded-m3-lg border border-navy-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">
      {/* Property Image & Badges */}
      <div className="relative aspect-[16/10] bg-navy-100 overflow-hidden">
        <img
          src={primaryImg}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Eligibility Tag */}
          <span
            className={`px-2.5 py-1 rounded-m3-sm text-[11px] font-extrabold uppercase tracking-wider border pointer-events-auto ${
              isStudent
                ? 'bg-student-bg text-student-text border-student-border'
                : 'bg-family-bg text-family-text border-family-border'
            }`}
          >
            {isStudent ? 'Students Only' : 'Families Only'}
          </span>

          {/* Favorite Heart Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={loadingFav}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition pointer-events-auto ${
              isFavorited
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/90 text-navy-600 hover:bg-white hover:text-red-500'
            }`}
            aria-label="Save to favorites"
          >
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>

        {/* Verified Landlord Pill */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-navy-900/80 backdrop-blur-md text-peshawar-300 text-[10px] font-bold px-2 py-0.5 rounded-m3-sm flex items-center gap-1 border border-navy-700">
            <svg className="w-3 h-3 text-peshawar-400 fill-current" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Verified Landlord
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          {/* Price */}
          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-xl font-black text-navy-950">PKR {formattedRent}</span>
              <span className="text-xs text-navy-500 font-medium ml-1">/ month</span>
            </div>
            {formattedDeposit && (
              <span className="text-[11px] text-navy-400">Dep: PKR {formattedDeposit}</span>
            )}
          </div>

          {/* Title */}
          <Link href={`/properties/${property.slug || property.id}`}>
            <h3 className="font-bold text-navy-900 text-base line-clamp-1 group-hover:text-peshawar-600 transition">
              {property.title}
            </h3>
          </Link>

          {/* Locality */}
          <div className="flex items-center gap-1 text-xs text-navy-500 mt-1 mb-3">
            <svg
              className="w-3.5 h-3.5 text-peshawar-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">{property.locality?.name || 'Peshawar'}</span>
            {property.addressNote && (
              <span className="text-navy-400 truncate">({property.addressNote})</span>
            )}
          </div>

          {/* Key Specs */}
          <div className="flex items-center gap-3 py-2 border-t border-navy-50 text-xs text-navy-600 font-medium">
            <div className="flex items-center gap-1">
              <span>🛏️</span>
              <span>
                {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>🚿</span>
              <span>
                {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
              </span>
            </div>
            {property.furnishing && (
              <div className="flex items-center gap-1 capitalize">
                <span>🛋️</span>
                <span>{property.furnishing.toLowerCase()}</span>
              </div>
            )}
          </div>
        </div>

        {/* View Details Link */}
        <div className="pt-3 border-t border-navy-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-navy-400 capitalize">
            {property.propertyType.replace('_', ' ').toLowerCase()}
          </span>
          <Link
            href={`/properties/${property.slug || property.id}`}
            className="text-xs font-bold text-peshawar-700 hover:text-peshawar-800 flex items-center gap-0.5"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
