/**
 * Peshawar Rental Marketplace - Web Design Tokens
 *
 * Strict Brand Rules:
 * 1. Navy Blue: Primary brand identity, headers, navigation, footers, primary text.
 * 2. Emerald Green: Verified status, success feedback, available listings, positive metrics.
 * 3. Terracotta / Clay: High-priority CTAs, warnings, urgent highlights, accent accents.
 * 4. Neutral Grays / White: Backgrounds, cards, surfaces, subtle borders.
 * 5. PURPLE IS STRICTLY FORBIDDEN.
 * 6. PILL SHAPES (rounded-full) ARE FORBIDDEN FOR BUTTONS, BADGES, AND INPUTS.
 */

export const designTokens = {
  colors: {
    navy: {
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
    emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
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
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    neutral: {
      surface: '#ffffff',
      background: '#f8fafc',
      border: '#e2e8f0',
      borderDark: '#cbd5e1',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#64748b',
    },
    eligibility: {
      studentBg: '#f0f9ff',
      studentBorder: '#bae6fd',
      studentText: '#0369a1',
      familyBg: '#fefce8',
      familyBorder: '#fef08a',
      familyText: '#854d0e',
    },
  },

  typography: {
    fontFamily:
      "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    },
  },

  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px', // standard for buttons, badges, inputs
    lg: '12px', // standard for cards, modals
    xl: '16px', // standard for hero containers, large sections
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  touchTargets: {
    minHeight: '48px',
    minWidth: '48px',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export type DesignTokens = typeof designTokens;
