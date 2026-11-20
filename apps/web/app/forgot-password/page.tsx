'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate reset request to backend
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 800);
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-m3-lg border border-navy-100 p-8 shadow-md space-y-6">
        <div className="text-center space-y-1">
          <div className="text-3xl mb-1"></div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight">Reset Password</h1>
          <p className="text-xs text-navy-500">
            Enter your registered email address and we&apos;ll send a secure password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="bg-peshawar-50 border border-peshawar-200 text-peshawar-800 p-4 rounded-m3-md text-sm text-center space-y-2">
            <span className="text-2xl block"></span>
            <strong>Reset Link Dispatched</strong>
            <p className="text-xs text-peshawar-600">
              If an account exists for {email}, a recovery link has been sent. Check your inbox.
            </p>
            <div className="pt-2">
              <Link href="/login" className="text-xs font-bold text-peshawar-800 underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-sm p-3 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-sm rounded-m3-md shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Sending Request...' : 'Send Recovery Link'}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-navy-100 text-center text-xs text-navy-600">
          Remembered your password?{' '}
          <Link href="/login" className="font-bold text-peshawar-700 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
