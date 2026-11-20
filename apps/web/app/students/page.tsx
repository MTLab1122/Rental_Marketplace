'use client';

import React from 'react';
import Link from 'next/link';

export default function StudentsPage() {
  const universityClusters = [
    {
      name: 'University of Peshawar & Islamia College',
      locality: 'University Town',
      distance: '0.5 - 1.5 km',
      avgRent: 'PKR 8,500 - 16,000/bed',
      tag: 'Academic Core',
      href: '/properties?category=STUDENT&locality=University%20Town',
    },
    {
      name: 'Khyber Medical College (KMC) & HMC',
      locality: 'Hayatabad Phase 4 & 5',
      distance: '1.0 km',
      avgRent: 'PKR 10,000 - 20,000/bed',
      tag: 'Medical Hub',
      href: '/properties?category=STUDENT&locality=Hayatabad%20Phase%204',
    },
    {
      name: 'IM|Sciences & CECOS University',
      locality: 'Hayatabad Phase 7 & Industrial Estate',
      distance: '0.8 km',
      avgRent: 'PKR 9,000 - 18,000/bed',
      tag: 'Management & Tech',
      href: '/properties?category=STUDENT&locality=Hayatabad%20Phase%207',
    },
    {
      name: 'FAST-NUCES & Peshawar Cantt',
      locality: 'Peshawar Cantt & Saddar',
      distance: '1.2 km',
      avgRent: 'PKR 12,000 - 22,000/bed',
      tag: 'Central & Safe',
      href: '/properties?category=STUDENT&locality=Saddar%20Peshawar',
    },
  ];

  const studentFeatures = [
    {
      title: 'Solar & Generator Backup',
      description:
        'Exam season requires uninterrupted study. Filter hostels guaranteed with solar inverters or 24/7 generator backup.',
      icon: '',
    },
    {
      title: 'Hygienic Mess & Meal Plans',
      description:
        'See whether 3-time hot meals (Nashta, Lunch, Dinner) are included in rent, with verified hygiene reviews from fellow students.',
      icon: '',
    },
    {
      title: 'Fast Fiber Wi-Fi',
      description:
        'High-speed internet in every room, tested by verified student residents for lag-free research and online lectures.',
      icon: '',
    },
    {
      title: 'Transparent Curfew & Security',
      description:
        'Clear gate timings, CCTV surveillance, biometric check-in, and verified hostel warden details upfront.',
      icon: '',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Student Hero Header */}
      <div className="bg-gradient-to-br from-student-bg via-blue-50 to-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-student-border">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-100 text-blue-900 text-xs font-extrabold uppercase tracking-wider mb-4 border border-blue-200">
              Peshawar Verified Student Housing Portal
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-navy-950 tracking-tight leading-tight">
              Find Verified Student Hostels & Rooms Near Your Campus
            </h1>
            <p className="mt-4 text-lg text-navy-700 leading-relaxed">
              Explore 100% verified boys and girls student hostels in University Town, Hayatabad,
              and Saddar. Zero broker fee, verified meal plans, and guaranteed solar backup.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <Link
                href="/properties?category=STUDENT"
                className="bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition text-sm"
              >
                Browse All Student Listings →
              </Link>
              <Link
                href="/register?role=TENANT&tenantType=STUDENT"
                className="bg-white hover:bg-slate-100 text-navy-900 font-bold px-6 py-3.5 rounded-xl border border-slate-300 shadow-sm transition text-sm"
              >
                Get Student Verification Badge
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* University Hub Clusters */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-navy-950">
            Top Peshawar University Campus Clusters
          </h2>
          <p className="text-navy-600 mt-2 text-sm">
            Select your university to view walking-distance verified hostels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {universityClusters.map((cluster, i) => (
            <Link
              key={i}
              href={cluster.href}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-peshawar-400 transition group flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-bold uppercase mb-3">
                  {cluster.tag}
                </span>
                <h3 className="font-bold text-navy-950 text-lg group-hover:text-peshawar-600 transition">
                  {cluster.name}
                </h3>
                <p className="text-xs text-navy-500 mt-1 font-medium">
                  {cluster.locality} • {cluster.distance}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700">{cluster.avgRent}</span>
                <span className="text-peshawar-600 font-bold text-xs group-hover:translate-x-1 transition">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* What Matters to Students */}
      <div className="bg-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-navy-950">
              Built for Student Peace of Mind
            </h2>
            <p className="text-navy-600 mt-2 text-sm">
              We strictly audit hostels before listing so you never face surprise fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {studentFeatures.map((feat, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="text-3xl mb-4">{feat.icon}</div>
                <h3 className="font-bold text-navy-950 text-base mb-2">{feat.title}</h3>
                <p className="text-xs text-navy-600 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
