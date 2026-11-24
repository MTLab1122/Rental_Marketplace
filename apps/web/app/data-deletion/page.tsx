'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheckIcon, CheckIcon } from '../../components/Icons';

export default function DataDeletionPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    emailOrPhone: '',
    cnicNumber: '',
    reason: 'ACCOUNT_CLOSURE',
    notes: '',
    confirmed: false,
    hp_data_confirm: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Bot honeypot check
    if (formData.hp_data_confirm) {
      return;
    }

    if (!formData.confirmed) {
      alert('Please confirm that you understand account data deletion is irreversible.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setTicketId(`DEL-${Math.floor(100000 + Math.random() * 900000)}`);
      setSubmitted(true);
      setFormData({
        fullName: '',
        emailOrPhone: '',
        cnicNumber: '',
        reason: 'ACCOUNT_CLOSURE',
        notes: '',
        confirmed: false,
        hp_data_confirm: '',
      });
    }, 600);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-navy-900">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-navy-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span>/</span>
        <Link href="/privacy-policy" className="hover:text-emerald-700">
          Privacy Policy
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold">Data Deletion Request</span>
      </nav>

      <header className="border-b border-navy-200 pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-peshawar-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
          <ShieldCheckIcon className="w-4 h-4 text-peshawar-600" />
          <span>KP Personal Data Protection Compliance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-navy-950">
          Personal Data Deletion Request
        </h1>
        <p className="text-xs sm:text-sm text-navy-600 leading-relaxed">
          Submit an official request to purge your account credentials, uploaded verification
          documents, message archives, and inquiry histories from Peshawar Rentals.
        </p>
      </header>

      {/* Information Box */}
      <section className="bg-navy-50 border border-navy-200 rounded-lg p-6 space-y-3 text-xs sm:text-sm text-navy-800">
        <h2 className="font-bold text-navy-950 text-base">
          What Happens When You Request Deletion?
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-navy-700">
          <li>
            <strong>Authentication Data:</strong> Your login credentials, hashed passwords, and
            active session tokens will be immediately revoked and purged.
          </li>
          <li>
            <strong>Verification Scans:</strong> Uploaded CNIC copies, university student
            verification letters, and property registry documents will be permanently scrubbed from
            encrypted storage.
          </li>
          <li>
            <strong>Activity Records:</strong> Saved properties, search alerts, and unaccepted
            inquiries will be deleted.
          </li>
          <li>
            <strong>Statutory Tenancy Retention:</strong> If you are party to an active signed KP
            Tenancy Agreement, legal records must be maintained for 90 days following lease
            expiration to comply with Khyber Pakhtunkhwa Police station registration laws.
          </li>
        </ul>
      </section>

      {submitted ? (
        <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xl font-bold">
            <CheckIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-emerald-950">Data Deletion Request Received</h2>
          <p className="text-xs sm:text-sm text-emerald-800 max-w-lg mx-auto leading-relaxed">
            Your formal request has been queued under Reference ID{' '}
            <strong className="font-mono text-emerald-950">{ticketId}</strong>. Our data governance
            officer will verify your identity and finalize complete purging within 7 business days
            in compliance with Pakistani data protection regulations.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-md shadow-xs transition"
            >
              Return to Marketplace Home
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-navy-200 p-8 shadow-xs space-y-6"
        >
          {/* Honeypot */}
          <input
            type="text"
            name="hp_data_confirm"
            tabIndex={-1}
            autoComplete="off"
            value={formData.hp_data_confirm}
            onChange={(e) => setFormData({ ...formData, hp_data_confirm: e.target.value })}
            className="hidden"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="del_fullName"
                className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1"
              >
                Full Legal Name *
              </label>
              <input
                id="del_fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="As stated on your NADRA CNIC"
                className="w-full text-sm p-3 border border-navy-200 rounded-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
              />
            </div>

            <div>
              <label
                htmlFor="del_emailOrPhone"
                className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1"
              >
                Registered Email or Phone *
              </label>
              <input
                id="del_emailOrPhone"
                type="text"
                required
                value={formData.emailOrPhone}
                onChange={(e) => setFormData({ ...formData, emailOrPhone: e.target.value })}
                placeholder="e.g. 03001234567 or user@example.pk"
                className="w-full text-sm p-3 border border-navy-200 rounded-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="del_cnic"
                className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1"
              >
                NADRA CNIC Number *
              </label>
              <input
                id="del_cnic"
                type="text"
                required
                value={formData.cnicNumber}
                onChange={(e) => setFormData({ ...formData, cnicNumber: e.target.value })}
                placeholder="17301-XXXXXXX-X (Required for identity matching)"
                className="w-full text-sm p-3 border border-navy-200 rounded-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
              />
            </div>

            <div>
              <label
                htmlFor="del_reason"
                className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1"
              >
                Primary Reason *
              </label>
              <select
                id="del_reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full text-sm p-3 border border-navy-200 rounded-md focus:outline-none focus:ring-2 focus:ring-peshawar-500 bg-white"
              >
                <option value="ACCOUNT_CLOSURE">Closing Account / No Longer Renting</option>
                <option value="RELOCATION">Relocated Outside Peshawar</option>
                <option value="PRIVACY_CONCERN">
                  General Privacy & Data Protection Preference
                </option>
                <option value="DUPLICATE">Accidental Duplicate Account</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="del_notes"
              className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1"
            >
              Additional Details / Comments (Optional)
            </label>
            <textarea
              id="del_notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any specific listings, documents, or details you wish to specify..."
              className="w-full text-sm p-3 border border-navy-200 rounded-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
            />
          </div>

          {/* Form Consent Checkbox */}
          <div className="p-4 bg-slate-50 border border-navy-200 rounded-md">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={formData.confirmed}
                onChange={(e) => setFormData({ ...formData, confirmed: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-navy-300 text-peshawar-600 focus:ring-peshawar-500"
              />
              <span className="text-xs text-navy-700 leading-relaxed">
                I confirm that I am the authorized holder of the specified account and CNIC. I
                understand that submitting this request will permanently remove my profile, verified
                badges, and history from Peshawar Rentals, and cannot be undone.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-navy-100">
            <Link
              href="/privacy-policy"
              className="text-xs font-semibold text-navy-600 hover:text-peshawar-700 transition"
            >
              ← Back to Privacy Policy
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-md shadow-sm transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-400"
            >
              {loading ? 'Submitting Request...' : 'Submit Permanent Deletion Request'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
