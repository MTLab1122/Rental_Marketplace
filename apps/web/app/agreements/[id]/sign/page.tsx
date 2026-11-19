'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getAgreementById, signAgreement } from '../../../../lib/api';

export default function SignAgreementPage() {
  const params = useParams();
  const agreementId = params['id'] as string;

  const [agreement, setAgreement] = useState<any>(null);
  const [signatureName, setSignatureName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agreementId) {
      loadAgreement();
    }
  }, [agreementId]);

  const loadAgreement = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const data = await getAgreementById(agreementId, token);
      setAgreement(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load agreement');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !signatureName.trim()) {
      setError('Please acknowledge the terms and enter your full legal name as digital signature.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      await signAgreement(agreementId, { signatureData: signatureName.trim() }, token);
      alert('Agreement signed successfully with SHA-256 digital audit record!');
      await loadAgreement();
    } catch (err: any) {
      setError(err.message || 'Signing failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500">
        Loading agreement terms...
      </div>
    );
  }

  if (error && !agreement) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {agreement.title || 'Digital Tenancy Agreement'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Governed by Khyber Pakhtunkhwa Tenancy Regulations • Version {agreement.version}
          </p>
        </div>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-bold text-xs rounded-full self-start">
          {agreement.status}
        </span>
      </div>

      {error && (
        <div className="my-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Agreement Terms Render */}
      <div className="my-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-h-[500px] overflow-y-auto prose prose-slate">
        <div dangerouslySetInnerHTML={{ __html: agreement.termsHtml }} />
      </div>

      {/* Signature Audit Trail */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-3">
          Electronic Signatures & Audit Trail
        </h2>
        {agreement.signatures && agreement.signatures.length > 0 ? (
          <div className="space-y-3">
            {agreement.signatures.map((sig: any) => (
              <div key={sig.id} className="bg-white p-4 rounded-lg border border-slate-200 text-sm">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>
                    {sig.signerName} ({sig.signerRole})
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(sig.signedAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-xs font-mono text-slate-500 break-all">
                  SHA-256 Audit Hash: {sig.signatureHash}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No signatures recorded yet. Be the first to execute this agreement.
          </p>
        )}
      </div>

      {/* Sign Form */}
      {agreement.status !== 'ACTIVE' && (
        <form
          onSubmit={handleSign}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-slate-900">Execute Digital Tenancy Agreement</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Your Full Legal Name (As Digital Signature)
            </label>
            <input
              type="text"
              required
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="e.g. Ahmad Khan"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-700">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span>
              I have read, understood, and agree to the tenancy terms, Peshawar locality rules,
              payment covenants, and security deposit guidelines. I understand this digital
              signature creates an immutable audit trail with my IP address and timestamp.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !agreed}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
          >
            {submitting ? 'Generating Digital Signature...' : 'Sign Tenancy Agreement'}
          </button>
        </form>
      )}
    </div>
  );
}
