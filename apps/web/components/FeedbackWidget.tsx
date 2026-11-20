'use client';

import React, { useState } from 'react';
import { submitUserFeedback } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { ChatIcon, SparklesIcon, CloseIcon, StarIcon } from './Icons';

export default function FeedbackWidget() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('GENERAL');
  const [persona, setPersona] = useState<'TENANT' | 'LANDLORD' | 'AGENT'>(
    user?.roles?.includes('LANDLORD') ? 'LANDLORD' : 'TENANT',
  );
  const [locality, setLocality] = useState<string>('Hayatabad');
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage('Please share a brief comment or suggestion.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const pageUrl = typeof window !== 'undefined' ? window.location.pathname : '/';

      await submitUserFeedback(
        {
          rating,
          category,
          persona,
          locality,
          comment: comment.trim(),
          pageUrl,
          metadata: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          },
        },
        token || undefined,
      );

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setComment('');
        setRating(5);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Feedback Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2.5 rounded-md shadow-xl border border-navy-700 hover:border-peshawar-500 transition-colors text-xs font-semibold focus-visible:ring-2 focus-visible:ring-peshawar-500"
          aria-label="Open User Feedback Form"
        >
          <ChatIcon className="w-4 h-4 text-emerald-400" />
          <span>Feedback</span>
        </button>
      </div>

      {/* Feedback Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full shadow-2xl border border-navy-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-navy-950 text-white p-5 flex items-center justify-between border-b border-navy-800">
              <div>
                <h3 className="text-base font-bold text-emerald-400">Share Your Feedback</h3>
                <p className="text-xs text-navy-300 mt-0.5">
                  Help us build a reliable, fair rental marketplace for Peshawar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-navy-400 hover:text-white transition p-1"
                aria-label="Close feedback modal"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center space-y-3">
                <SparklesIcon className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-navy-900">Thank You!</h4>
                <p className="text-xs text-navy-600 leading-relaxed">
                  Your feedback has been received and logged directly into our product improvement
                  register.
                  {rating <= 2 && (
                    <span className="block mt-2 font-semibold text-terracotta-700 bg-terracotta-50 p-2 rounded-md border border-terracotta-200">
                      Our Peshawar concierge team has received your high-priority alert and will
                      look into this issue.
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Honeypot field */}
                <input
                  type="text"
                  name="hp_feedback_check"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                {errorMessage && (
                  <div
                    role="alert"
                    className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700"
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Rating Selector */}
                <div className="space-y-1.5 text-center">
                  <label id="rating-label" className="text-xs font-semibold text-navy-800 block">
                    How was your experience on Peshawar Rentals today?
                  </label>
                  <div
                    className="flex justify-center space-x-2"
                    role="group"
                    aria-labelledby="rating-label"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded ${
                          star <= rating ? 'text-amber-500' : 'text-navy-300'
                        }`}
                        aria-label={`Rate ${star} out of 5 stars`}
                      >
                        <StarIcon className="w-6 h-6" filled={star <= rating} />
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-navy-500 font-medium">
                    {rating === 5 && 'Outstanding / 5 Stars'}
                    {rating === 4 && 'Good Experience / 4 Stars'}
                    {rating === 3 && 'Average / Needs Improvement'}
                    {rating === 2 && 'Poor / Friction Encountered'}
                    {rating === 1 && 'Critical Issue / Very Dissatisfied'}
                  </span>
                </div>

                {/* Persona & Locality */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label htmlFor="fb-persona" className="block text-navy-700 font-medium mb-1">
                      I am a:
                    </label>
                    <select
                      id="fb-persona"
                      value={persona}
                      onChange={(e) => setPersona(e.target.value as any)}
                      className="w-full bg-navy-50 border border-navy-200 rounded-md p-2 text-navy-900 focus:outline-none focus:border-peshawar-500 text-xs"
                    >
                      <option value="TENANT">Tenant / Renter</option>
                      <option value="LANDLORD">Landlord / Owner</option>
                      <option value="AGENT">Real Estate Agent</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="fb-locality" className="block text-navy-700 font-medium mb-1">
                      Locality:
                    </label>
                    <select
                      id="fb-locality"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full bg-navy-50 border border-navy-200 rounded-md p-2 text-navy-900 focus:outline-none focus:border-peshawar-500 text-xs"
                    >
                      <option value="Hayatabad">Hayatabad</option>
                      <option value="University Town">University Town</option>
                      <option value="Saddar">Saddar / Cantt</option>
                      <option value="Gulbahar">Gulbahar</option>
                      <option value="Warsak Road">Warsak Road</option>
                      <option value="Regi Model Town">Regi Model Town</option>
                      <option value="DHA Peshawar">DHA Peshawar</option>
                      <option value="Other">Other Locality</option>
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div className="text-xs">
                  <label htmlFor="fb-category" className="block text-navy-700 font-medium mb-1">
                    Topic / Category:
                  </label>
                  <select
                    id="fb-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-navy-50 border border-navy-200 rounded-md p-2 text-navy-900 focus:outline-none focus:border-peshawar-500 text-xs"
                  >
                    <option value="GENERAL">General Feedback / Compliment</option>
                    <option value="FEATURE_REQUEST">
                      Feature Idea (e.g., Solar / Backup filter)
                    </option>
                    <option value="SEARCH_QUALITY">Search Accuracy / Wrong Listing Info</option>
                    <option value="BUG">Technical Glitch / Bug Report</option>
                    <option value="LANDLORD_ISSUE">Landlord / Pricing Issue</option>
                  </select>
                </div>

                {/* Free Text Comment */}
                <div className="text-xs">
                  <label htmlFor="fb-comment" className="block text-navy-700 font-medium mb-1">
                    Your comments (English, Urdu, or Pashto):
                  </label>
                  <textarea
                    id="fb-comment"
                    rows={3}
                    placeholder="Tell us what you liked or what went wrong..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-navy-50 border border-navy-200 rounded-md p-2.5 text-navy-900 focus:outline-none focus:border-peshawar-500 text-xs resize-none"
                  ></textarea>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-navy-100 hover:bg-navy-200 text-navy-700 rounded-md text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-peshawar-600 hover:bg-peshawar-700 text-white rounded-md text-xs font-bold transition shadow-sm flex items-center space-x-1 disabled:opacity-50"
                  >
                    {submitting ? <span>Submitting...</span> : <span>Send Feedback</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
