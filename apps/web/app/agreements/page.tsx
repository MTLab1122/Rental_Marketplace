'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheckIcon, CheckIcon } from '../../components/Icons';

interface AgreementSummary {
  id: string;
  propertyTitle: string;
  locality: string;
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate: string;
  status: 'PENDING_SIGNATURE' | 'ACTIVE' | 'TERMINATED';
  landlordName: string;
  landlordPhone: string;
}

const SAMPLE_AGREEMENTS: AgreementSummary[] = [
  {
    id: 'agr-hayatabad-101',
    propertyTitle: 'Executive 3-Bed Upper Portion (Hayatabad Phase 3)',
    locality: 'Hayatabad Phase 3',
    monthlyRent: 42000,
    securityDeposit: 84000,
    startDate: '2026-12-01',
    endDate: '2027-11-30',
    status: 'ACTIVE',
    landlordName: 'Haji Younas Afridi',
    landlordPhone: '+92 300 9876543',
  },
  {
    id: 'agr-univ-town-204',
    propertyTitle: 'Private Academic Studio Room with Solar Backup',
    locality: 'University Town',
    monthlyRent: 18500,
    securityDeposit: 25000,
    startDate: '2026-12-15',
    endDate: '2027-06-30',
    status: 'PENDING_SIGNATURE',
    landlordName: 'Malik Jahangir Khan',
    landlordPhone: '+92 312 3456789',
  },
];

export default function AgreementsPage() {
  const [agreements] = useState<AgreementSummary[]>(SAMPLE_AGREEMENTS);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-navy-950 text-white rounded-xl p-6 sm:p-10 border border-navy-800 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-peshawar-600/30 text-peshawar-300 text-xs font-bold uppercase tracking-wider border border-peshawar-500/50">
          <ShieldCheckIcon className="w-4 h-4 text-peshawar-400" />
          <span>KP Tenancy Act 2014 Compliant Contracts</span>
        </div>
        <h1 className="text-3xl font-black text-white">Residential Lease Agreements</h1>
        <p className="text-sm text-navy-200 max-w-2xl leading-relaxed">
          Manage your legally binding tenancy contracts. All agreements are signed with SHA-256
          digital audit trails, compliant with Khyber Pakhtunkhwa Police station registration
          requirements and local conciliation courts.
        </p>
      </div>

      {/* 2. Agreements List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-navy-950">
            Your Tenancy Records ({agreements.length})
          </h2>
          <Link href="/disputes" className="text-xs font-bold text-peshawar-700 hover:underline">
            Report Lease Issue / Dispute →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {agreements.map((agr) => (
            <div
              key={agr.id}
              className="bg-white rounded-lg border border-navy-200 p-6 shadow-xs hover:border-peshawar-400 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-navy-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-navy-500">{agr.id}</span>
                    <span
                      className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded border ${
                        agr.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {agr.status === 'ACTIVE' ? 'Active & Registered' : 'Pending Signature'}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-navy-950">{agr.propertyTitle}</h3>
                  <p className="text-xs text-navy-500">
                    {agr.locality} • Landlord: {agr.landlordName}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xl font-black text-navy-950">
                    PKR {agr.monthlyRent.toLocaleString()}
                    <span className="text-xs font-normal text-navy-500"> / month</span>
                  </div>
                  <div className="text-xs text-navy-500">
                    Deposit: PKR {agr.securityDeposit.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-navy-700">
                <div>
                  <div className="font-semibold text-navy-400">Term Start</div>
                  <div className="font-bold text-navy-900">{agr.startDate}</div>
                </div>
                <div>
                  <div className="font-semibold text-navy-400">Term End</div>
                  <div className="font-bold text-navy-900">{agr.endDate}</div>
                </div>
                <div>
                  <div className="font-semibold text-navy-400">Police Verification</div>
                  <div className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckIcon className="w-3.5 h-3.5" /> Filed & Cleared
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-navy-400">Landlord Contact</div>
                  <div className="font-bold text-navy-900">{agr.landlordPhone}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-navy-100">
                <div className="text-xs text-navy-500">
                  Complies with KP Tenancy Act Form-A standard template
                </div>
                <div className="flex items-center gap-3">
                  {agr.status === 'PENDING_SIGNATURE' ? (
                    <Link
                      href={`/agreements/${agr.id}/sign`}
                      className="px-4 py-2 bg-peshawar-600 hover:bg-peshawar-700 text-white font-bold text-xs rounded-md shadow-xs transition"
                    >
                      Review & Sign Digital Lease →
                    </Link>
                  ) : (
                    <Link
                      href={`/agreements/${agr.id}/sign`}
                      className="px-4 py-2 bg-navy-50 hover:bg-navy-100 text-navy-800 font-bold text-xs rounded-md border border-navy-200 transition"
                    >
                      View Signed Agreement
                    </Link>
                  )}
                  <Link
                    href="/disputes"
                    className="px-3 py-2 text-xs font-semibold text-navy-600 hover:text-red-700 transition"
                  >
                    Raise Dispute
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Legal Information Box */}
      <div className="bg-slate-50 border border-navy-200 rounded-lg p-6 space-y-3">
        <h4 className="text-sm font-bold text-navy-900">
          Khyber Pakhtunkhwa Tenancy & Police Registration Notice
        </h4>
        <p className="text-xs text-navy-600 leading-relaxed">
          Under the Khyber Pakhtunkhwa Restriction of Rented Buildings (Security) Act 2014, all
          tenancy agreements in Peshawar must be registered with the local area Police Station
          within 14 days of tenant occupancy. PeshawarRent automatically submits digital Form-A
          notifications to the relevant municipal police station upon mutual digital signing.
        </p>
      </div>
    </main>
  );
}
