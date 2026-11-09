'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { loginUser } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginUser(emailOrPhone.trim(), password);
      if (data?.accessToken && data?.user) {
        login(data.accessToken, data.user);
        router.push('/properties');
      } else {
        setError('Login succeeded but session data was incomplete.');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-m3-lg border border-navy-100 p-8 shadow-md space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-m3-md bg-peshawar-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md">
            PR
          </div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight pt-2">
            Sign In to Peshawar Rentals
          </h1>
          <p className="text-xs text-navy-500">
            Enter your credentials to access verified properties & inquiries.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-m3-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
              Email Address or Phone Number
            </label>
            <input
              type="text"
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="e.g. student@example.com or +923001234567"
              className="w-full text-sm p-3 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-peshawar-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm p-3 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-sm rounded-m3-md shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-4 border-t border-navy-100 text-center text-xs text-navy-600">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="font-bold text-peshawar-700 hover:underline">
            Register as Tenant
          </Link>
        </div>
      </div>
    </main>
  );
}
