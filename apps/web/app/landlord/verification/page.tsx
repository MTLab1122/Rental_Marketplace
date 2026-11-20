'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLandlordVerification, submitLandlordVerification } from '../../../lib/api';

export default function LandlordVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cnicNumber, setCnicNumber] = useState('');
  const [cnicFrontStorageKey, setCnicFrontStorageKey] = useState('');
  const [cnicBackStorageKey, setCnicBackStorageKey] = useState('');
  const [selfieStorageKey, setSelfieStorageKey] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please sign in as a landlord to access verification.');
        setLoading(false);
        return;
      }
      const res = await getLandlordVerification(token);
      setData(res);
      if (res) {
        setFullName(res.fullName || '');
        setPhoneNumber(res.phoneNumber || '');
        setAddress(res.address || '');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Validate CNIC format (13 digits or standard Pakistani format)
      const cleanCnic = cnicNumber.replace(/\D/g, '');
      if (cleanCnic.length !== 13) {
        setError('CNIC must be exactly 13 digits (e.g. 17301-1234567-1).');
        setSubmitting(false);
        return;
      }

      await submitLandlordVerification(
        {
          fullName,
          phoneNumber,
          cnicNumber: cleanCnic,
          cnicFrontStorageKey: cnicFrontStorageKey || 'mock-cnic-front-key',
          cnicBackStorageKey: cnicBackStorageKey || 'mock-cnic-back-key',
          selfieStorageKey: selfieStorageKey || 'mock-selfie-key',
          address,
        },
        token,
      );

      alert('Verification documents submitted successfully for Peshawar admin review!');
      await loadStatus();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <p className="mt-3">Loading verification profile...</p>
      </div>
    );
  }

  const isVerified = data?.status === 'VERIFIED';
  const isPending = data?.status === 'PENDING';
  const isRejected = data?.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/landlord"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            ← Back to Console Overview
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
            Landlord Identity Verification
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Government CNIC and selfie verification ensures a trusted, fraud-free marketplace for
            Peshawar renters.
          </p>
        </div>

        {/* Current Status Card */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Current Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-bold ${
                    isVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : isPending
                        ? 'bg-amber-100 text-amber-800'
                        : isRejected
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {data?.status || 'UNVERIFIED'}
                </span>
                {data?.cnicNumberMasked && (
                  <span className="font-mono text-xs text-slate-500 font-semibold">
                    CNIC: {data.cnicNumberMasked}
                  </span>
                )}
              </div>
            </div>

            {isVerified && <span className="text-3xl" title="Verified Badge"></span>}
          </div>

          {isVerified && (
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
              Your identity has been verified by Peshawar operations admins. You are eligible to
              publish listings across all Peshawar localities.
            </div>
          )}

          {isPending && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
              Your CNIC and selfie submission is under review by the moderation team. Average
              turnaround is under 24 hours.
            </div>
          )}

          {isRejected && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-800">
              <p className="font-bold">Verification was rejected:</p>
              <p className="mt-1">
                {data?.reviewNotes ||
                  'Document photo was unclear or CNIC expired. Please re-upload.'}
              </p>
              <p className="mt-2 font-medium">You can re-submit your corrected documents below.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Verification Form (only visible if not verified or rejected) */}
        {!isVerified && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-5"
          >
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              {isRejected ? 'Re-Submit Verification Documents' : 'Submit CNIC Documents'}
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                placeholder="Matches CNIC exactly"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                placeholder="+923001234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                CNIC Number (13 Digits) *
              </label>
              <input
                type="text"
                placeholder="17301-1234567-1"
                value={cnicNumber}
                onChange={(e) => setCnicNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Residential / Office Address *
              </label>
              <input
                type="text"
                placeholder="Peshawar address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
                <span className="text-2xl"></span>
                <p className="mt-2 text-xs font-bold text-slate-700">CNIC Front Image</p>
                <input
                  type="text"
                  placeholder="Front Storage Key / URL"
                  value={cnicFrontStorageKey}
                  onChange={(e) => setCnicFrontStorageKey(e.target.value)}
                  className="mt-2 w-full rounded border border-slate-300 p-1.5 text-xs font-mono"
                />
              </div>

              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
                <span className="text-2xl"></span>
                <p className="mt-2 text-xs font-bold text-slate-700">CNIC Back Image</p>
                <input
                  type="text"
                  placeholder="Back Storage Key / URL"
                  value={cnicBackStorageKey}
                  onChange={(e) => setCnicBackStorageKey(e.target.value)}
                  className="mt-2 w-full rounded border border-slate-300 p-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
              <span className="text-2xl"></span>
              <p className="mt-2 text-xs font-bold text-slate-700">Landlord Selfie with CNIC</p>
              <input
                type="text"
                placeholder="Selfie Storage Key / URL"
                value={selfieStorageKey}
                onChange={(e) => setSelfieStorageKey(e.target.value)}
                className="mt-2 w-full rounded border border-slate-300 p-1.5 text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white shadow hover:bg-emerald-700 transition"
            >
              {submitting ? 'Submitting Verification...' : 'Submit Verification for Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
