'use client';

import React, { useState } from 'react';
import { submitReport } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { ReportReason } from '@rental-peshawar/shared-types';

interface ReportModalProps {
  propertyId: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({
  propertyId,
  propertyTitle,
  isOpen,
  onClose,
}: ReportModalProps) {
  const { token, isAuthenticated } = useAuth();
  const [reason, setReason] = useState<ReportReason>(ReportReason.FAKE_LISTING);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitReport(
        {
          targetType: 'PROPERTY',
          targetId: propertyId,
          reason,
          details: details.trim() || undefined,
        },
        token,
      );
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-m3-lg max-w-md w-full p-6 shadow-xl border border-navy-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 text-xl font-bold"
        >
          ✕
        </button>

        <h3 className="text-lg font-black text-navy-900 mb-1">Report Property Listing</h3>
        <p className="text-xs text-navy-500 mb-4 line-clamp-1">
          Reporting: <span className="font-semibold text-navy-800">{propertyTitle}</span>
        </p>

        {success ? (
          <div className="bg-peshawar-50 border border-peshawar-200 text-peshawar-800 p-4 rounded-m3-md text-sm text-center">
            <span className="text-xl block mb-1">🛡️</span>
            <strong>Report Received</strong>
            <p className="text-xs text-peshawar-600 mt-1">
              Our moderation team will investigate this listing according to platform rules.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-m3-sm border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                Reason for Report *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full text-sm p-2.5 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500 bg-white"
                required
              >
                <option value={ReportReason.FAKE_LISTING}>Fake or Fraudulent Listing</option>
                <option value={ReportReason.WRONG_LOCATION}>Incorrect Locality or Location</option>
                <option value={ReportReason.MISLEADING_INFORMATION}>
                  Misleading Rent or Photos
                </option>
                <option value={ReportReason.DISCRIMINATION}>
                  Discrimination or Ineligible Terms
                </option>
                <option value={ReportReason.HARASSMENT}>Harassment by Landlord</option>
                <option value={ReportReason.DUPLICATE_LISTING}>Duplicate Listing</option>
                <option value={ReportReason.UNSAFE_PROPERTY}>Unsafe or Illegal Property</option>
                <option value={ReportReason.OTHER}>Other Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain the issue in detail..."
                className="w-full text-sm p-2.5 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-navy-600 hover:text-navy-900 border border-navy-200 rounded-m3-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-m3-md shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'File Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
