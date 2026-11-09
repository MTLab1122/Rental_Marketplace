'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { TenantType } from '@rental-peshawar/shared-types';
import EmptyState from '../../components/EmptyState';

export default function ProfilePage() {
  const router = useRouter();
  const { user, tenantType, setTenantType, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon="🔒"
          title="Sign in to View Your Profile"
          description="Access your account details, discovery preferences, and verification status."
          actionText="Sign In"
          actionHref="/login"
        />
      </main>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-navy-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
          Tenant Account & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-navy-500 mt-1">
          Manage your personal details and Peshawar rental discovery settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="bg-white p-6 rounded-m3-lg border border-navy-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-peshawar-600 text-white font-black text-2xl flex items-center justify-center">
            {user.fullName ? user.fullName[0]?.toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-black text-navy-900">{user.fullName}</h2>
            <p className="text-xs text-navy-500">{user.email}</p>
            {user.phoneNumber && <p className="text-xs text-navy-400 mt-0.5">{user.phoneNumber}</p>}
          </div>
          <div className="pt-2 border-t border-navy-50">
            <span className="inline-block px-2.5 py-0.5 bg-navy-100 text-navy-800 text-[11px] font-bold rounded-m3-sm uppercase">
              Role: {user.roles?.[0] || 'Tenant'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-m3-md transition"
          >
            Sign Out of Account
          </button>
        </div>

        {/* Discovery Feed Preference Selection */}
        <div className="md:col-span-2 bg-white p-6 rounded-m3-lg border border-navy-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-navy-900 mb-1">Active Discovery Feed Mode</h3>
            <p className="text-xs text-navy-500 leading-relaxed">
              Peshawar Rentals operates strictly under non-overlapping categories. Choose your
              primary tenant identity below to curate all listings, search results, and
              recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Mode Option */}
            <div
              onClick={() => setTenantType(TenantType.STUDENT)}
              className={`p-4 rounded-m3-md border-2 cursor-pointer transition ${
                tenantType === TenantType.STUDENT
                  ? 'bg-student-bg/30 border-student-border shadow-xs'
                  : 'bg-white border-navy-200 hover:border-navy-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-navy-900">🎓 Student Portal</span>
                {tenantType === TenantType.STUDENT && (
                  <span className="text-student-text text-xs font-black">✓ Active</span>
                )}
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                Hostels, bachelor studio apartments, single and shared rooms near universities.
              </p>
            </div>

            {/* Family Mode Option */}
            <div
              onClick={() => setTenantType(TenantType.FAMILY)}
              className={`p-4 rounded-m3-md border-2 cursor-pointer transition ${
                tenantType === TenantType.FAMILY
                  ? 'bg-family-bg/30 border-family-border shadow-xs'
                  : 'bg-white border-navy-200 hover:border-navy-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-navy-900">👨‍👩‍👧‍👦 Family Portal</span>
                {tenantType === TenantType.FAMILY && (
                  <span className="text-family-text text-xs font-black">✓ Active</span>
                )}
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">
                Houses, upper & lower portions, independent residential flats strictly for families.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="pt-4 border-t border-navy-100 flex flex-wrap gap-3 text-xs font-bold text-navy-700">
            <Link
              href="/favorites"
              className="px-3 py-2 bg-navy-50 rounded-m3-sm border border-navy-200 hover:bg-navy-100"
            >
              ❤️ Saved Favorites
            </Link>
            <Link
              href="/inquiries"
              className="px-3 py-2 bg-navy-50 rounded-m3-sm border border-navy-200 hover:bg-navy-100"
            >
              📬 Submitted Inquiries
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
