'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  AppNotification,
} from '../../lib/api';
import EmptyState from '../../components/EmptyState';

export default function NotificationsPage() {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getNotifications(token);
      setNotifications(list || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      await markNotificationRead(id, token);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon="🔒"
          title="Sign in to View Notifications"
          description="Stay updated with rental application statuses, new direct messages, and verification updates."
          actionText="Sign In"
          actionHref="/login"
        />
      </main>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INQUIRY_RECEIVED':
      case 'INQUIRY_REPLIED':
        return '📬';
      case 'MESSAGE_NEW':
        return '💬';
      case 'PROPERTY_APPROVED':
        return '✅';
      case 'PROPERTY_REJECTED':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-navy-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-navy-500 mt-1">
            Activity alerts for your rental listings, inquiries, and verified messages.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-peshawar-50 text-peshawar-800 border border-peshawar-200 rounded-m3-md text-xs font-black hover:bg-peshawar-100 transition disabled:opacity-50"
          >
            {markingAll ? 'Marking...' : `Mark All Read (${unreadCount})`}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-white border border-navy-100 rounded-m3-lg p-4" />
          <div className="h-20 bg-white border border-navy-100 rounded-m3-lg p-4" />
          <div className="h-20 bg-white border border-navy-100 rounded-m3-lg p-4" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const dataObj = notif.data as Record<string, unknown> | undefined;
            const linkHref = dataObj?.conversationId
              ? `/messages?conversationId=${dataObj.conversationId}`
              : dataObj?.inquiryId
                ? '/inquiries'
                : undefined;

            return (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                className={`rounded-m3-lg border p-4 transition flex items-start gap-3.5 ${
                  notif.isRead
                    ? 'bg-white border-navy-100 hover:border-navy-200'
                    : 'bg-peshawar-50/40 border-peshawar-200 shadow-xs'
                }`}
              >
                <div className="text-2xl shrink-0 p-1">{getNotificationIcon(notif.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3
                      className={`text-xs sm:text-sm font-extrabold ${notif.isRead ? 'text-navy-900' : 'text-navy-950 font-black'}`}
                    >
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-navy-400 shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-navy-600 leading-relaxed mb-2">{notif.body}</p>

                  <div className="flex items-center gap-3 text-[11px]">
                    {linkHref && (
                      <Link
                        href={linkHref}
                        className="font-black text-peshawar-700 hover:underline"
                      >
                        View Activity →
                      </Link>
                    )}
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(notif.id);
                        }}
                        className="text-navy-400 hover:text-navy-600 font-semibold"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-peshawar-600 shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="🔔"
          title="No Notifications Yet"
          description="You will receive alerts here when landlords reply to your applications or send messages."
          actionText="Browse Listings"
          actionHref="/properties"
        />
      )}
    </main>
  );
}
