'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PropertySummaryDto, PropertyEligibility } from '@rental-peshawar/shared-types';
import { addFavorite, removeFavorite } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import {
  BedIcon,
  BathIcon,
  SofaIcon,
  MapPinIcon,
  CheckIcon,
  StudentIcon,
  FamilyIcon,
  ArrowRightIcon,
} from './Icons';

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
    <article className="group bg-white rounded-md border border-navy-100 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col h-full">
      {/* Property Image & Badges */}
      <div className="relative aspect-[16/10] bg-navy-100 overflow-hidden">
        <img
          src={primaryImg}
          alt={`Rental listing: ${property.title} in ${property.locality?.name || 'Peshawar'}`}
          width={800}
          height={500}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Eligibility Tag */}
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider border pointer-events-auto flex items-center gap-1 ${
              isStudent
                ? 'bg-student-bg text-student-text border-student-border'
                : 'bg-family-bg text-family-text border-family-border'
            }`}
          >
            {isStudent ? (
              <>
                <StudentIcon className="w-3.5 h-3.5" />
                <span>Students Only</span>
              </>
            ) : (
              <>
                <FamilyIcon className="w-3.5 h-3.5" />
                <span>Families Only</span>
              </>
            )}
          </span>

          {/* Favorite Heart Button with compliant 44x44px+ touch area */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={loadingFav}
            className={`w-11 h-11 rounded-md flex items-center justify-center backdrop-blur-md shadow-sm transition pointer-events-auto focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isFavorited
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-white/95 text-navy-700 hover:bg-white hover:text-red-600 border border-navy-200'
            }`}
            aria-label={isFavorited ? 'Remove from saved favorites' : 'Save to favorites'}
          >
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>

        {/* Verified Landlord Pill */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-navy-950/85 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-navy-700">
            <CheckIcon className="w-3 h-3 text-emerald-400" />
            <span>Verified Landlord</span>
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
              <span className="text-[11px] text-navy-500">Dep: PKR {formattedDeposit}</span>
            )}
          </div>

          {/* Title */}
          <Link href={`/properties/${property.slug || property.id}`}>
            <h3 className="font-bold text-navy-900 text-base line-clamp-1 group-hover:text-peshawar-700 transition">
              {property.title}
            </h3>
          </Link>

          {/* Locality */}
          <div className="flex items-center gap-1.5 text-xs text-navy-600 mt-1 mb-3">
            <MapPinIcon className="w-3.5 h-3.5 text-peshawar-700 flex-shrink-0" />
            <span className="truncate">{property.locality?.name || 'Peshawar'}</span>
            {property.addressNote && (
              <span className="text-navy-500 truncate">({property.addressNote})</span>
            )}
          </div>

          {/* Key Specs */}
          <div className="flex items-center gap-3 py-2 border-t border-navy-100 text-xs text-navy-700 font-medium">
            <div className="flex items-center gap-1.5">
              <BedIcon className="w-4 h-4 text-navy-500" />
              <span>
                {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <BathIcon className="w-4 h-4 text-navy-500" />
              <span>
                {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
              </span>
            </div>
            {property.furnishing && (
              <div className="flex items-center gap-1.5 capitalize">
                <SofaIcon className="w-4 h-4 text-navy-500" />
                <span>{property.furnishing.toLowerCase()}</span>
              </div>
            )}
          </div>
        </div>

        {/* View Details Link */}
        <div className="pt-3 border-t border-navy-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-navy-500 capitalize">
            {property.propertyType.replace('_', ' ').toLowerCase()}
          </span>
          <Link
            href={`/properties/${property.slug || property.id}`}
            className="text-xs font-bold text-peshawar-700 hover:text-peshawar-800 flex items-center gap-1"
          >
            <span>View Details</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
