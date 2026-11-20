'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { registerTenant } from '../../lib/api';
import { TenantType } from '@rental-peshawar/shared-types';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [tenantType, setTenantType] = useState<TenantType>(TenantType.STUDENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await registerTenant({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        tenantType,
      });

      if (data?.accessToken && data?.user) {
        login(data.accessToken, data.user);
        router.push('/properties');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white rounded-m3-lg border border-navy-100 p-8 shadow-md space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-m3-md bg-peshawar-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md">
            PR
          </div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight pt-2">
            Create Tenant Account
          </h1>
          <p className="text-xs text-navy-500">
            Join Peshawar’s verified student and family rental portal.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-m3-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tenant Type Selector */}
          <div>
            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-2">
              Select Account Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTenantType(TenantType.STUDENT)}
                className={`p-3 rounded-m3-md border text-left transition ${
                  tenantType === TenantType.STUDENT
                    ? 'bg-student-bg text-student-text border-student-border font-bold shadow-xs'
                    : 'bg-navy-50 text-navy-700 border-navy-200 hover:bg-white'
                }`}
              >
                <div className="text-sm">Student</div>
                <div className="text-[10px] text-navy-500 mt-0.5">Hostels & Rooms</div>
              </button>

              <button
                type="button"
                onClick={() => setTenantType(TenantType.FAMILY)}
                className={`p-3 rounded-m3-md border text-left transition ${
                  tenantType === TenantType.FAMILY
                    ? 'bg-family-bg text-family-text border-family-border font-bold shadow-xs'
                    : 'bg-navy-50 text-navy-700 border-navy-200 hover:bg-white'
                }`}
              >
                <div className="text-sm">Family</div>
                <div className="text-[10px] text-navy-500 mt-0.5">Houses & Portions</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Muhammad Ahmad"
              className="w-full text-sm p-3 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ahmad@uop.edu.pk"
              className="w-full text-sm p-3 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+923001234567"
              className="w-full text-sm p-3 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full text-sm p-3 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-sm rounded-m3-md shadow-md transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="pt-4 border-t border-navy-100 text-center text-xs text-navy-600">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-peshawar-700 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
