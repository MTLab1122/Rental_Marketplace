'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.push('/login'), 2000);
    }, 800);
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-m3-lg border border-navy-100 p-8 shadow-md space-y-6">
        <div className="text-center space-y-1">
          <div className="text-3xl mb-1"></div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight">Set New Password</h1>
          <p className="text-xs text-navy-500">
            Create a secure password with at least 8 characters.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-m3-sm border border-red-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-peshawar-50 border border-peshawar-200 text-peshawar-800 p-4 rounded-m3-md text-sm text-center">
            <span className="text-2xl block mb-1"></span>
            <strong>Password Reset Successful!</strong>
            <p className="text-xs text-peshawar-600 mt-1">Redirecting you to sign in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm p-3 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm p-3 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-sm rounded-m3-md shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-navy-100 text-center text-xs text-navy-600">
          <Link href="/login" className="font-bold text-peshawar-700 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
