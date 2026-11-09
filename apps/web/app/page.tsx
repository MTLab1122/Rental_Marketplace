'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  getFeaturedProperties,
  getRecentProperties,
  getLocalities,
  getFavoriteIds,
} from '../lib/api';
import PropertyCard from '../components/PropertyCard';
import MapPreview from '../components/MapPreview';
import { PropertyGridSkeleton } from '../components/SkeletonLoader';
import { PropertySummaryDto, LocalityDto, TenantType } from '@rental-peshawar/shared-types';

export default function HomePage() {
  const router = useRouter();
  const { tenantType, setTenantType, token } = useAuth();

  const [localities, setLocalities] = useState<LocalityDto[]>([]);
  const [featured, setFeatured] = useState<PropertySummaryDto[]>([]);
  const [recent, setRecent] = useState<PropertySummaryDto[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Bar Form State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('');

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);
      try {
        const [locs, featRes, recRes] = await Promise.all([
          getLocalities(),
          getFeaturedProperties(tenantType, 6, token),
          getRecentProperties(tenantType, 6, token),
        ]);

        setLocalities(locs || []);
        setFeatured(featRes?.items || []);
        setRecent(recRes?.items || []);

        if (token) {
          try {
            const favs = await getFavoriteIds(token);
            setFavoriteIds(favs || []);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, [tenantType, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedLocality) params.append('localityId', selectedLocality);
    params.append('tenantType', tenantType);
    router.push(`/properties?${params.toString()}`);
  };

  const isStudent = tenantType === TenantType.STUDENT;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* 1. Hero Section & Search Bar */}
      <section className="relative rounded-m3-xl bg-gradient-to-r from-navy-950 via-navy-900 to-peshawar-950 text-white p-6 sm:p-10 lg:p-14 overflow-hidden shadow-xl border border-navy-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-m3-full bg-peshawar-600/30 border border-peshawar-500/50 text-peshawar-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <span>🇵🇰</span> Exclusively Peshawar Municipal Area
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Find Verified Rental Properties in <span className="text-peshawar-400">Peshawar</span>
          </h1>

          <p className="text-sm sm:text-base text-navy-200 max-w-2xl leading-relaxed">
            Strict segregation between Student Hostels and Family Homes. Zero cross-visibility,
            geo-verified within official municipal boundaries, and audited landlord CNIC
            credentials.
          </p>

          {/* Quick Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-6 bg-white p-2.5 sm:p-3 rounded-m3-lg shadow-2xl flex flex-col sm:flex-row gap-2.5 text-navy-900"
          >
            <div className="flex-1 flex items-center px-3 gap-2 border-b sm:border-b-0 sm:border-r border-navy-100 py-2 sm:py-0">
              <span className="text-navy-400 text-base">🔍</span>
              <input
                type="text"
                placeholder="Search studio, hostel room, flat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm font-medium focus:outline-none"
              />
            </div>

            <div className="sm:w-60 flex items-center px-3 gap-2 py-2 sm:py-0">
              <span className="text-navy-400 text-base">📍</span>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full text-sm font-medium focus:outline-none bg-white text-navy-800"
              >
                <option value="">All Localities</option>
                {localities.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold px-6 py-3 rounded-m3-md transition shadow-md text-sm whitespace-nowrap"
            >
              Search Properties
            </button>
          </form>
        </div>
      </section>

      {/* 2. Distinct Student vs Family Entry Points */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Portal Card */}
        <div
          onClick={() => setTenantType(TenantType.STUDENT)}
          className={`cursor-pointer rounded-m3-lg p-6 border-2 transition-all duration-200 relative overflow-hidden ${
            isStudent
              ? 'bg-student-bg/40 border-student-border shadow-md scale-[1.01]'
              : 'bg-white border-navy-200 hover:border-student-border opacity-85 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded-m3-sm text-[11px] font-extrabold uppercase tracking-wider bg-student-bg text-student-text border border-student-border">
              Students Only
            </span>
            {isStudent && (
              <span className="text-xs font-bold text-student-text flex items-center gap-1">
                ✓ Active Discovery Feed
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-navy-950 mb-1">
            🎓 Student Hostels & Bachelor Rooms
          </h2>
          <p className="text-xs text-navy-600 mb-4 leading-relaxed">
            Curated student accommodations near University of Peshawar, UET Peshawar, KMC,
            Agriculture University, and Islamia College.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-student-text">
            <span className="bg-white/80 px-2 py-1 rounded border border-student-border/50">
              Single Rooms
            </span>
            <span className="bg-white/80 px-2 py-1 rounded border border-student-border/50">
              Shared Hostels
            </span>
            <span className="bg-white/80 px-2 py-1 rounded border border-student-border/50">
              WiFi & Mess Included
            </span>
          </div>
        </div>

        {/* Family Portal Card */}
        <div
          onClick={() => setTenantType(TenantType.FAMILY)}
          className={`cursor-pointer rounded-m3-lg p-6 border-2 transition-all duration-200 relative overflow-hidden ${
            !isStudent
              ? 'bg-family-bg/40 border-family-border shadow-md scale-[1.01]'
              : 'bg-white border-navy-200 hover:border-family-border opacity-85 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded-m3-sm text-[11px] font-extrabold uppercase tracking-wider bg-family-bg text-family-text border border-family-border">
              Families Only
            </span>
            {!isStudent && (
              <span className="text-xs font-bold text-family-text flex items-center gap-1">
                ✓ Active Discovery Feed
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-navy-950 mb-1">
            👨‍👩‍👧‍👦 Family Houses & Independent Portions
          </h2>
          <p className="text-xs text-navy-600 mb-4 leading-relaxed">
            Peaceful family residences across Hayatabad, Warsak Road, Regi Model Town, and Cantt.
            Strictly zero bachelor/hostel presence.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-family-text">
            <span className="bg-white/80 px-2 py-1 rounded border border-family-border/50">
              2–4 Bed Houses
            </span>
            <span className="bg-white/80 px-2 py-1 rounded border border-family-border/50">
              Upper/Lower Portions
            </span>
            <span className="bg-white/80 px-2 py-1 rounded border border-family-border/50">
              Car Parking & Gas
            </span>
          </div>
        </div>
      </section>

      {/* 3. Locality Quick Chips */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-navy-900 text-lg">Explore by Peshawar Locality</h3>
          <Link href="/properties" className="text-xs font-bold text-peshawar-600 hover:underline">
            All Localities →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {localities.slice(0, 10).map((loc) => (
            <Link
              key={loc.id}
              href={`/properties?localityId=${loc.id}&tenantType=${tenantType}`}
              className="px-3 py-1.5 bg-white border border-navy-200 hover:border-peshawar-500 hover:bg-peshawar-50 text-navy-800 rounded-m3-full text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>📍</span>
              <span>{loc.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Price Range Quick Filters */}
      <section className="space-y-3">
        <h3 className="font-extrabold text-navy-900 text-lg">Quick Budget Filters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href={`/properties?maxRent=20000&tenantType=${tenantType}`}
            className="p-3 bg-white rounded-m3-md border border-navy-100 hover:border-peshawar-400 transition text-center shadow-xs"
          >
            <div className="text-xs font-bold text-navy-500 uppercase">Under</div>
            <div className="text-base font-black text-navy-900">PKR 20,000</div>
          </Link>
          <Link
            href={`/properties?minRent=20000&maxRent=40000&tenantType=${tenantType}`}
            className="p-3 bg-white rounded-m3-md border border-navy-100 hover:border-peshawar-400 transition text-center shadow-xs"
          >
            <div className="text-xs font-bold text-navy-500 uppercase">Mid-Budget</div>
            <div className="text-base font-black text-navy-900">20K – 40K</div>
          </Link>
          <Link
            href={`/properties?minRent=40000&maxRent=80000&tenantType=${tenantType}`}
            className="p-3 bg-white rounded-m3-md border border-navy-100 hover:border-peshawar-400 transition text-center shadow-xs"
          >
            <div className="text-xs font-bold text-navy-500 uppercase">Family Scale</div>
            <div className="text-base font-black text-navy-900">40K – 80K</div>
          </Link>
          <Link
            href={`/properties?minRent=80000&tenantType=${tenantType}`}
            className="p-3 bg-white rounded-m3-md border border-navy-100 hover:border-peshawar-400 transition text-center shadow-xs"
          >
            <div className="text-xs font-bold text-navy-500 uppercase">Premium</div>
            <div className="text-base font-black text-navy-900">PKR 80,000+</div>
          </Link>
        </div>
      </section>

      {/* 5. Featured Properties Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-navy-900">
              Featured {isStudent ? 'Student' : 'Family'} Listings
            </h3>
            <p className="text-xs text-navy-500">
              Audited accommodations meeting our highest verification criteria.
            </p>
          </div>
          <Link
            href={`/properties?tenantType=${tenantType}`}
            className="text-xs font-bold text-peshawar-600 hover:underline"
          >
            View All ({featured.length}) →
          </Link>
        </div>

        {loading ? (
          <PropertyGridSkeleton count={3} />
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                isFavoritedInitially={favoriteIds.includes(prop.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-m3-lg border border-dashed border-navy-200 text-center">
            <p className="text-sm text-navy-500">
              No featured {isStudent ? 'student' : 'family'} properties currently available.
            </p>
          </div>
        )}
      </section>

      {/* 6. Recently Added Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-navy-900">Recently Added in Peshawar</h3>
            <p className="text-xs text-navy-500">Fresh listings added to the market this week.</p>
          </div>
          <Link
            href={`/properties?tenantType=${tenantType}&sortBy=NEWEST`}
            className="text-xs font-bold text-peshawar-600 hover:underline"
          >
            Browse Latest →
          </Link>
        </div>

        {loading ? (
          <PropertyGridSkeleton count={3} />
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                isFavoritedInitially={favoriteIds.includes(prop.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-m3-lg border border-dashed border-navy-200 text-center">
            <p className="text-sm text-navy-500">
              No recent listings found for {isStudent ? 'students' : 'families'}.
            </p>
          </div>
        )}
      </section>

      {/* 7. Peshawar Locality Map Preview */}
      <section>
        <MapPreview
          localities={localities}
          onLocalitySelect={(locId) =>
            router.push(`/properties?localityId=${locId}&tenantType=${tenantType}`)
          }
        />
      </section>
    </main>
  );
}
