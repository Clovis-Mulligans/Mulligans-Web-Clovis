'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { getSocket, disconnectSocket } from '@/lib/socket';
import {
  getConversations,
  getMessages,
  markConversationRead,
  sendMessage as sendMessageHttp,
} from '@mulligans/api-client';
import type {
  Conversation,
  Message,
  SocketMessage,
} from '@mulligans/api-client';
import type { Socket } from 'socket.io-client';

// ─── Quick Reply Templates ───────────────────────────────────

const QUICK_REPLIES = [
  'Thanks for your interest! This item is still available.',
  'Happy to answer any questions about specs or condition.',
  'This item has been reserved but feel free to message me.',
  'I can offer free shipping on this item.',
  'Please check out my other listings too!',
];

// ─── Date Formatting ─────────────────────────────────────────

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatConversationTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return formatTime(dateStr);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function formatDateDivider(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function sanitize(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Skeleton Components ─────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E0E0D8]">
      <div className="h-10 w-10 rounded-full bg-[#F4F4F0] animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-[#F4F4F0] animate-pulse" />
        <div className="h-3 w-full rounded bg-[#F4F4F0] animate-pulse" />
      </div>
    </div>
  );
}

// ─── Conversation List Item ──────────────────────────────────

function ConversationRow({
  conv,
  isSelected,
  onClick,
}: {
  conv: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasUnread = conv.unread_count > 0;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[#E0E0D8]"
      style={{
        backgroundColor: isSelected
          ? 'rgba(29,198,144,0.1)'
          : hasUnread
            ? 'rgba(29,198,144,0.06)'
            : 'transparent',
        borderLeft: isSelected ? '3px solid #1DC690' : '3px solid transparent',
      }}
    >
      {/* Avatar */}
      <div className="h-10 w-10 rounded-full bg-[#F4F4F0] overflow-hidden flex-shrink-0">
        {conv.other_user_avatar ? (
          <img
            src={conv.other_user_avatar}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-[#1DC690] text-white"
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            {(conv.other_user_name || '?')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Listing thumbnail */}
      {conv.listing_image && (
        <div className="h-10 w-10 rounded-lg bg-[#F4F4F0] overflow-hidden flex-shrink-0">
          <img
            src={conv.listing_image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="truncate text-[#0D0D0D]"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {conv.other_user_name || 'User'}
          </span>
          <span
            className="flex-shrink-0 text-[#6B6B6B]"
            style={{ fontSize: '0.78rem' }}
          >
            {formatConversationTime(conv.last_message_time)}
          </span>
        </div>
        {conv.listing_title && (
          <p
            className="truncate text-[#6B6B6B]"
            style={{ fontSize: '0.85rem' }}
          >
            {conv.listing_title}
          </p>
        )}
        <p
          className="truncate text-[#6B6B6B]"
          style={{ fontSize: '0.78rem' }}
        >
          {conv.last_message || 'No messages yet'}
        </p>
      </div>

      {/* Unread dot */}
      {hasUnread && (
        <div
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: '#1DC690' }}
        />
      )}
    </button>
  );
}

// ─── Date Divider ────────────────────────────────────────────

function DateDivider({ date }: { date: string }) {
  return (
    <div className="my-4 flex items-center gap-3 px-4">
      <div className="flex-1 h-px" style={{ backgroundColor: '#E0E0D8' }} />
      <span
        style={{
          color: '#ADADAD',
          fontSize: '0.78rem',
          fontFamily: 'Montserrat, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        {formatDateDivider(date)}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: '#E0E0D8' }} />
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────

function MessageBubble({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  if (message.message_type === 'system') {
    return (
      <div className="my-2 text-center">
        <span
          className="italic text-[#6B6B6B]"
          style={{ fontSize: '0.78rem', fontFamily: 'Montserrat, sans-serif' }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}
      style={{ paddingLeft: '16px', paddingRight: '16px' }}
    >
      <div style={{ maxWidth: '75%' }}>
        <div
          style={{
            backgroundColor: isMine ? '#1DC690' : '#FFFFFF',
            color: isMine ? '#FFFFFF' : '#0D0D0D',
            borderRadius: isMine
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
            padding: '10px 14px',
            boxShadow: isMine
              ? 'none'
              : '0 1px 2px rgba(0,0,0,0.08)',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.9rem',
            lineHeight: '1.4',
            wordBreak: 'break-word' as const,
          }}
        >
          {sanitize(message.content)}
        </div>
        <p
          className={isMine ? 'text-right' : 'text-left'}
          style={{
            color: '#ADADAD',
            fontSize: '0.72rem',
            fontFamily: 'Montserrat, sans-serif',
            marginTop: '2px',
          }}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

// ─── Listing Context Banner ──────────────────────────────────

function ListingBanner({
  title,
  price,
  image,
  listingId,
}: {
  title: string;
  price: number | null;
  image: string | null;
  listingId: string | null;
}) {
  return (
    <div
      className="flex items-center gap-3 bg-white px-4 py-2.5"
      style={{ borderBottom: '1px solid #E0E0D8' }}
    >
      {image && (
        <div className="h-12 w-12 rounded-md bg-[#F4F4F0] overflow-hidden flex-shrink-0">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{
            color: '#1DC690',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          {title}
        </p>
        {price != null && (
          <p
            style={{
              color: '#1DC690',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            £{price.toFixed(2)}
          </p>
        )}
      </div>
      {listingId && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6B6B6B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </div>
  );
}

// ─── Empty States ────────────────────────────────────────────

function EmptyConversationList() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 rounded-full bg-[#F4F4F0] p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ADADAD"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      </div>
      <p
        className="text-[#6B6B6B] font-medium"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        No messages yet
      </p>
      <p
        className="mt-1 text-sm text-[#ADADAD]"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        When buyers message you about listings, they&apos;ll appear here.
      </p>
    </div>
  );
}

function EmptyChatPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ADADAD"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
      <p
        className="mt-4 text-[#6B6B6B]"
        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}
      >
        Select a conversation to start messaging
      </p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function MessagesPage() {
  const { userId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [sendDisabled, setSendDisabled] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const prevConversationRef = useRef<string | null>(null);

  // ── Fetch conversations ──────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      setConversations(res.conversations || []);
    } catch {
      // Silent fail — will retry on next poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Socket.IO setup ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function initSocket() {
      try {
        const { getSocket: getSocketFn } = await import('@/lib/socket');
        const sock = await getSocketFn();
        if (!mounted) return;
        socketRef.current = sock;

        // Listen for new messages (global — updates conversation list)
        sock.on(
          'message_notification',
          (data: { conversationId: string; message: SocketMessage }) => {
            if (!mounted) return;
            // Update conversation list
            setConversations((prev) =>
              prev
                .map((c) => {
                  if (c.id === data.conversationId) {
                    return {
                      ...c,
                      last_message: data.message.content,
                      last_message_time: data.message.created_at,
                      last_message_timestamp: data.message.created_at,
                      unread_count:
                        data.conversationId === selectedId
                          ? c.unread_count
                          : c.unread_count + 1,
                    };
                  }
                  return c;
                })
                .sort(
                  (a, b) =>
                    new Date(b.last_message_time).getTime() -
                    new Date(a.last_message_time).getTime()
                )
            );
          }
        );

        // Listen for new messages in active conversation
        sock.on('new_message', (message: SocketMessage) => {
          if (!mounted) return;
          setMessages((prev) => {
            // Deduplicate
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
          // Auto-scroll if near bottom
          requestAnimationFrame(() => {
            const container = chatContainerRef.current;
            if (container) {
              const nearBottom =
                container.scrollHeight -
                  container.scrollTop -
                  container.clientHeight <
                100;
              if (nearBottom) {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }
            }
          });
        });

        sock.on('error', (data: { message: string }) => {
          console.error('Socket error:', data.message);
        });
      } catch {
        // Socket unavailable — HTTP fallback will be used
      }
    }

    initSocket();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Join/leave conversation rooms ────────────────────────
  useEffect(() => {
    const sock = socketRef.current;
    if (!sock?.connected) return;

    // Leave previous room
    if (prevConversationRef.current) {
      sock.emit('leave_conversation', prevConversationRef.current);
    }

    // Join new room
    if (selectedId) {
      sock.emit('join_conversation', selectedId);
      prevConversationRef.current = selectedId;
    }
  }, [selectedId]);

  // ── Fetch messages when conversation selected ────────────
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    async function load() {
      setMessagesLoading(true);
      try {
        const [messagesRes] = await Promise.all([
          getMessages(selectedId!, { limit: 50 }),
          markConversationRead(selectedId!),
        ]);
        setMessages(messagesRes.messages?.reverse() || []);

        // Update unread count in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId ? { ...c, unread_count: 0 } : c
          )
        );
      } catch {
        // Error fetching messages
      } finally {
        setMessagesLoading(false);
      }
    }

    load();
  }, [selectedId]);

  // ── Auto-scroll on initial load ──────────────────────────
  useEffect(() => {
    if (messages.length > 0 && !messagesLoading) {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView();
      });
    }
  }, [messagesLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send message ─────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || !selectedId || sendDisabled) return;

    setSendDisabled(true);
    setInputValue('');

    const sock = socketRef.current;
    if (sock?.connected) {
      // Send via Socket.IO
      sock.emit('send_message', {
        conversationId: selectedId,
        content,
        messageType: 'text',
      });
    } else {
      // Fallback to HTTP
      try {
        const msg = await sendMessageHttp(selectedId, content);
        setMessages((prev) => [...prev, msg]);
      } catch {
        // Restore input on failure
        setInputValue(content);
      }
    }

    // Rate limit: 500ms cooldown
    setTimeout(() => setSendDisabled(false), 500);

    // Auto-scroll
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [inputValue, selectedId, sendDisabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Search filter ────────────────────────────────────────
  const filteredConversations = search
    ? conversations.filter(
        (c) =>
          c.other_user_name?.toLowerCase().includes(search.toLowerCase()) ||
          c.listing_title?.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  // ── Selected conversation detail ─────────────────────────
  const selectedConv = conversations.find((c) => c.id === selectedId);

  // ── Render messages with date dividers ───────────────────
  function renderMessages() {
    const elements: React.ReactNode[] = [];
    let lastDate: string | null = null;

    for (const msg of messages) {
      if (!lastDate || !isSameDay(lastDate, msg.created_at)) {
        elements.push(
          <DateDivider key={`date-${msg.created_at}`} date={msg.created_at} />
        );
        lastDate = msg.created_at;
      }
      elements.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={msg.sender_id === userId}
        />
      );
    }

    return elements;
  }

  // ── Total unread count ───────────────────────────────────
  const totalUnread = conversations.reduce(
    (sum, c) => sum + c.unread_count,
    0
  );

  return (
    <div
      className="flex h-[calc(100vh-96px)] rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {/* ── Left Panel: Conversation List ──────────────────── */}
      <div
        className="flex flex-col border-r border-[#E0E0D8]"
        style={{ width: '35%', minWidth: '280px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E0E0D8]">
          <div className="flex items-center gap-2">
            <h1
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 600,
                fontSize: '0.75rem',
                color: '#6B6B6B',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Messages
            </h1>
            {totalUnread > 0 && (
              <span
                className="flex items-center justify-center rounded-full text-white"
                style={{
                  backgroundColor: '#E53E3E',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                }}
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-[#E0E0D8]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ADADAD"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-lg border border-[#E0E0D8] bg-[#F4F4F0] py-2 pl-9 pr-3 text-sm text-[#0D0D0D] placeholder-[#ADADAD] focus:border-[#1DC690] focus:outline-none focus:ring-2 focus:ring-[#1DC690]/20"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <>
              <ConversationSkeleton />
              <ConversationSkeleton />
              <ConversationSkeleton />
            </>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                isSelected={conv.id === selectedId}
                onClick={() => setSelectedId(conv.id)}
              />
            ))
          ) : (
            <EmptyConversationList />
          )}
        </div>
      </div>

      {/* ── Right Panel: Chat Area ─────────────────────────── */}
      <div className="flex flex-1 flex-col" style={{ backgroundColor: '#F4F4F4' }}>
        {!selectedId ? (
          <EmptyChatPanel />
        ) : (
          <>
            {/* Chat header */}
            <div
              className="flex items-center gap-3 bg-white px-4 py-3"
              style={{ borderBottom: '1px solid #E0E0D8' }}
            >
              <div className="h-9 w-9 rounded-full bg-[#F4F4F0] overflow-hidden flex-shrink-0">
                {selectedConv?.other_user_avatar ? (
                  <img
                    src={selectedConv.other_user_avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-[#1DC690] text-white"
                    style={{ fontSize: '0.7rem', fontWeight: 700 }}
                  >
                    {(selectedConv?.other_user_name || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="truncate text-[#0D0D0D]"
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  {selectedConv?.other_user_name || 'User'}
                </p>
                {selectedConv?.listing_title && (
                  <p
                    className="truncate text-[#6B6B6B]"
                    style={{ fontSize: '0.78rem' }}
                  >
                    {selectedConv.listing_title}
                  </p>
                )}
              </div>
            </div>

            {/* Listing context banner */}
            {selectedConv?.listing_title && (
              <ListingBanner
                title={selectedConv.listing_title}
                price={selectedConv.listing_price}
                image={selectedConv.listing_image}
                listingId={selectedConv.listing_id}
              />
            )}

            {/* Messages area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto py-4"
              style={{ backgroundColor: '#F4F4F4' }}
            >
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1DC690] border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p
                    className="text-[#ADADAD]"
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '0.85rem',
                    }}
                  >
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                renderMessages()
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick reply templates — shown when input is empty */}
            {!inputValue.trim() && (
              <div
                className="flex gap-2 overflow-x-auto px-4 py-2 bg-white border-t border-[#E0E0D8]"
                style={{ scrollbarWidth: 'none' }}
              >
                {QUICK_REPLIES.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(text)}
                    className="flex-shrink-0 rounded-full border border-[#E0E0D8] bg-white px-3 py-1.5 text-[#6B6B6B] transition-colors hover:border-[#1DC690] hover:text-[#1DC690]"
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div
              className="flex items-center gap-3 bg-white px-4"
              style={{
                borderTop: '1px solid #E0E0D8',
                height: '56px',
              }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 text-sm text-[#0D0D0D] placeholder-[#ADADAD] focus:outline-none"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 400,
                }}
              />
              <button
                onClick={handleSend}
                disabled={sendDisabled || !inputValue.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                style={{
                  backgroundColor:
                    inputValue.trim() && !sendDisabled
                      ? '#1DC690'
                      : '#E0E0D8',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={
                    inputValue.trim() && !sendDisabled ? '#FFFFFF' : '#6B6B6B'
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
