'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { getNotificationPreferences, updateNotificationPreferences } from '../../../lib/api';
import { NotificationPreferenceDto } from '@rental-peshawar/shared-types';

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferenceDto>({
    emailAlerts: true,
    pushAlerts: true,
    inAppAlerts: true,
    instantAlerts: true,
    dailyDigest: true,
    weeklyDigest: true,
    recommendations: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
      return;
    }

    async function loadPrefs() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await getNotificationPreferences(token);
        if (res) {
          setPrefs(res);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load preferences.');
      } finally {
        setLoading(false);
      }
    }

    loadPrefs();
  }, [token, isAuthenticated, router]);

  const handleToggle = (key: keyof NotificationPreferenceDto) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateNotificationPreferences(prefs, token);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-navy-200 rounded w-1/3" />
        <div className="h-48 bg-navy-50 rounded-m3-md border border-navy-100" />
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-navy-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 flex items-center gap-2">
            <span>⚙️</span> Notification Preferences
          </h1>
          <p className="text-xs text-navy-500 mt-1">
            Choose how and when you receive listing alerts, inquiries, and recommendations.
          </p>
        </div>
        <Link
          href="/saved-searches"
          className="text-xs font-bold text-peshawar-700 hover:text-peshawar-800"
        >
          View Saved Searches →
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-m3-sm font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-m3-sm font-bold flex items-center gap-2">
          <span>✓</span> Preferences updated successfully!
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white rounded-m3-lg border border-navy-100 p-6 shadow-xs space-y-6"
      >
        {/* Delivery Channels */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-navy-900 uppercase tracking-wider text-peshawar-800">
            Delivery Channels
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-navy-50">
            <div>
              <div className="text-xs font-bold text-navy-900">In-App Notifications</div>
              <div className="text-[11px] text-navy-500">
                Show notification badge and alert bell inside the web & mobile app
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.inAppAlerts}
              onChange={() => handleToggle('inAppAlerts')}
              className="h-4 w-4 text-peshawar-600 rounded border-navy-300 focus:ring-peshawar-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-navy-50">
            <div>
              <div className="text-xs font-bold text-navy-900">Push Notifications (FCM)</div>
              <div className="text-[11px] text-navy-500">
                Receive mobile device push notifications for matches
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.pushAlerts}
              onChange={() => handleToggle('pushAlerts')}
              className="h-4 w-4 text-peshawar-600 rounded border-navy-300 focus:ring-peshawar-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-navy-50">
            <div>
              <div className="text-xs font-bold text-navy-900">Email Alerts</div>
              <div className="text-[11px] text-navy-500">
                Receive verified property summaries directly to your email
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.emailAlerts}
              onChange={() => handleToggle('emailAlerts')}
              className="h-4 w-4 text-peshawar-600 rounded border-navy-300 focus:ring-peshawar-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Discovery & Frequency */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-black text-navy-900 uppercase tracking-wider text-peshawar-800">
            Discovery & Frequencies
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-navy-50">
            <div>
              <div className="text-xs font-bold text-navy-900">Instant Listing Alerts</div>
              <div className="text-[11px] text-navy-500">
                Notify immediately when a matching property is verified
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.instantAlerts}
              onChange={() => handleToggle('instantAlerts')}
              className="h-4 w-4 text-peshawar-600 rounded border-navy-300 focus:ring-peshawar-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-navy-50">
            <div>
              <div className="text-xs font-bold text-navy-900">Daily Digest</div>
              <div className="text-[11px] text-navy-500">
                Receive a daily summary of newly approved listings
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.dailyDigest}
              onChange={() => handleToggle('dailyDigest')}
              className="h-4 w-4 text-peshawar-600 rounded border-navy-300 focus:ring-peshawar-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-navy-50">
            <div>
              <div className="text-xs font-bold text-navy-900">Personalized Recommendations</div>
              <div className="text-[11px] text-navy-500">
                Allow AI recommendations based on your views and favorites
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.recommendations}
              onChange={() => handleToggle('recommendations')}
              className="h-4 w-4 text-peshawar-600 rounded border-navy-300 focus:ring-peshawar-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-navy-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-peshawar-600 hover:bg-peshawar-700 disabled:opacity-50 text-white rounded-m3-sm text-xs font-bold shadow-xs transition"
          >
            {saving ? 'Saving Preferences...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </main>
  );
}
