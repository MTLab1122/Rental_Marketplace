'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';

export default function ReferralsPage() {
  const { user, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  // Generate dynamic referral code based on user id or default guest code
  const referralCode = user?.id ? `PESH-${user.id.slice(0, 6).toUpperCase()}` : 'PESH-GUEST2026';
  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `https://rentalpeshawar.pk/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = encodeURIComponent(
    `Looking for a verified flat, hostel, or family portion in Peshawar with 0% dealer commission? Sign up with my link and get PKR 500 rent credit: ${referralLink}`,
  );

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            🎁 Peshawar Community Referral Program
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950">
            Invite Friends & Landlords, Earn Real Rewards
          </h1>
          <p className="mt-3 text-navy-600 text-sm max-w-xl mx-auto">
            Help Peshawar students and families find verified homes with zero broker commissions.
            Earn mobile balance or free featured listing boosts for every successful referral.
          </p>
        </div>

        {/* Share Box */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-navy-400 uppercase tracking-wider">
                Your Personal Referral Code
              </p>
              <p className="text-2xl font-extrabold text-peshawar-600 tracking-wider font-mono mt-0.5">
                {referralCode}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-800 font-bold text-xs rounded-xl transition"
              >
                {copied ? '✓ Link Copied!' : '📋 Copy Link'}
              </button>
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
              >
                Share on WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-navy-600 truncate mr-2 font-mono">{referralLink}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-peshawar-600 font-bold hover:underline shrink-0"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Reward Tiers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-xl font-bold mb-4">
              🎓
            </div>
            <h3 className="font-bold text-navy-950 text-base mb-1">
              Refer a Student or Family Tenant
            </h3>
            <p className="text-xs text-navy-600 mb-4">
              When your referred friend completes their CNIC verification and submits their first
              accepted inquiry or booking.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs font-bold text-blue-900">
              Reward: PKR 500 EasyPaisa/JazzCash or Rent Voucher
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-xl font-bold mb-4">
              🏡
            </div>
            <h3 className="font-bold text-navy-950 text-base mb-1">Refer a Property Landlord</h3>
            <p className="text-xs text-navy-600 mb-4">
              When a Peshawar landlord signs up with your link and their first listing is verified
              and approved by our team.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-bold text-amber-900">
              Reward: 1 Free Featured Boost (Worth PKR 1,500) or PKR 1,000 Cash
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-10">
          <h3 className="font-bold text-navy-950 text-sm mb-4">Your Referral Performance</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-extrabold text-navy-950">
                {isAuthenticated ? '0' : '-'}
              </div>
              <div className="text-[11px] font-semibold text-navy-500 uppercase mt-1">
                Friends Joined
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-extrabold text-emerald-600">
                {isAuthenticated ? '0' : '-'}
              </div>
              <div className="text-[11px] font-semibold text-navy-500 uppercase mt-1">
                Verified & Active
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-extrabold text-peshawar-600">
                {isAuthenticated ? 'PKR 0' : '-'}
              </div>
              <div className="text-[11px] font-semibold text-navy-500 uppercase mt-1">
                Earned Rewards
              </div>
            </div>
          </div>
          {!isAuthenticated && (
            <p className="text-xs text-center text-navy-500 mt-4">
              Please{' '}
              <a href="/login" className="text-peshawar-600 font-bold underline">
                sign in
              </a>{' '}
              to track your referral rewards.
            </p>
          )}
        </div>

        {/* Anti-Fraud Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
          <p className="font-bold mb-1">⚖️ Referral Terms & Anti-Abuse Integrity</p>
          <p>
            Self-referrals, duplicate accounts on the same device or IP subnet, and artificial
            listings are flagged automatically by our fraud detection engine. Rewards are
            distributed upon verified municipal approval and authentic tenant occupancy.
          </p>
        </div>
      </div>
    </div>
  );
}
