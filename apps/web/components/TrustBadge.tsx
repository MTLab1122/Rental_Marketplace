import React from 'react';
import { TrustBadge as TrustBadgeEnum } from '@rental-peshawar/shared-types';

interface TrustBadgeProps {
  badge: TrustBadgeEnum | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const BADGE_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  [TrustBadgeEnum.VERIFIED_LANDLORD]: {
    label: 'Verified Landlord',
    icon: '✓',
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-400',
    border: 'border-emerald-700/60',
  },
  [TrustBadgeEnum.FAST_RESPONDER]: {
    label: 'Fast Responder',
    icon: '⚡',
    bg: 'bg-sky-950/80',
    text: 'text-sky-400',
    border: 'border-sky-700/60',
  },
  [TrustBadgeEnum.HIGHLY_RATED]: {
    label: 'Highly Rated',
    icon: '★',
    bg: 'bg-amber-950/80',
    text: 'text-amber-400',
    border: 'border-amber-700/60',
  },
  [TrustBadgeEnum.TOP_LISTING]: {
    label: 'Top Listing',
    icon: '🏆',
    bg: 'bg-purple-950/80',
    text: 'text-purple-400',
    border: 'border-purple-700/60',
  },
  [TrustBadgeEnum.NEW_LISTING]: {
    label: 'New Listing',
    icon: '✨',
    bg: 'bg-blue-950/80',
    text: 'text-blue-400',
    border: 'border-blue-700/60',
  },
  [TrustBadgeEnum.PREMIUM_LISTING]: {
    label: 'Premium',
    icon: '💎',
    bg: 'bg-rose-950/80',
    text: 'text-rose-400',
    border: 'border-rose-700/60',
  },
};

export default function TrustBadge({ badge, size = 'sm', showLabel = true }: TrustBadgeProps) {
  const config = BADGE_CONFIG[badge] || {
    label: badge,
    icon: '🛡️',
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-sm ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
      title={config.label}
    >
      <span className="font-bold">{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
