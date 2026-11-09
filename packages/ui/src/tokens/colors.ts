/**
 * Peshawar Rental Marketplace Design System - Color Tokens
 * Features Pakistani emerald tones, Khyber terracotta, clean modern slates,
 * and high-contrast accessibility compliance.
 */
export const colors = {
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Peshawar Green Primary
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  terracotta: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Khyber Clay Accent
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  // Distinct semantic badges for non-negotiable eligibility separation
  eligibility: {
    studentsOnly: {
      background: '#e0f2fe',
      border: '#7dd3fc',
      text: '#0369a1',
      badgeDarkBg: '#082f49',
      badgeDarkText: '#38bdf8',
    },
    familiesOnly: {
      background: '#fef3c7',
      border: '#fcd34d',
      text: '#b45309',
      badgeDarkBg: '#451a03',
      badgeDarkText: '#fbbf24',
    },
  },
  status: {
    approved: '#10b981',
    pendingReview: '#f59e0b',
    rejected: '#ef4444',
    rented: '#6366f1',
    draft: '#94a3b8',
    suspended: '#dc2626',
    unavailable: '#64748b',
  },
  functional: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const;
