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
  StarIcon,
  HouseIcon,
  ChatIcon,
} from '../components/Icons';

// Featured Peshawar Localities with imagery for visual hub cards
const LOCALITY_HUBS = [
  {
    name: 'Hayatabad (Phases 1-7)',
    slug: 'hayatabad',
    id: 'loc-hayatabad',
    tagline: 'Planned township, parks, medical institutes & wide boulevards',
    stats: '42+ Listings • Avg PKR 38,000/mo',
    category: 'Family & Executive',
    image:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'University Town & Campus',
    slug: 'university-town',
    id: 'loc-univ-town',
    tagline: 'Adjoining UoP, UET, KMC & Agriculture University',
    stats: '38+ Listings • Avg PKR 12,500/seat',
    category: 'Student Hub & Faculty',
    image:
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Peshawar Cantt & Saddar',
    slug: 'peshawar-cantt',
    id: 'loc-cantt',
    tagline: 'Secure central district, commercial hubs & luxury flats',
    stats: '29+ Listings • Avg PKR 55,000/mo',
    category: 'Commercial & High Security',
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Warsak Road Enclave',
    slug: 'warsak-road',
    id: 'loc-warsak',
    tagline: 'Gated family housing colonies with reliable utility networks',
    stats: '24+ Listings • Avg PKR 32,000/mo',
    category: 'Peaceful Family Sector',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Regi Model Town (RMT)',
    slug: 'regi-model-town',
    id: 'loc-regi',
    tagline: 'Modern new constructions, spacious independent portions',
    stats: '19+ Listings • Avg PKR 28,000/mo',
    category: 'Modern Planned Community',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'DHA Peshawar',
    slug: 'dha-peshawar',
    id: 'loc-dha',
    tagline: 'Underground electrification, world-class amenities & safety',
    stats: '15+ Listings • Avg PKR 75,000/mo',
    category: 'Premier Luxury Living',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
  },
];

const FAQS = [
  {
    question: 'How does PeshawarRent separate Student and Family accommodations?',
    answer:
      'Our platform strictly segregates listings at the database and UI levels. When browsing in Student Mode, only verified student hostels, single rooms, and student apartments are displayed. In Family Mode, only independent houses and portions reserved strictly for verified families appear. Zero cross-listing ensures complete cultural peace of mind.',
  },
  {
    question: 'Are all properties verified by Peshawar teams before publishing?',
    answer:
      'Yes. Every property published on PeshawarRent undergoes two-stage verification: ownership documentation (Fard, Registry or Allotment letter) and physical address geotagging within Peshawar municipal coordinates (33.90°N to 34.15°N, 71.35°E to 71.70°E).',
  },
  {
    question: 'Are there any broker or commission fees charged to tenants?',
    answer:
      'No. PeshawarRent operates with zero tenant commissions. You connect directly with the property owner or registered landlord without middleman markups or commission cuts.',
  },
  {
    question: 'Does PeshawarRent assist with the Khyber Pakhtunkhwa Tenancy Act requirements?',
    answer:
      'Yes. Our platform generates standardized KP Tenancy Agreements that conform with the Khyber Pakhtunkhwa Restriction of Rented Buildings Act. These contracts can be directly registered at the local Peshawar Police Station and Conciliation Courts.',
  },
  {
    question: 'How do students book hostel beds and check mess facilities?',
    answer:
      'Student listings specify single room vs. multi-bed sharing rates, mess fees, WiFi speed, UPS/generator backup hours, and distance to Peshawar universities (UoP, UET, KMC, Agriculture). You can submit an inquiry or schedule an inspection tour online.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { tenantType, setTenantType, token } = useAuth();

  const [localities, setLocalities] = useState<LocalityDto[]>([]);
  const [featured, setFeatured] = useState<PropertySummaryDto[]>([]);
  const [recent, setRecent] = useState<PropertySummaryDto[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* 1. Hero Section & Search Bar */}
      <section className="relative rounded-m3-xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white p-6 sm:p-12 lg:p-16 overflow-hidden shadow-2xl border border-navy-800">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-peshawar-600/30 border border-peshawar-500/50 text-peshawar-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <ShieldCheckIcon className="w-4 h-4 text-peshawar-400" />
            <span>Exclusively Peshawar Municipal Area • Zero Brokerage</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
            Find verified homes and hostels in Peshawar.
          </h1>

          <p className="text-sm sm:text-base text-navy-200 max-w-2xl leading-relaxed">
            The official residential rental network for Peshawar. Strictly segregated for university
            students and peaceful family households across 15 municipal localities.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-peshawar-600 hover:bg-peshawar-500 text-white font-bold text-sm shadow-md transition focus-visible:ring-2 focus-visible:ring-peshawar-400"
            >
              <span>Explore All Listings</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/for-landlords"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-navy-800/80 hover:bg-navy-800 text-navy-100 border border-navy-700 font-bold text-sm transition focus-visible:ring-2 focus-visible:ring-navy-400"
            >
              <HouseIcon className="w-4 h-4 text-peshawar-400" />
              <span>List Property Free</span>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 text-navy-300 hover:text-white text-sm font-semibold transition"
            >
              <span>Our Standards & Story →</span>
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
                placeholder="Search hostel room, upper portion, flat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm font-medium focus:outline-none text-navy-900 placeholder:text-navy-400"
              />
            </div>

            <div className="sm:w-64 flex items-center px-3 gap-2 py-2 sm:py-0">
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
                <option value="">All 15 Localities</option>
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

          {/* Quick Metrics Trust Bar */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-navy-300 border-t border-navy-800/80">
            <div>
              <div className="text-white font-bold text-sm">15 Localities</div>
              <div>Strict Peshawar Municipal Bounds</div>
            </div>
            <div>
              <div className="text-white font-bold text-sm">0% Commission</div>
              <div>Direct Landlord Contact</div>
            </div>
            <div>
              <div className="text-white font-bold text-sm">NADRA Verified</div>
              <div>CNIC Identification Required</div>
            </div>
            <div>
              <div className="text-white font-bold text-sm">KP Tenancy Act</div>
              <div>Police Registration Leases</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Distinct Student vs Family Mode Switcher Cards */}
      <section className="space-y-4" aria-label="Tenant Eligibility Modes">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <h2 className="text-2xl font-black text-navy-950">Choose Your Discovery Experience</h2>
          <p className="text-sm text-navy-600">
            PeshawarRent guarantees 100% eligibility segregation. Switch modes below to view
            targeted properties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            className={`cursor-pointer rounded-lg p-6 sm:p-8 border-2 transition-all duration-200 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peshawar-500 ${
              isStudent
                ? 'bg-student-bg border-student-border shadow-md'
                : 'bg-white border-navy-200 hover:border-student-border'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider bg-student-bg text-student-text border border-student-border inline-flex items-center gap-1.5">
                <StudentIcon className="w-4 h-4" />
                <span>Student & Scholar Mode</span>
              </span>
              {isStudent && (
                <span className="text-xs font-bold text-student-text flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-student-border">
                  <CheckIcon className="w-4 h-4 text-student-text" /> Active Selection
                </span>
              )}
            </div>
            <h3 className="text-2xl font-extrabold text-navy-950 mb-2 flex items-center gap-2">
              <StudentIcon className="w-6 h-6 text-student-text" />
              <span>Student Hostels & Bachelor Rooms</span>
            </h3>
            <p className="text-sm text-navy-600 mb-6 leading-relaxed">
              Targeted accommodations near University of Peshawar, UET Peshawar, KMC, Agriculture
              University, and Islamia College. Filter by mess included, study desks, generator
              backup, and single vs. sharing beds.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-student-text">
              <span className="bg-white px-3 py-1.5 rounded-md border border-student-border/60">
                Single Rooms from PKR 18K
              </span>
              <span className="bg-white px-3 py-1.5 rounded-md border border-student-border/60">
                Hostel Beds from PKR 9K
              </span>
              <span className="bg-white px-3 py-1.5 rounded-md border border-student-border/60">
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
            className={`cursor-pointer rounded-lg p-6 sm:p-8 border-2 transition-all duration-200 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peshawar-500 ${
              !isStudent
                ? 'bg-family-bg border-family-border shadow-md'
                : 'bg-white border-navy-200 hover:border-family-border'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider bg-family-bg text-family-text border border-family-border inline-flex items-center gap-1.5">
                <FamilyIcon className="w-4 h-4" />
                <span>Family Residence Mode</span>
              </span>
              {!isStudent && (
                <span className="text-xs font-bold text-family-text flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-family-border">
                  <CheckIcon className="w-4 h-4 text-family-text" /> Active Selection
                </span>
              )}
            </div>
            <h3 className="text-2xl font-extrabold text-navy-950 mb-2 flex items-center gap-2">
              <FamilyIcon className="w-6 h-6 text-family-text" />
              <span>Family Houses & Independent Portions</span>
            </h3>
            <p className="text-sm text-navy-600 mb-6 leading-relaxed">
              Quiet, secure family residences across Hayatabad, Warsak Road, Regi Model Town, DHA,
              and Cantt. Strict zero-bachelor policy, private entry gates, gas meters, and car
              parking.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-family-text">
              <span className="bg-white px-3 py-1.5 rounded-md border border-family-border/60">
                Upper & Lower Portions
              </span>
              <span className="bg-white px-3 py-1.5 rounded-md border border-family-border/60">
                Independent 5–10 Marla Houses
              </span>
              <span className="bg-white px-3 py-1.5 rounded-md border border-family-border/60">
                Dedicated Sui Gas & Car Porch
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Properties Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-navy-100 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-peshawar-700">
              Hand-Audited Listings
            </div>
            <h2 className="text-2xl font-black text-navy-950">
              Featured {isStudent ? 'Student Accommodations' : 'Family Residences'}
            </h2>
            <p className="text-xs sm:text-sm text-navy-600">
              Properties verified with photo inspections and verified landlord contact.
            </p>
          </div>
          <Link
            href={`/properties?tenantType=${tenantType}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-peshawar-700 hover:text-peshawar-800 transition"
          >
            <span>View All ({featured.length}) Listings</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <PropertyGridSkeleton count={6} />
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
          <div className="bg-white p-12 rounded-lg border border-dashed border-navy-200 text-center space-y-3">
            <HouseIcon className="w-10 h-10 text-navy-300 mx-auto" />
            <p className="text-base font-bold text-navy-800">
              No featured {isStudent ? 'student' : 'family'} properties currently available.
            </p>
            <p className="text-xs text-navy-500 max-w-md mx-auto">
              Switch modes above or click below to search across all 15 Peshawar localities.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-md text-xs font-bold"
            >
              Browse All Properties
            </Link>
          </div>
        )}
      </section>

      {/* 4. Visual Locality Hubs Showcase */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-navy-100 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-peshawar-700">
              Neighbourhood Discovery
            </div>
            <h2 className="text-2xl font-black text-navy-950">Top Peshawar Locality Hubs</h2>
            <p className="text-xs sm:text-sm text-navy-600">
              Explore rentals organized by sector, university proximity, and lifestyle.
            </p>
          </div>
          <Link
            href="/properties"
            className="text-sm font-bold text-peshawar-700 hover:underline inline-flex items-center gap-1"
          >
            <span>View All 15 Localities</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {LOCALITY_HUBS.map((hub) => (
            <Link
              key={hub.id}
              href={`/properties?localityId=${hub.id}&tenantType=${tenantType}`}
              className="group block bg-white rounded-lg border border-navy-200 hover:border-peshawar-500 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div className="relative h-44 w-full bg-navy-100 overflow-hidden">
                <img
                  src={hub.image}
                  alt={hub.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/20 to-transparent" />
                <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-bold text-white uppercase tracking-wider border border-navy-700">
                  {hub.category}
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-lg font-black leading-tight drop-shadow">{hub.name}</h3>
                  <p className="text-xs text-navy-200 line-clamp-1">{hub.stats}</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs text-navy-600 line-clamp-2">{hub.tagline}</p>
                <div className="flex items-center justify-between pt-2 border-t border-navy-100 text-xs font-bold text-peshawar-700">
                  <span>Explore listings</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Recently Added Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-navy-100 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-peshawar-700">
              Fresh Inventory
            </div>
            <h2 className="text-2xl font-black text-navy-950">Recently Listed in Peshawar</h2>
            <p className="text-xs sm:text-sm text-navy-600">
              Newly verified listings added to the platform this week.
            </p>
          </div>
          <Link
            href={`/properties?tenantType=${tenantType}&sortBy=NEWEST`}
            className="text-sm font-bold text-peshawar-700 hover:underline inline-flex items-center gap-1"
          >
            <span>Browse Latest</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <PropertyGridSkeleton count={3} />
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.slice(0, 3).map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                isFavoritedInitially={favoriteIds.includes(prop.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg border border-dashed border-navy-200 text-center">
            <p className="text-sm text-navy-600">No recent listings available.</p>
          </div>
        )}
      </section>

      {/* 6. Why Choose PeshawarRent — 6 Core Value Propositions */}
      <section className="bg-navy-900 text-white rounded-xl p-8 sm:p-12 border border-navy-800 shadow-xl space-y-8">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-extrabold uppercase tracking-wider text-peshawar-400">
            Why Peshawar Trusts Us
          </div>
          <h2 className="text-3xl font-black text-white">Built Specifically for Peshawar</h2>
          <p className="text-sm text-navy-300 leading-relaxed">
            Unlike generic nationwide portals, PeshawarRent solves the exact cultural, legal, and
            geographic requirements of tenants and landlords in Khyber Pakhtunkhwa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-navy-950/60 p-6 rounded-lg border border-navy-800 space-y-3">
            <div className="w-10 h-10 rounded-md bg-peshawar-600/30 border border-peshawar-500/40 flex items-center justify-center text-peshawar-400 font-black">
              0%
            </div>
            <h3 className="text-lg font-bold text-white">Zero Broker Commission</h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              Direct connection with property owners. Save up to one full month&apos;s rent
              typically demanded by roadside estate agents.
            </p>
          </div>

          <div className="bg-navy-950/60 p-6 rounded-lg border border-navy-800 space-y-3">
            <div className="w-10 h-10 rounded-md bg-student-border/30 border border-student-border/40 flex items-center justify-center text-student-text font-black">
              <StudentIcon className="w-5 h-5 text-peshawar-300" />
            </div>
            <h3 className="text-lg font-bold text-white">Guaranteed Segregation</h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              Strict eligibility enforcement ensures students find quiet academic housing and
              families enjoy peaceful, private neighbourhoods.
            </p>
          </div>

          <div className="bg-navy-950/60 p-6 rounded-lg border border-navy-800 space-y-3">
            <div className="w-10 h-10 rounded-md bg-peshawar-600/30 border border-peshawar-500/40 flex items-center justify-center text-peshawar-400 font-black">
              <ShieldCheckIcon className="w-5 h-5 text-peshawar-400" />
            </div>
            <h3 className="text-lg font-bold text-white">NADRA CNIC Screening</h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              Every landlord and tenant profile is verified against Pakistani national
              identification standards before booking confirmations.
            </p>
          </div>

          <div className="bg-navy-950/60 p-6 rounded-lg border border-navy-800 space-y-3">
            <div className="w-10 h-10 rounded-md bg-peshawar-600/30 border border-peshawar-500/40 flex items-center justify-center text-peshawar-400 font-black">
              <MapPinIcon className="w-5 h-5 text-peshawar-400" />
            </div>
            <h3 className="text-lg font-bold text-white">100% Peshawar Boundary</h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              Strictly geofenced within 33.90°N–34.15°N, 71.35°E–71.70°E. No irrelevant spam from
              other provinces or distant cities.
            </p>
          </div>

          <div className="bg-navy-950/60 p-6 rounded-lg border border-navy-800 space-y-3">
            <div className="w-10 h-10 rounded-md bg-peshawar-600/30 border border-peshawar-500/40 flex items-center justify-center text-peshawar-400 font-black">
              <CheckIcon className="w-5 h-5 text-peshawar-400" />
            </div>
            <h3 className="text-lg font-bold text-white">KP Tenancy Act Leases</h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              Automated legal tenancy contract generator compliant with KP government police
              registration and rental dispute standards.
            </p>
          </div>

          <div className="bg-navy-950/60 p-6 rounded-lg border border-navy-800 space-y-3">
            <div className="w-10 h-10 rounded-md bg-peshawar-600/30 border border-peshawar-500/40 flex items-center justify-center text-peshawar-400 font-black">
              <ChatIcon className="w-5 h-5 text-peshawar-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Local Concierge Support</h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              Dedicated Peshawar support team fluent in Pashto, Urdu, and English available via
              phone and WhatsApp from 9 AM to 9 PM PKT.
            </p>
          </div>
        </div>
      </section>

      {/* 7. How It Works (4 Interactive Steps) */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-peshawar-700">
            Simple 4-Step Process
          </div>
          <h2 className="text-3xl font-black text-navy-950">How PeshawarRent Works</h2>
          <p className="text-sm text-navy-600">
            From initial search to moving in with a legally valid KP tenancy contract.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-navy-200 shadow-xs relative">
            <div className="text-3xl font-black text-peshawar-600/30 mb-2">01</div>
            <h3 className="text-base font-extrabold text-navy-900 mb-1">Select Identity Mode</h3>
            <p className="text-xs text-navy-600 leading-relaxed">
              Choose Student Mode for single rooms & hostels, or Family Mode for peaceful houses &
              independent portions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-navy-200 shadow-xs relative">
            <div className="text-3xl font-black text-peshawar-600/30 mb-2">02</div>
            <h3 className="text-base font-extrabold text-navy-900 mb-1">
              Filter by Sector & Budget
            </h3>
            <p className="text-xs text-navy-600 leading-relaxed">
              Filter by 15 Peshawar localities, monthly rent PKR range, gas connection, solar
              backup, and parking availability.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-navy-200 shadow-xs relative">
            <div className="text-3xl font-black text-peshawar-600/30 mb-2">03</div>
            <h3 className="text-base font-extrabold text-navy-900 mb-1">
              Connect or Schedule Tour
            </h3>
            <p className="text-xs text-navy-600 leading-relaxed">
              Chat directly with verified property owners or schedule an in-person physical
              walk-through at your convenience.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-navy-200 shadow-xs relative">
            <div className="text-3xl font-black text-peshawar-600/30 mb-2">04</div>
            <h3 className="text-base font-extrabold text-navy-900 mb-1">
              Sign Agreement & Move In
            </h3>
            <p className="text-xs text-navy-600 leading-relaxed">
              Generate standardized KP Tenancy Agreement online, complete police registration, and
              move into your new home securely.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Verified Resident & Landlord Testimonials */}
      <section className="bg-surface-50 border border-navy-200 rounded-xl p-8 sm:p-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-peshawar-700">
            Community Voices
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-navy-950">
            Trusted by Peshawar Residents
          </h2>
          <p className="text-sm text-navy-600">
            Real feedback from verified students, families, and property owners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-navy-200 shadow-xs space-y-4">
            <div className="flex items-center gap-1 text-peshawar-600">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 fill-peshawar-600" />
              ))}
            </div>
            <p className="text-xs text-navy-700 leading-relaxed italic">
              &quot;Finding a single room near UET Peshawar used to take weeks of walking through
              Tehkal and University Town with unhelpful brokers. On PeshawarRent, I found an audited
              room with solar backup in 2 days.&quot;
            </p>
            <div className="border-t border-navy-100 pt-3">
              <div className="text-sm font-bold text-navy-950">Ahmad Khan</div>
              <div className="text-xs text-navy-500">UET Peshawar Engineering Student</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-navy-200 shadow-xs space-y-4">
            <div className="flex items-center gap-1 text-peshawar-600">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 fill-peshawar-600" />
              ))}
            </div>
            <p className="text-xs text-navy-700 leading-relaxed italic">
              &quot;The strict Family Mode filter gave my family total peace of mind. We secured an
              upper portion in Hayatabad Phase 3 with dedicated gas and parking directly from the
              owner without paying 40,000 PKR broker fee.&quot;
            </p>
            <div className="border-t border-navy-100 pt-3">
              <div className="text-sm font-bold text-navy-950">Dr. Tariq Shah</div>
              <div className="text-xs text-navy-500">Hayatabad Phase 3 Family Resident</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-navy-200 shadow-xs space-y-4">
            <div className="flex items-center gap-1 text-peshawar-600">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 fill-peshawar-600" />
              ))}
            </div>
            <p className="text-xs text-navy-700 leading-relaxed italic">
              &quot;I listed my two rental houses in University Town and Regi Model Town. The NADRA
              CNIC verification filtered out time-wasters. I rented both within a week to
              respectable tenants with full KP tenancy documentation.&quot;
            </p>
            <div className="border-t border-navy-100 pt-3">
              <div className="text-sm font-bold text-navy-950">Haji Younas Afridi</div>
              <div className="text-xs text-navy-500">Peshawar Landlord & Property Owner</div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Landlord Direct Call-to-Action Banner */}
      <section className="bg-gradient-to-r from-peshawar-800 to-peshawar-700 text-white rounded-xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-peshawar-900/40 text-peshawar-200 text-xs font-bold uppercase tracking-wider border border-peshawar-600">
            For Peshawar Landlords & Property Owners
          </div>
          <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white">
            Rent Your Property in 72 Hours — 100% Free
          </h2>
          <p className="text-xs sm:text-sm text-peshawar-100 leading-relaxed">
            Zero listing fees. Get direct calls from verified families and university students.
            Standardized KP tenancy legal agreements included at no cost.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
          <Link
            href="/for-landlords"
            className="px-6 py-3.5 bg-white text-peshawar-900 hover:bg-navy-50 rounded-md font-bold text-sm text-center shadow-md transition"
          >
            Post Property Free
          </Link>
          <Link
            href="/services"
            className="px-6 py-3.5 bg-peshawar-900/60 hover:bg-peshawar-900 text-white rounded-md font-bold text-sm text-center border border-peshawar-500 transition"
          >
            View Landlord Suite
          </Link>
        </div>
      </section>

      {/* 10. Frequently Asked Questions (Interactive Accordion) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-peshawar-700">
            Got Questions?
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-navy-950">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-navy-600">
            Everything you need to know about renting homes and hostels in Peshawar.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-lg border border-navy-200 overflow-hidden transition-all duration-200 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-navy-950 hover:bg-navy-50/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peshawar-500"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base">{faq.question}</span>
                  <span className="text-xl font-bold text-peshawar-700 flex-shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-navy-600 leading-relaxed border-t border-navy-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. Peshawar Locality Map Preview */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-navy-100 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-peshawar-700">
              Interactive Geofence
            </div>
            <h2 className="text-2xl font-black text-navy-950">Peshawar Municipal Grid</h2>
            <p className="text-xs sm:text-sm text-navy-600">
              Explore property locations mapped within Peshawar&apos;s verified municipal perimeter.
            </p>
          </div>
          <Link
            href={`/properties?tenantType=${tenantType}`}
            className="text-sm font-bold text-peshawar-700 hover:underline inline-flex items-center gap-1"
          >
            <span>Open Full Interactive Map</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

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
