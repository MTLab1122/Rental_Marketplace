import React from 'react';
import { TrustBadge as TrustBadgeEnum } from '@rental-peshawar/shared-types';
import {
  CheckIcon,
  LightningIcon,
  StarIcon,
  TrophyIcon,
  SparklesIcon,
  DiamondIcon,
  ShieldCheckIcon,
} from './Icons';

interface TrustBadgeProps {
  badge: TrustBadgeEnum | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

interface BadgeConfig {
  label: string;
  renderIcon: (className: string) => React.ReactNode;
  bg: string;
  text: string;
  border: string;
}

const BADGE_CONFIG: Record<string, BadgeConfig> = {
  [TrustBadgeEnum.VERIFIED_LANDLORD]: {
    label: 'Verified Landlord',
    renderIcon: (cls) => <CheckIcon className={cls} />,
    bg: 'bg-emerald-950/90',
    text: 'text-emerald-300',
    border: 'border-emerald-700/60',
  },
  [TrustBadgeEnum.FAST_RESPONDER]: {
    label: 'Fast Responder',
    renderIcon: (cls) => <LightningIcon className={cls} />,
    bg: 'bg-navy-900',
    text: 'text-sky-300',
    border: 'border-sky-700/60',
  },
  [TrustBadgeEnum.HIGHLY_RATED]: {
    label: 'Highly Rated',
    renderIcon: (cls) => <StarIcon className={cls} filled={true} />,
    bg: 'bg-navy-900',
    text: 'text-amber-300',
    border: 'border-amber-700/60',
  },
  [TrustBadgeEnum.TOP_LISTING]: {
    label: 'Top Listing',
    renderIcon: (cls) => <TrophyIcon className={cls} />,
    // STRICT PURPLE PURGE: Use Navy/Terracotta instead of purple
    bg: 'bg-navy-900',
    text: 'text-terracotta-400',
    border: 'border-terracotta-600/60',
  },
  [TrustBadgeEnum.NEW_LISTING]: {
    label: 'New Listing',
    renderIcon: (cls) => <SparklesIcon className={cls} />,
    bg: 'bg-navy-900',
    text: 'text-emerald-400',
    border: 'border-emerald-700/60',
  },
  [TrustBadgeEnum.PREMIUM_LISTING]: {
    label: 'Premium',
    renderIcon: (cls) => <DiamondIcon className={cls} />,
    bg: 'bg-navy-900',
    text: 'text-terracotta-300',
    border: 'border-terracotta-700/60',
  },
};

export default function TrustBadge({ badge, size = 'sm', showLabel = true }: TrustBadgeProps) {
  const config = BADGE_CONFIG[badge] || {
    label: badge,
    renderIcon: (cls) => <ShieldCheckIcon className={cls} />,
    bg: 'bg-slate-800',
    text: 'text-slate-200',
    border: 'border-slate-700',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  const iconClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border shadow-xs ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
      title={config.label}
    >
      {config.renderIcon(iconClasses)}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
