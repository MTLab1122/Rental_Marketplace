'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchIcon, HouseIcon, MapPinIcon, ArrowRightIcon } from '../components/Icons';

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/properties?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/properties');
    }
  };

  const localities = [
    { name: 'Hayatabad (Phases 1-7)', slug: 'hayatabad' },
    { name: 'University Town & Campus', slug: 'university-town' },
    { name: 'Peshawar Cantt & Saddar', slug: 'peshawar-cantt' },
    { name: 'Warsak Road Enclave', slug: 'warsak-road' },
    { name: 'Regi Model Town (RMT)', slug: 'regi-model-town' },
    { name: 'DHA Peshawar', slug: 'dha-peshawar' },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-10 text-navy-900">
      {/* 404 Visual Indicator */}
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-peshawar-50 border border-peshawar-200 text-peshawar-700 shadow-sm mx-auto">
          <HouseIcon className="w-10 h-10" />
        </div>
        <div className="text-sm font-extrabold text-peshawar-700 uppercase tracking-widest">
          Error 404 • Resource Not Found
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-navy-950 tracking-tight">
          This Peshawar Listing or Page is Unavailable
        </h1>
        <p className="text-sm sm:text-base text-navy-600 max-w-xl mx-auto leading-relaxed">
          The property listing you requested may have been rented, moved, or expired. Peshawar
          Rentals automatically unindexes rented accommodations to ensure zero outdated listings.
        </p>
      </div>

      {/* Quick Search Box */}
      <form
        onSubmit={handleSearch}
        className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-lg border border-navy-200 shadow-sm"
      >
        <div className="flex-1 flex items-center px-3 gap-2 py-2 sm:py-0">
          <SearchIcon className="w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search hostels, portions, or houses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-medium focus:outline-none text-navy-900 placeholder:text-navy-400"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-xs rounded-md shadow-xs transition"
        >
          Search Rentals
        </button>
      </form>

      {/* Direct Action CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs rounded-md shadow-sm transition"
        >
          <span>Browse All Verified Rentals</span>
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-navy-50 text-navy-800 font-bold text-xs rounded-md border border-navy-200 shadow-2xs transition"
        >
          <span>Return to Homepage</span>
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-navy-50 text-navy-800 font-bold text-xs rounded-md border border-navy-200 shadow-2xs transition"
        >
          <span>Contact Support Desk</span>
        </Link>
      </div>

      {/* Popular Localities Shortcuts */}
      <div className="pt-6 border-t border-navy-100 max-w-2xl mx-auto space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-navy-500">
          Popular Peshawar Localities
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {localities.map((loc) => (
            <Link
              key={loc.slug}
              href={`/properties?locality=${loc.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-navy-200 hover:border-peshawar-500 hover:bg-peshawar-50 text-navy-800 text-xs font-semibold rounded-md transition shadow-2xs"
            >
              <MapPinIcon className="w-3.5 h-3.5 text-navy-400" />
              <span>{loc.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
