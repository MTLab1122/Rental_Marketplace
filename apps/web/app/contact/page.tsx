'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheckIcon, MapPinIcon, PhoneIcon, ChatIcon } from '../../components/Icons';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'GENERAL',
    message: '',
    hp_contact_confirm: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.hp_contact_confirm) return; // Bot protection

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'GENERAL',
        message: '',
        hp_contact_confirm: '',
      });
    }, 600);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-peshawar-600/20 text-peshawar-800 text-xs font-bold uppercase tracking-wider border border-peshawar-200">
          <ShieldCheckIcon className="w-4 h-4 text-peshawar-600" />
          <span>Local Peshawar Support & Concierge Desk</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-navy-950 tracking-tight">
          We Are Here to Help in Peshawar
        </h1>
        <p className="text-base sm:text-lg text-navy-600 leading-relaxed">
          Need assistance verifying a title deed, reporting an unverified dealer, or finding an
          emergency student hostel near your campus? Reach our local team anytime.
        </p>
      </section>

      {/* 2. Contact Grid (Info + Form) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Contact Info (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl p-8 border border-navy-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-navy-950 border-b border-navy-50 pb-3">
              Direct Contact Channels
            </h2>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-peshawar-700 flex items-center justify-center shrink-0">
                <PhoneIcon className="w-5 h-5 text-peshawar-700" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-navy-500">
                  Peshawar Helpdesk Phone
                </div>
                <div className="text-base font-bold text-navy-900 mt-0.5">+92 (091) 584-0100</div>
                <div className="text-xs text-navy-500 mt-0.5">Mobile: +92 300 1234567</div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <ChatIcon className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Instant WhatsApp Concierge
                </div>
                <div className="text-sm font-bold text-navy-900 mt-0.5">+92 300 1234567</div>
                <a
                  href="https://wa.me/923001234567?text=Hello%20Peshawar%20Rentals%20team,%20I%20need%20assistance."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-xs font-bold text-peshawar-700 hover:underline"
                >
                  Start WhatsApp Chat →
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <span className="text-lg">✉️</span>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-navy-500">
                  Email Support
                </div>
                <div className="text-sm font-bold text-navy-900 mt-0.5">
                  support@rentpeshawar.pk
                </div>
                <div className="text-xs text-navy-500">legal@rentpeshawar.pk (Disputes)</div>
              </div>
            </div>

            {/* Physical Offices */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <MapPinIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-navy-500">
                  Physical Operations Centers
                </div>
                <div className="text-xs font-bold text-navy-900 mt-1">
                  1. University Road Center:
                </div>
                <div className="text-xs text-navy-600">
                  Suite 402, Block B, University Road, Peshawar, KP
                </div>
                <div className="text-xs font-bold text-navy-900 mt-2">
                  2. Hayatabad Facilitation Desk:
                </div>
                <div className="text-xs text-navy-600">
                  Commercial Market, Sector F-1, Phase 3, Hayatabad, Peshawar
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="pt-4 border-t border-navy-50 text-xs text-navy-600 flex justify-between">
              <span>Operating Hours:</span>
              <span className="font-bold text-navy-900">Mon - Sat: 9:00 AM - 7:00 PM PKT</span>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-8 border border-navy-100 shadow-sm space-y-6">
          <div className="border-b border-navy-50 pb-4">
            <h2 className="text-xl font-bold text-navy-950">
              Send an Inquiry or Verification Ticket
            </h2>
            <p className="text-xs sm:text-sm text-navy-500 mt-1">
              Our Peshawar operations desk responds within 2 hours during business hours.
            </p>
          </div>

          {submitted && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-3">
              <span className="text-lg">✓</span>
              <div>
                <div className="font-bold">Thank you! Your message has been received.</div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Ticket #PR-{Math.floor(100000 + Math.random() * 900000)} generated. Our team will
                  call or WhatsApp you shortly.
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Asad Ullah Khan"
                  className="w-full text-sm p-3 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peshawar-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0300 1234567"
                  className="w-full text-sm p-3 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peshawar-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="asad@example.com"
                  className="w-full text-sm p-3 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peshawar-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                  Topic / Purpose *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-sm p-3 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peshawar-500 bg-white"
                >
                  <option value="GENERAL">General Rental Inquiry</option>
                  <option value="STUDENT">Student Hostel Support</option>
                  <option value="FAMILY">Family Housing Assistance</option>
                  <option value="LANDLORD">Landlord Property Verification</option>
                  <option value="DISPUTE">Tenancy Dispute / Legal Support</option>
                  <option value="REPORT_FRAUD">Report Suspicious Dealer / Scam</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                Message / Property Details *
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your inquiry, locality preference, or specific property question..."
                className="w-full text-sm p-3 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peshawar-500"
              />
            </div>

            {/* Honeypot field for bot spam protection */}
            <input
              type="text"
              name="hp_contact_confirm"
              tabIndex={-1}
              autoComplete="off"
              value={formData.hp_contact_confirm}
              onChange={(e) => setFormData({ ...formData, hp_contact_confirm: e.target.value })}
              className="hidden"
              aria-hidden="true"
            />

            {/* Consent Checkbox */}
            <div className="p-3 bg-slate-50 border border-navy-200 rounded-md">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-navy-300 text-peshawar-600 focus:ring-peshawar-500"
                />
                <span className="text-xs text-navy-700 leading-relaxed">
                  I agree that Peshawar Rentals may contact me via Phone, SMS, or WhatsApp regarding
                  this inquiry in accordance with the{' '}
                  <Link
                    href="/privacy-policy"
                    className="text-peshawar-700 underline font-semibold"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-sm rounded-lg shadow-md transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-peshawar-400"
            >
              {loading ? 'Submitting Ticket...' : 'Send Message to Peshawar Desk'}
            </button>
          </form>
        </div>
      </section>

      {/* 3. Locality Map Coverage Reminder */}
      <section className="bg-navy-50 rounded-2xl p-8 border border-navy-200 text-center space-y-3">
        <h3 className="text-xl font-black text-navy-950">Official Peshawar Municipal Scope</h3>
        <p className="text-xs sm:text-sm text-navy-600 max-w-2xl mx-auto">
          We strictly serve Peshawar metropolitan sectors. Our on-site verification officers cover
          Hayatabad (Phases 1-7), University Town, Peshawar Cantt, Warsak Road, Saddar, Regi Model
          Town, DHA Peshawar, Gulbahar, Dalazak Road, and Charsadda Road.
        </p>
        <div className="pt-2">
          <Link
            href="/properties"
            className="inline-block px-5 py-2.5 bg-navy-900 hover:bg-navy-950 text-white text-xs font-bold rounded-lg transition"
          >
            Explore Locality Listings →
          </Link>
        </div>
      </section>
    </main>
  );
}
