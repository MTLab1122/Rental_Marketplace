import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionText?: string;
}

export default function EmptyState({
  icon = '🔍',
  title,
  description,
  actionHref,
  actionText,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-m3-lg border border-dashed border-navy-200 p-10 text-center max-w-md mx-auto my-8">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-extrabold text-navy-900 text-lg mb-1">{title}</h3>
      <p className="text-xs text-navy-500 mb-5 leading-relaxed">{description}</p>
      {actionHref && actionText && (
        <Link
          href={actionHref}
          className="inline-block px-4 py-2 bg-peshawar-600 hover:bg-peshawar-700 text-white text-xs font-bold rounded-m3-md transition"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
