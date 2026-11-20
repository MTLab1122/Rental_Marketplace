'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../lib/auth-context';
import {
  getConversations,
  getConversationMessages,
  sendConversationMessage,
  markConversationRead,
  blockConversation,
  reportConversation,
} from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import { ConversationSummaryDto, MessageDto, ReportReason } from '@rental-peshawar/shared-types';

function MessagesContent() {
  const { user, token, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get('conversationId');

  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummaryDto | null>(
    null,
  );
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  // Safety / Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>(ReportReason.HARASSMENT);
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Load user conversations
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingConversations(true);
      const list = await getConversations(token);
      setConversations(list || []);

      // If initial conversation passed via query params, auto-select it
      if (initialConversationId && list) {
        const matched = list.find((c) => c.id === initialConversationId);
        if (matched) {
          setSelectedConversation(matched);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [token, initialConversationId]);

  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token, loadConversations]);

  // 2. Initialize Socket.IO connection
  useEffect(() => {
    if (!token) return;

    const wsUrl = process.env['NEXT_PUBLIC_WS_URL'] || 'http://localhost:3000';
    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // connected
    });

    socket.on('message:new', (newMsg: MessageDto) => {
      // If message is for currently active conversation, append and mark read
      if (selectedConversation && newMsg.conversationId === selectedConversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 50);

        if (token && newMsg.senderId !== user?.id) {
          markConversationRead(newMsg.conversationId, token).catch(() => {});
        }
      }

      // Update conversation list preview
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            return {
              ...c,
              lastMessage: newMsg,
              lastMessageAt: newMsg.createdAt,
              unreadCount:
                selectedConversation?.id === c.id || newMsg.senderId === user?.id
                  ? 0
                  : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        }),
      );
    });

    socket.on(
      'message:read',
      (data: { conversationId: string; userId: string; readAt: string }) => {
        if (selectedConversation?.id === data.conversationId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId === user?.id ? { ...m, isRead: true, readAt: data.readAt } : m,
            ),
          );
        }
      },
    );

    socket.on('typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (selectedConversation?.id === data.conversationId && data.userId !== user?.id) {
        setIsOtherUserTyping(data.isTyping);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, selectedConversation, user?.id]);

  // 3. Load messages when selected conversation changes
  useEffect(() => {
    if (!selectedConversation || !token) return;
    const activeToken = token;
    const activeConversation = selectedConversation;

    async function loadThread() {
      setLoadingMessages(true);
      try {
        const history = await getConversationMessages(activeConversation.id, activeToken);
        setMessages(history || []);
        setTimeout(scrollToBottom, 50);

        // Mark as read
        if (activeConversation.unreadCount && activeConversation.unreadCount > 0) {
          await markConversationRead(activeConversation.id, activeToken);
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c)),
          );
        }

        // Join room via socket
        if (socketRef.current?.connected) {
          socketRef.current.emit('conversation:join', { conversationId: activeConversation.id });
        }
      } catch (err) {
        console.error('Failed to load thread messages', err);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadThread();
  }, [selectedConversation, token]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (socketRef.current && selectedConversation) {
      socketRef.current.emit('typing', {
        conversationId: selectedConversation.id,
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && selectedConversation) {
          socketRef.current.emit('typing', {
            conversationId: selectedConversation.id,
            isTyping: false,
          });
        }
      }, 1500);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || !selectedConversation || !token || sending) return;

    if (selectedConversation.isBlocked) {
      alert('This conversation is blocked.');
      return;
    }

    setSending(true);
    setInputText('');

    try {
      const newMsg = await sendConversationMessage(selectedConversation.id, content, token);
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(scrollToBottom, 50);

      // Stop typing
      if (socketRef.current) {
        socketRef.current.emit('typing', {
          conversationId: selectedConversation.id,
          isTyping: false,
        });
      }

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, lastMessage: newMsg, lastMessageAt: newMsg.createdAt }
            : c,
        ),
      );
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message: ' + (err as Error).message);
    } finally {
      setSending(false);
    }
  };

  // Block conversation
  const handleBlockConversation = async () => {
    if (!selectedConversation || !token) return;
    if (!confirm('Are you sure you want to block this user from sending further messages?')) return;

    try {
      const res = await blockConversation(selectedConversation.id, token, 'Blocked by user');
      setSelectedConversation((prev) => (prev ? { ...prev, isBlocked: res.isBlocked } : null));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id ? { ...c, isBlocked: res.isBlocked } : c,
        ),
      );
    } catch (err) {
      console.error('Failed to block conversation', err);
      alert('Could not block conversation.');
    }
  };

  // Report conversation
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !token || !reportDetails.trim() || reporting) return;

    setReporting(true);
    try {
      await reportConversation(selectedConversation.id, reportReason, reportDetails.trim(), token);
      alert('Your safety report has been submitted to the Peshawar Rental Moderation Team.');
      setShowReportModal(false);
      setReportDetails('');
    } catch (err) {
      console.error('Failed to submit report', err);
      alert('Could not submit report: ' + (err as Error).message);
    } finally {
      setReporting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon=""
          title="Sign in to View Messages"
          description="Access your direct communications with verified Peshawar landlords."
          actionText="Sign In"
          actionHref="/login"
        />
      </main>
    );
  }

  // Get recipient participant details
  const getRecipient = (conv: ConversationSummaryDto) => {
    const other = conv.participants?.find((p) => p.userId !== user?.id);
    return other?.fullName || 'Verified Member';
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="border-b border-navy-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            Direct Messages & Safety
          </h1>
          <p className="text-xs sm:text-sm text-navy-500">
            Real-time verified tenant-landlord communication across Peshawar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/inquiries"
            className="text-xs font-bold text-peshawar-700 hover:text-peshawar-800 bg-peshawar-50 px-3 py-1.5 rounded-m3-md border border-peshawar-200 transition"
          >
            ← View All Inquiries
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-m3-xl border border-navy-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Column: Conversation List */}
        <div className="md:col-span-4 border-r border-navy-100 flex flex-col h-full bg-navy-50/20">
          <div className="p-3.5 border-b border-navy-100 bg-white font-extrabold text-xs text-navy-800 uppercase tracking-wider flex items-center justify-between">
            <span>Conversations</span>
            <span className="text-[11px] text-navy-400 font-medium">
              {conversations.length} active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-navy-50">
            {loadingConversations ? (
              <div className="p-4 space-y-3">
                <div className="h-14 bg-navy-100/60 rounded-m3-md animate-pulse" />
                <div className="h-14 bg-navy-100/60 rounded-m3-md animate-pulse" />
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                const recipientName = getRecipient(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-navy-50 ${
                      isSelected ? 'bg-peshawar-50/80 border-l-4 border-peshawar-600' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-md bg-peshawar-100 text-peshawar-800 font-black text-sm flex items-center justify-center shrink-0 border border-peshawar-200">
                      {recipientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-extrabold text-xs text-navy-900 truncate">
                          {recipientName}
                        </span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-navy-400 shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-peshawar-700 font-semibold truncate mb-1">
                        {conv.property?.title || 'Rental Listing'}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-navy-500 truncate flex-1">
                          {conv.isBlocked ? (
                            <span className="text-red-500 font-bold">[Blocked]</span>
                          ) : (
                            conv.lastMessage?.content || 'Started conversation'
                          )}
                        </p>
                        {!!conv.unreadCount && conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-peshawar-600 text-white font-extrabold text-[10px]">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-navy-400">
                No conversations found. Inquire on a listing to start a chat.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Viewport */}
        <div className="md:col-span-8 flex flex-col h-full bg-white">
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 border-b border-navy-100 flex flex-wrap items-center justify-between gap-2 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-peshawar-100 text-peshawar-800 font-extrabold text-xs flex items-center justify-center border border-peshawar-200">
                    {getRecipient(selectedConversation).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-navy-900">
                      {getRecipient(selectedConversation)}
                    </h2>
                    {selectedConversation.property && (
                      <Link
                        href={`/properties/${selectedConversation.property.slug || selectedConversation.property.id}`}
                        className="text-[11px] font-bold text-peshawar-700 hover:underline block truncate max-w-xs"
                      >
                        Listing: {selectedConversation.property.title} →
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* WhatsApp button if authorized */}
                  {selectedConversation.canContactWhatsapp && selectedConversation.whatsappUrl && (
                    <a
                      href={selectedConversation.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-peshawar-600 text-white rounded-m3-sm text-[11px] font-extrabold hover:bg-peshawar-700 transition flex items-center gap-1 shadow-xs"
                    >
                      WhatsApp
                    </a>
                  )}

                  {/* Block / Safety */}
                  <button
                    onClick={handleBlockConversation}
                    className={`px-2 py-1 text-[11px] font-bold rounded-m3-sm transition border ${
                      selectedConversation.isBlocked
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'text-navy-600 hover:text-navy-900 border-navy-200'
                    }`}
                  >
                    {selectedConversation.isBlocked ? 'Blocked' : 'Block'}
                  </button>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-2 py-1 text-[11px] font-bold rounded-m3-sm text-red-600 hover:bg-red-50 border border-red-200 transition"
                  >
                    Report
                  </button>
                </div>
              </div>

              {/* Blocked Alert Banner */}
              {selectedConversation.isBlocked && (
                <div className="bg-red-50 border-b border-red-100 px-4 py-2 text-xs text-red-800 font-bold flex items-center gap-2">
                  <span></span> This conversation is blocked. Neither participant can send new
                  messages.
                </div>
              )}

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-navy-50/10 min-h-[380px]">
                {loadingMessages ? (
                  <div className="space-y-2">
                    <div className="w-1/2 h-10 bg-navy-100 rounded-m3-md animate-pulse" />
                    <div className="w-1/2 h-10 bg-peshawar-100 rounded-m3-md ml-auto animate-pulse" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-m3-lg px-3.5 py-2 text-xs shadow-xs leading-relaxed ${
                            isMe
                              ? 'bg-peshawar-700 text-white rounded-br-none'
                              : 'bg-white border border-navy-100 text-navy-900 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 text-[9px] mt-1 font-semibold ${
                              isMe ? 'text-peshawar-200' : 'text-navy-400'
                            }`}
                          >
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && <span>{m.isRead ? '✓✓' : '✓'}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-xs text-navy-400">
                    No messages yet in this conversation. Say hello!
                  </div>
                )}

                {isOtherUserTyping && (
                  <div className="text-xs text-navy-400 italic font-medium flex items-center gap-1">
                    <span className="animate-pulse">●</span> typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-navy-100 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  disabled={selectedConversation.isBlocked || sending}
                  onChange={handleInputChange}
                  placeholder={
                    selectedConversation.isBlocked
                      ? 'Conversation is blocked'
                      : 'Type your message (enter to send)...'
                  }
                  className="flex-1 text-xs border border-navy-200 rounded-m3-md px-3.5 py-2.5 focus:outline-hidden focus:border-peshawar-600 disabled:bg-navy-50 disabled:text-navy-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending || selectedConversation.isBlocked}
                  className="px-4 py-2.5 bg-peshawar-600 hover:bg-peshawar-700 text-white rounded-m3-md text-xs font-black transition disabled:opacity-50 shadow-xs"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon=""
                title="Select a Conversation"
                description="Pick a chat thread from the left to view message history and discuss rental details safely."
              />
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedConversation && (
        <div className="fixed inset-0 z-50 bg-navy-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-m3-xl border border-navy-100 p-6 max-w-md w-full shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-black text-navy-900">
                Report Conversation or Landlord
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Peshawar Rental enforces strict communication safety rules. Reports are investigated
                by human moderators.
              </p>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-navy-700 mb-1">
                  Reason for Report:
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full text-xs border border-navy-200 rounded-m3-md p-2 bg-white"
                >
                  <option value={ReportReason.HARASSMENT}>
                    Harassment or Inappropriate Behavior
                  </option>
                  <option value={ReportReason.DISCRIMINATION}>Discrimination or Bias</option>
                  <option value={ReportReason.FAKE_LISTING}>
                    Fake or Suspicious Property Claim
                  </option>
                  <option value={ReportReason.MISLEADING_INFORMATION}>
                    Misleading Rental Terms
                  </option>
                  <option value={ReportReason.OTHER}>Other Safety Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-700 mb-1">
                  Incident Details:
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Describe what occurred with specific dates or quotes..."
                  className="w-full text-xs border border-navy-200 rounded-m3-md p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-navy-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-navy-600 hover:text-navy-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting || !reportDetails.trim()}
                  className="px-4 py-1.5 bg-red-600 text-white rounded-m3-md text-xs font-black hover:bg-red-700 disabled:opacity-50"
                >
                  {reporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-96 bg-white border border-navy-100 rounded-m3-xl animate-pulse" />
        </main>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
