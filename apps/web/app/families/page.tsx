'use client';

import React from 'react';
import Link from 'next/link';

export default function FamiliesPage() {
  const familyLocalities = [
    {
      name: 'Hayatabad Phases 1 - 7',
      highlights: 'Gated streets, Tatara Park, Hayatabad Medical Complex, top private schools.',
      avgRent: 'PKR 40,000 - 85,000',
      href: '/properties?category=FAMILY&locality=Hayatabad%20Phase%203',
      tag: 'Premier Family Living',
    },
    {
      name: 'University Town',
      highlights: 'Spacious lawns, tree-lined avenues, elite clinics, quiet residential setting.',
      avgRent: 'PKR 60,000 - 150,000',
      href: '/properties?category=FAMILY&locality=University%20Town',
      tag: 'High-End Peace',
    },
    {
      name: 'Regi Model Town (RMT)',
      highlights: 'Modern new constructions, wide roads, affordable spacious independent portions.',
      avgRent: 'PKR 28,000 - 55,000',
      href: '/properties?category=FAMILY&locality=Regi%20Model%20Town',
      tag: 'New & Affordable',
    },
    {
      name: 'DHA Peshawar & Warsak Road',
      highlights:
        'Modern security infrastructure, serene environment, direct highway connectivity.',
      avgRent: 'PKR 45,000 - 90,000',
      href: '/properties?category=FAMILY&locality=Warsak%20Road',
      tag: 'Rapidly Growing',
    },
  ];

  const familyGuarantees = [
    {
      title: 'Separate Sub-Meter or Independent Wapda Meter',
      description:
        'Never argue over split electricity bills. We verify meter independence for every listed upper and lower portion.',
      icon: '',
    },
    {
      title: 'Verified Water Supply & Dedicated Tank',
      description:
        'Confirmed tube-well schedule, overhead water storage tank capacity, and municipal supply reliability.',
      icon: '',
    },
    {
      title: 'Strict Family-Only Buildings',
      description:
        'No commercial disruption or mixed bachelor tenancies in the same staircase without your advance agreement.',
      icon: '',
    },
    {
      title: 'Legally Valid KP Tenancy Leases',
      description:
        'Police registration paperwork support and legally vetted tenancy contracts to protect your family security.',
      icon: '',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Family Hero Header */}
      <div className="bg-gradient-to-br from-family-bg via-rose-50 to-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-family-border">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-100 text-rose-900 text-xs font-extrabold uppercase tracking-wider mb-4 border border-rose-200">
              Peshawar Family Residential Portal
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-navy-950 tracking-tight leading-tight">
              Rent Verified Family Portions & Houses Across Peshawar
            </h1>
            <p className="mt-4 text-lg text-navy-700 leading-relaxed">
              Find safe upper/lower portions and independent homes with dedicated meters, secure
              parking, and clean water supply in Peshawar’s finest family neighborhoods.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <Link
                href="/properties?category=FAMILY"
                className="bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition text-sm"
              >
                Browse Family Portions & Houses →
              </Link>
              <Link
                href="/guides"
                className="bg-white hover:bg-slate-100 text-navy-900 font-bold px-6 py-3.5 rounded-xl border border-slate-300 shadow-sm transition text-sm"
              >
                Read Peshawar Neighborhood Guide
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Family Neighborhoods */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-navy-950">
            Top Peshawar Residential Neighborhoods
          </h2>
          <p className="text-navy-600 mt-2 text-sm">
            Carefully selected sectors offering high safety, good parks, and premier schools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {familyLocalities.map((loc, i) => (
            <Link
              key={i}
              href={loc.href}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-peshawar-400 transition group flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[11px] font-bold uppercase mb-3">
                  {loc.tag}
                </span>
                <h3 className="font-bold text-navy-950 text-lg group-hover:text-peshawar-600 transition">
                  {loc.name}
                </h3>
                <p className="text-xs text-navy-600 mt-2 leading-relaxed">{loc.highlights}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700">{loc.avgRent}/mo</span>
                <span className="text-peshawar-600 font-bold text-xs group-hover:translate-x-1 transition">
                  View Portions →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Family Assurances */}
      <div className="bg-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-navy-950">
              What Makes a Home Family-Ready?
            </h2>
            <p className="text-navy-600 mt-2 text-sm">
              We verify these essentials on-site so your family moves in with total confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {familyGuarantees.map((item, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-navy-950 text-base mb-2">{item.title}</h3>
                <p className="text-xs text-navy-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
