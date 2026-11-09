'use client';

import React, { useState } from 'react';
import { submitInquiry } from '../lib/api';
import { useAuth } from '../lib/auth-context';

interface InquiryModalProps {
  propertyId: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InquiryModal({
  propertyId,
  propertyTitle,
  isOpen,
  onClose,
  onSuccess,
}: InquiryModalProps) {
  const { token, isAuthenticated } = useAuth();
  const [message, setMessage] = useState(
    'Assalam-o-Alaikum, I am interested in renting this property. Please let me know when I can schedule a visit.',
  );
  const [proposedDate, setProposedDate] = useState('');
  const [preferredContact, setPreferredContact] = useState<'PHONE' | 'WHATSAPP' | 'IN_APP'>(
    'PHONE',
  );
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

    if (message.trim().length < 10) {
      setError('Message must be at least 10 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitInquiry(
        {
          propertyId,
          message: message.trim(),
          proposedMoveInDate: proposedDate || undefined,
        },
        token,
      );
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit inquiry. Please try again.');
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
      <div className="bg-white rounded-m3-lg max-w-lg w-full p-6 shadow-xl border border-navy-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 text-xl font-bold"
        >
          ✕
        </button>

        <h3 className="text-lg font-black text-navy-900 mb-1">Contact Landlord & Submit Inquiry</h3>
        <p className="text-xs text-navy-500 mb-4 line-clamp-1">
          Inquiry regarding: <span className="font-semibold text-navy-800">{propertyTitle}</span>
        </p>

        {success ? (
          <div className="bg-peshawar-50 border border-peshawar-200 text-peshawar-800 p-4 rounded-m3-md text-sm text-center">
            <span className="text-xl block mb-1">🎉</span>
            <strong>Inquiry Submitted!</strong>
            <p className="text-xs text-peshawar-600 mt-1">
              The verified landlord has been notified and will review your request.
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
                Message to Landlord *
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-sm p-3 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500"
                placeholder="Write your introduction, occupancy requirements, or schedule request..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                  Proposed Move-In Date
                </label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full text-sm p-2 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1">
                  Preferred Contact
                </label>
                <select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value as any)}
                  className="w-full text-sm p-2 border border-navy-200 rounded-m3-md focus:outline-none focus:ring-2 focus:ring-peshawar-500 bg-white"
                >
                  <option value="PHONE">Phone Call</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="IN_APP">In-App Chat</option>
                </select>
              </div>
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
                className="px-5 py-2 text-xs font-bold bg-peshawar-600 hover:bg-peshawar-700 text-white rounded-m3-md shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Send Inquiry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
