'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, setAuthToken, setupMfa, verifyMfa } from '../../lib/api';

export default function AdminLoginPage() {
  const router = useRouter();

  // Login Form
  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [totpToken, setTotpToken] = useState<string>('');
  const [requiresMfa, setRequiresMfa] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // MFA Setup Modal
  const [showMfaSetup, setShowMfaSetup] = useState<boolean>(false);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaUrl, setMfaUrl] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState<string>('');
  const [setupStatus, setSetupStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await adminLogin({
        emailOrPhone: emailOrPhone.trim(),
        password,
        totpToken: requiresMfa ? totpToken.trim() : undefined,
      });

      if (res?.requiresMfa) {
        setRequiresMfa(true);
        setLoading(false);
        return;
      }

      if (res?.tokens?.accessToken) {
        setAuthToken(res.tokens.accessToken);
        if (res.user) {
          localStorage.setItem('adminUser', JSON.stringify(res.user));
        }
        router.push('/');
      } else {
        setErrorMessage('Authentication succeeded but no access token was returned.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMfaSetup = async () => {
    try {
      setLoading(true);
      const res = await setupMfa();
      setMfaSecret(res.secret);
      setMfaUrl(res.otpauthUrl);
      setShowMfaSetup(true);
    } catch (err: any) {
      alert(`MFA setup initialization failed: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfaSetup = async () => {
    if (!setupCode.trim()) return;
    try {
      setLoading(true);
      await verifyMfa(setupCode.trim());
      setSetupStatus('TOTP successfully enrolled! You can now log in.');
      setTimeout(() => {
        setShowMfaSetup(false);
      }, 1500);
    } catch (err: any) {
      alert(`Verification failed: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-950 border border-sky-800 text-3xl mb-4">
            🏔️
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Rental Peshawar</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Administrative Operations & Moderation Console
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-950/80 border border-red-800 text-red-200 text-xs p-3 rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Admin Email or Phone
            </label>
            <input
              type="text"
              required
              disabled={requiresMfa}
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="admin@rentalpeshawar.pk"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              disabled={requiresMfa}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-50"
            />
          </div>

          {requiresMfa && (
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold uppercase text-sky-400 mb-1">
                6-Digit TOTP / Authenticator Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
                placeholder="123456"
                className="w-full bg-slate-950 border border-sky-500 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-sky-400 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1 text-center">
                Enter code from Google Authenticator, Authy, or 1Password
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-950 transition disabled:opacity-50"
          >
            {loading
              ? 'Authenticating...'
              : requiresMfa
                ? 'Verify TOTP & Access Console'
                : 'Sign In'}
          </button>
        </form>

        {/* First time MFA Setup Link */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleStartMfaSetup}
            className="text-xs text-slate-400 hover:text-sky-400 transition"
          >
            First time setting up RFC 6238 MFA? Enroll Authenticator →
          </button>
        </div>
      </div>

      {/* MFA Enrollment Modal */}
      {showMfaSetup && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">Enroll RFC 6238 Authenticator</h3>
            <p className="text-xs text-slate-400">
              Scan the URI or enter the Base32 secret key in your Authenticator app:
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Base32 Secret:</span>
              <p className="font-mono text-sm text-sky-400 break-all select-all font-bold">
                {mfaSecret}
              </p>
              {mfaUrl && (
                <div className="pt-2 text-[10px] text-slate-500 break-all">
                  <span>URI: </span>
                  <span className="text-slate-400">{mfaUrl}</span>
                </div>
              )}
            </div>

            {setupStatus ? (
              <div className="bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs p-3 rounded-lg text-center font-semibold">
                {setupStatus}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Enter Generated 6-Digit Code to Confirm
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-center font-mono font-bold text-sky-400 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMfaSetup(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyMfaSetup}
                    disabled={setupCode.length !== 6 || loading}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
                  >
                    {loading ? 'Verifying...' : 'Confirm & Enable MFA'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
