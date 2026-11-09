'use client';

import React from 'react';
import { useAuth } from '../../lib/auth-context';
import EmptyState from '../../components/EmptyState';

export default function MessagesPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon="🔒"
          title="Sign in to View Messages"
          description="Access your direct communications with verified Peshawar landlords."
          actionText="Sign In"
          actionHref="/login"
        />
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-navy-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
          Direct Messages
        </h1>
        <p className="text-xs sm:text-sm text-navy-500 mt-1">
          Chat directly with verified property landlords across Peshawar.
        </p>
      </div>

      <div className="bg-white rounded-m3-lg border border-navy-100 p-8 shadow-xs">
        <EmptyState
          icon="💬"
          title="No Active Chat Conversations"
          description="When a landlord responds to your inquiry or initiates a direct chat, your message thread will appear here."
          actionText="View Inquiries"
          actionHref="/inquiries"
        />
      </div>
    </main>
  );
}
