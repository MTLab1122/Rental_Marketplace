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
import {
  SearchIcon,
  MapPinIcon,
  StudentIcon,
  FamilyIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon,
} from '../components/Icons';

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
    if (searchTerm.trim()) params.append('search', searchTerm.trim());
    if (selectedLocality) params.append('localityId', selectedLocality);
    params.append('tenantType', tenantType);
    router.push(`/properties?${params.toString()}`);
  };

  const isStudent = tenantType === TenantType.STUDENT;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* 1. Hero Section & Search Bar */}
      <section className="relative rounded-m3-xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white p-6 sm:p-10 lg:p-14 overflow-hidden shadow-xl border border-navy-800">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-peshawar-600/30 border border-peshawar-500/50 text-peshawar-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <ShieldCheckIcon className="w-4 h-4 text-peshawar-400" />
            <span>Exclusively Peshawar Municipal Area</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            Rent verified homes in Peshawar
          </h1>

          <p className="text-sm sm:text-base text-navy-200 max-w-2xl leading-relaxed">
            Search student, family, and professional rental properties by locality, budget, rooms,
            and facilities.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-peshawar-600 hover:bg-peshawar-500 text-white font-bold text-sm shadow-md transition focus-visible:ring-2 focus-visible:ring-peshawar-400"
            >
              <span>Browse rentals</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/for-landlords"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-navy-800/80 hover:bg-navy-800 text-navy-100 border border-navy-700 font-bold text-sm transition focus-visible:ring-2 focus-visible:ring-navy-400"
            >
              <span>List your property</span>
            </Link>
          </div>

          {/* Quick Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-6 bg-white p-2.5 sm:p-3 rounded-md shadow-2xl flex flex-col sm:flex-row gap-2.5 text-navy-900"
          >
            {/* Honeypot field for bot spam prevention */}
            <input
              type="text"
              name="hp_search_confirm"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div className="flex-1 flex items-center px-3 gap-2 border-b sm:border-b-0 sm:border-r border-navy-100 py-2 sm:py-0">
              <label htmlFor="hero-search-input" className="sr-only">
                Search properties
              </label>
              <SearchIcon className="text-navy-400 w-4 h-4 flex-shrink-0" />
              <input
                id="hero-search-input"
                type="text"
                placeholder="Search studio, hostel room, flat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm font-medium focus:outline-none text-navy-900"
              />
            </div>

            <div className="sm:w-60 flex items-center px-3 gap-2 py-2 sm:py-0">
              <label htmlFor="hero-locality-select" className="sr-only">
                Filter by locality
              </label>
              <MapPinIcon className="text-navy-400 w-4 h-4 flex-shrink-0" />
              <select
                id="hero-locality-select"
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
              className="bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold px-6 py-3 rounded-md transition shadow-md text-sm whitespace-nowrap focus-visible:ring-2 focus-visible:ring-peshawar-500"
            >
              Search Properties
            </button>
          </form>
        </div>
      </section>

      {/* 2. Distinct Student vs Family Entry Points */}
      <section
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        aria-label="Tenant Eligibility Modes"
      >
        {/* Student Portal Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTenantType(TenantType.STUDENT)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setTenantType(TenantType.STUDENT);
            }
          }}
          className={`cursor-pointer rounded-md p-6 border-2 transition-all duration-200 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peshawar-500 ${
            isStudent
              ? 'bg-student-bg border-student-border shadow-md'
              : 'bg-white border-navy-200 hover:border-student-border'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-student-bg text-student-text border border-student-border inline-flex items-center gap-1">
              <StudentIcon className="w-3.5 h-3.5" />
              <span>Students Only</span>
            </span>
            {isStudent && (
              <span className="text-xs font-bold text-student-text flex items-center gap-1">
                <CheckIcon className="w-3.5 h-3.5 text-student-text" /> Active Discovery Feed
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-navy-950 mb-1 flex items-center gap-2">
            <StudentIcon className="w-5 h-5 text-student-text" />
            <span>Student Hostels & Bachelor Rooms</span>
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
          role="button"
          tabIndex={0}
          onClick={() => setTenantType(TenantType.FAMILY)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setTenantType(TenantType.FAMILY);
            }
          }}
          className={`cursor-pointer rounded-md p-6 border-2 transition-all duration-200 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peshawar-500 ${
            !isStudent
              ? 'bg-family-bg border-family-border shadow-md'
              : 'bg-white border-navy-200 hover:border-family-border'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-family-bg text-family-text border border-family-border inline-flex items-center gap-1">
              <FamilyIcon className="w-3.5 h-3.5" />
              <span>Families Only</span>
            </span>
            {!isStudent && (
              <span className="text-xs font-bold text-family-text flex items-center gap-1">
                <CheckIcon className="w-3.5 h-3.5 text-family-text" /> Active Discovery Feed
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-navy-950 mb-1 flex items-center gap-2">
            <FamilyIcon className="w-5 h-5 text-family-text" />
            <span>Family Houses & Independent Portions</span>
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
          <Link href="/properties" className="text-xs font-bold text-peshawar-700 hover:underline">
            All Localities →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {localities.slice(0, 10).map((loc) => (
            <Link
              key={loc.id}
              href={`/properties?localityId=${loc.id}&tenantType=${tenantType}`}
              className="px-3 py-1.5 bg-white border border-navy-200 hover:border-peshawar-500 hover:bg-peshawar-50 text-navy-800 rounded-md text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <MapPinIcon className="w-3.5 h-3.5 text-navy-400" />
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
            className="p-3 bg-white rounded-md border border-navy-100 hover:border-peshawar-500 transition text-center shadow-xs"
          >
            <div className="text-xs font-bold text-navy-500 uppercase">Under</div>
            <div className="text-base font-black text-navy-900">PKR 20,000</div>
          </Link>
          <Link
            href={`/properties?minRent=20000&maxRent=40000&tenantType=${tenantType}`}
            className="p-3 bg-white rounded-md border border-navy-100 hover:border-peshawar-500 transition text-center shadow-xs"
          >
            <div className="text-xs font-bold text-navy-500 uppercase">Mid-Budget</div>
            <div className="text-base font-black text-navy-900">20K – 40K</div>
          </Link>
          <Link
            href={`/properties?minRent=40000&maxRent=80000&tenantType=${tenantType}`}
            className="p-3 bg-white rounded-md border border-navy-100 hover:border-peshawar-500 transition text-center shadow-xs"
          >
            <div className="text-xs font-bold text-navy-500 uppercase">Family Scale</div>
            <div className="text-base font-black text-navy-900">40K – 80K</div>
          </Link>
          <Link
            href={`/properties?minRent=80000&tenantType=${tenantType}`}
            className="p-3 bg-white rounded-md border border-navy-100 hover:border-peshawar-500 transition text-center shadow-xs"
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
            <p className="text-xs text-navy-600">
              Audited accommodations meeting our highest verification criteria.
            </p>
          </div>
          <Link
            href={`/properties?tenantType=${tenantType}`}
            className="text-xs font-bold text-peshawar-700 hover:underline"
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
          <div className="bg-white p-8 rounded-md border border-dashed border-navy-200 text-center">
            <p className="text-sm text-navy-600">
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
            <p className="text-xs text-navy-600">Fresh listings added to the market this week.</p>
          </div>
          <Link
            href={`/properties?tenantType=${tenantType}&sortBy=NEWEST`}
            className="text-xs font-bold text-peshawar-700 hover:underline"
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
          <div className="bg-white p-8 rounded-md border border-dashed border-navy-200 text-center">
            <p className="text-sm text-navy-600">
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
