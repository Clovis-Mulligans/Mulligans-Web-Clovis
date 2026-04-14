'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  MessageCircle,
  Send,
  ExternalLink,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { io, Socket } from 'socket.io-client';
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageRest,
  markConversationRead,
  createConversation,
  type Conversation,
  type Message,
} from '@mulligans/api-client';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';

const API_ORIGIN = 'https://api.mulligans.uk.com';
const COLOR = {
  pageBg: '#EAEAE0',
  panel: '#fff',
  green: '#1DC690',
  blue: '#278AB0',
  purple: '#7C5CBF',
  textDark: '#111827',
  textMed: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  selectedBg: '#F0FDF4',
  mutedBg: '#F9FAFB',
};
const NAV_H = 64;
const MOBILE_BREAKPOINT = 768;

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatClockTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

function formatDateDivider(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatPrice(p: number | null | undefined): string {
  if (p == null) return '';
  return `£${Number(p).toFixed(2)}`;
}

function Avatar({ url, name, size = 40 }: { url: string | null; name: string | null; size?: number }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name || 'avatar'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          backgroundColor: COLOR.mutedBg,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: COLOR.green,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

function ListingThumb({ url, size = 40 }: { url: string | null; size?: number }) {
  if (!url) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: COLOR.mutedBg,
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="listing"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        objectFit: 'cover',
        flexShrink: 0,
        backgroundColor: COLOR.mutedBg,
      }}
    />
  );
}

function ConversationRowSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        borderBottom: `1px solid ${COLOR.border}`,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: COLOR.mutedBg }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 12, width: '60%', backgroundColor: COLOR.mutedBg, borderRadius: 4 }} />
        <div style={{ height: 10, width: '40%', backgroundColor: COLOR.mutedBg, borderRadius: 4 }} />
        <div style={{ height: 10, width: '80%', backgroundColor: COLOR.mutedBg, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [sendError, setSendError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/messages');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      const list = (res as unknown as { conversations?: Conversation[] }).conversations || [];
      list.sort(
        (a, b) =>
          new Date(b.last_message_timestamp || b.created_at).getTime() -
          new Date(a.last_message_timestamp || a.created_at).getTime(),
      );
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadConversations();
  }, [isAuthenticated, loadConversations]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        if (!token || cancelled) return;

        const socket = io(API_ORIGIN, {
          auth: { token },
          transports: ['websocket', 'polling'],
          autoConnect: true,
        });

        socket.on('connect_error', (err: Error) => {
          console.warn('Socket connect error', err.message);
        });

        socketRef.current = socket;
      } catch (err) {
        console.warn('Socket auth failed', err);
      }
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => {
        if (msg.conversation_id !== selectedId) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setConversations((prev) =>
        prev
          .map((c) => {
            if (c.id !== msg.conversation_id) return c;
            const isForMe = msg.receiver_id === user?.id;
            const isViewing = msg.conversation_id === selectedId;
            return {
              ...c,
              last_message: msg.content,
              last_message_time: msg.created_at,
              last_message_timestamp: msg.created_at,
              unread_count: isForMe && !isViewing ? (c.unread_count || 0) + 1 : c.unread_count,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.last_message_timestamp || b.created_at).getTime() -
              new Date(a.last_message_timestamp || a.created_at).getTime(),
          ),
      );
    };

    const handleNotification = (data: { conversationId: string }) => {
      if (data.conversationId === selectedId) return;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === data.conversationId ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c,
        ),
      );
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === user?.id) return;
      setOtherTyping(data.isTyping);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      if (data.isTyping) {
        typingClearRef.current = setTimeout(() => setOtherTyping(false), 3000);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_notification', handleNotification);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_notification', handleNotification);
      socket.off('user_typing', handleTyping);
    };
  }, [selectedId, user?.id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedId) return;
    socket.emit('join_conversation', selectedId);
    return () => {
      socket.emit('leave_conversation', selectedId);
    };
  }, [selectedId]);

  const openConversation = useCallback(
    async (id: string) => {
      setSelectedId(id);
      if (isMobile) setMobileView('chat');
      setMessages([]);
      setOtherTyping(false);
      setMessagesLoading(true);
      try {
        const res = await getMessages(id);
        const list = (res as unknown as { messages?: Message[] }).messages || [];
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setMessages(list);
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
        );
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setMessagesLoading(false);
      }
    },
    [isMobile],
  );

  useEffect(() => {
    if (!isAuthenticated || convLoading) return;
    const convId = searchParams.get('id');
    const userId = searchParams.get('userId');
    const listingId = searchParams.get('listingId');

    if (convId) {
      if (convId !== selectedId) openConversation(convId);
      return;
    }

    if (userId) {
      (async () => {
        try {
          const res = await createConversation({
            listing_id: listingId || '',
            seller_id: userId,
          } as { listing_id: string; seller_id: string });
          const conv = (res as unknown as { conversation?: { id: string } }).conversation;
          if (conv?.id) {
            await loadConversations();
            await openConversation(conv.id);
            router.replace('/messages');
          }
        } catch (err) {
          console.error('Failed to create conversation', err);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, convLoading, searchParams]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, otherTyping, selectedId]);

  const emitTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !selectedId) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 2000) return;
    lastTypingEmitRef.current = now;
    socket.emit('typing', { conversationId: selectedId, isTyping: true });
  }, [selectedId]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || !selectedId || sending) return;
    if (content.length > 2000) {
      setSendError('Messages must be 2000 characters or fewer.');
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const msg = (await sendMessageRest(selectedId, content)) as unknown as Message;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selectedId
              ? {
                  ...c,
                  last_message: msg.content,
                  last_message_time: msg.created_at,
                  last_message_timestamp: msg.created_at,
                }
              : c,
          )
          .sort(
            (a, b) =>
              new Date(b.last_message_timestamp || b.created_at).getTime() -
              new Date(a.last_message_timestamp || a.created_at).getTime(),
          ),
      );
      setDraft('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error('Send failed', err);
      setSendError('Could not send. You may be sending too quickly — please wait a moment.');
    } finally {
      setSending(false);
    }
  }, [draft, selectedId, sending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      emitTyping();
    }
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    const maxHeight = 24 * 3 + 20;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div
        style={{
          minHeight: `calc(100vh - ${NAV_H}px)`,
          backgroundColor: COLOR.pageBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: COLOR.textLight, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  const showList = !isMobile || mobileView === 'list';
  const showChat = !isMobile || mobileView === 'chat';

  return (
    <div
      style={{
        backgroundColor: COLOR.pageBg,
        minHeight: `calc(100vh - ${NAV_H}px)`,
        padding: isMobile ? 0 : '16px 16px 0',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          height: `calc(100vh - ${NAV_H}px${isMobile ? '' : ' - 16px'})`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!isMobile && (
          <div style={{ padding: '4px 4px 12px' }}>
            <PageHeader title="Messages" subtitle="Talk to buyers and sellers" />
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            backgroundColor: COLOR.panel,
            borderRadius: isMobile ? 0 : 14,
            overflow: 'hidden',
            border: isMobile ? 'none' : `1px solid ${COLOR.border}`,
            minHeight: 0,
          }}
        >
          {showList && (
            <div
              style={{
                width: isMobile ? '100%' : 340,
                borderRight: isMobile ? 'none' : `1px solid ${COLOR.border}`,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              {isMobile && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: `1px solid ${COLOR.border}`,
                    fontSize: 18,
                    fontWeight: 700,
                    color: COLOR.textDark,
                  }}
                >
                  Messages
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {convLoading ? (
                  <>
                    <ConversationRowSkeleton />
                    <ConversationRowSkeleton />
                    <ConversationRowSkeleton />
                    <ConversationRowSkeleton />
                  </>
                ) : conversations.length === 0 ? (
                  <div
                    style={{
                      padding: '40px 24px',
                      textAlign: 'center',
                      color: COLOR.textLight,
                    }}
                  >
                    <MessageCircle size={36} color={COLOR.textLight} style={{ marginBottom: 10 }} />
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: COLOR.textMed,
                        marginBottom: 4,
                      }}
                    >
                      No messages yet
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                      Start a conversation by messaging a seller on their listing.
                    </div>
                  </div>
                ) : (
                  conversations.map((c) => {
                    const isSelected = c.id === selectedId;
                    const isUnread = (c.unread_count || 0) > 0;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          openConversation(c.id);
                          if (c.unread_count > 0) {
                            markConversationRead(c.id).catch(() => undefined);
                          }
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          display: 'flex',
                          gap: 10,
                          padding: '12px 14px',
                          backgroundColor: isSelected ? COLOR.selectedBg : 'transparent',
                          borderLeft: `3px solid ${isSelected ? COLOR.green : 'transparent'}`,
                          borderBottom: `1px solid ${COLOR.border}`,
                          borderTop: 'none',
                          borderRight: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <Avatar url={c.other_user_avatar} name={c.other_user_name} size={40} />
                          {c.listing_image && (
                            <div
                              style={{
                                position: 'absolute',
                                right: -6,
                                bottom: -6,
                                border: '2px solid #fff',
                                borderRadius: 8,
                              }}
                            >
                              <ListingThumb url={c.listing_image} size={22} />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: isUnread ? 700 : 600,
                                color: COLOR.textDark,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {c.other_user_name || 'Unknown'}
                              {c.other_user_is_verified && (
                                <CheckCircle2 size={13} color={COLOR.blue} />
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: COLOR.textLight,
                                flexShrink: 0,
                              }}
                            >
                              {formatRelativeTime(c.last_message_timestamp || c.created_at)}
                            </div>
                          </div>
                          {c.listing_title && (
                            <div
                              style={{
                                fontSize: 12,
                                color: COLOR.textLight,
                                marginTop: 2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {c.listing_title}
                            </div>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              marginTop: 2,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 13,
                                color: isUnread ? COLOR.textDark : COLOR.textLight,
                                fontWeight: isUnread ? 600 : 400,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flex: 1,
                              }}
                            >
                              {c.last_message || 'No messages yet'}
                            </div>
                            {isUnread && (
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: COLOR.green,
                                  flexShrink: 0,
                                }}
                                aria-label={`${c.unread_count} unread`}
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {showChat && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                backgroundColor: COLOR.mutedBg,
              }}
            >
              {!selectedConversation ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    padding: 32,
                    color: COLOR.textLight,
                    textAlign: 'center',
                  }}
                >
                  <MessageCircle size={44} color={COLOR.textLight} style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.textMed }}>
                    Select a conversation
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    Choose a conversation on the left to view your messages.
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${COLOR.border}`,
                      backgroundColor: COLOR.panel,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    {isMobile && (
                      <button
                        onClick={() => {
                          setMobileView('list');
                          setSelectedId(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'inline-flex',
                          color: COLOR.textMed,
                        }}
                        aria-label="Back to conversations"
                      >
                        <ArrowLeft size={20} />
                      </button>
                    )}
                    <Avatar
                      url={selectedConversation.other_user_avatar}
                      name={selectedConversation.other_user_name}
                      size={36}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: COLOR.textDark,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {selectedConversation.other_user_name || 'Unknown'}
                        {selectedConversation.other_user_is_verified && (
                          <CheckCircle2 size={14} color={COLOR.blue} />
                        )}
                      </div>
                      {selectedConversation.listing_title && (
                        <div
                          style={{
                            fontSize: 12,
                            color: COLOR.textLight,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {selectedConversation.listing_title}
                          {selectedConversation.listing_price != null && (
                            <> · {formatPrice(selectedConversation.listing_price)}</>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedConversation.listing_id && (
                      <a
                        href={`/listings/${selectedConversation.listing_id}`}
                        style={{
                          fontSize: 13,
                          color: COLOR.blue,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        <ExternalLink size={14} />
                        View listing
                      </a>
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      minHeight: 0,
                    }}
                  >
                    {messagesLoading ? (
                      <div style={{ color: COLOR.textLight, fontSize: 13, textAlign: 'center', padding: 20 }}>
                        Loading messages…
                      </div>
                    ) : messages.length === 0 ? (
                      <div
                        style={{
                          color: COLOR.textLight,
                          fontSize: 13,
                          textAlign: 'center',
                          padding: 20,
                        }}
                      >
                        No messages yet. Say hello.
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const prev = messages[idx - 1];
                        const showDate = !prev || dayKey(prev.created_at) !== dayKey(msg.created_at);
                        const isMine = msg.sender_id === user?.id;
                        const isOffer =
                          msg.message_type === 'offer' || msg.offer_amount != null;
                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  margin: '12px 0 8px',
                                }}
                              >
                                <div style={{ flex: 1, height: 1, backgroundColor: COLOR.border }} />
                                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
                                  {formatDateDivider(msg.created_at)}
                                </div>
                                <div style={{ flex: 1, height: 1, backgroundColor: COLOR.border }} />
                              </div>
                            )}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: isMine ? 'flex-end' : 'flex-start',
                                alignItems: 'flex-end',
                                gap: 6,
                              }}
                            >
                              {!isMine && (
                                <Avatar
                                  url={selectedConversation.other_user_avatar}
                                  name={selectedConversation.other_user_name}
                                  size={24}
                                />
                              )}
                              <div
                                style={{
                                  maxWidth: '70%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: isMine ? 'flex-end' : 'flex-start',
                                }}
                              >
                                {isOffer ? (
                                  <div
                                    style={{
                                      padding: '10px 14px',
                                      borderRadius: 14,
                                      backgroundColor: '#fff',
                                      border: `1.5px solid ${COLOR.purple}`,
                                      color: COLOR.textDark,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                    }}
                                  >
                                    <Tag size={16} color={COLOR.purple} />
                                    <div>
                                      <div
                                        style={{
                                          fontSize: 11,
                                          color: COLOR.purple,
                                          fontWeight: 700,
                                          textTransform: 'uppercase',
                                          letterSpacing: 0.5,
                                        }}
                                      >
                                        Offer
                                      </div>
                                      <div style={{ fontSize: 15, fontWeight: 700 }}>
                                        {formatPrice(msg.offer_amount)}
                                      </div>
                                      {msg.content && (
                                        <div style={{ fontSize: 13, color: COLOR.textMed, marginTop: 2 }}>
                                          {msg.content}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      padding: '9px 13px',
                                      borderRadius: 14,
                                      backgroundColor: isMine ? COLOR.green : '#fff',
                                      color: isMine ? '#fff' : COLOR.textDark,
                                      border: isMine ? 'none' : `1px solid ${COLOR.border}`,
                                      fontSize: 14,
                                      lineHeight: 1.4,
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {msg.content}
                                  </div>
                                )}
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: COLOR.textLight,
                                    marginTop: 3,
                                    padding: '0 4px',
                                  }}
                                >
                                  {formatClockTime(msg.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {otherTyping && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: COLOR.textLight,
                          fontSize: 12,
                          fontStyle: 'italic',
                          padding: '4px 8px',
                        }}
                      >
                        {selectedConversation.other_user_name || 'User'} is typing…
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div
                    style={{
                      borderTop: `1px solid ${COLOR.border}`,
                      backgroundColor: COLOR.panel,
                      padding: 10,
                    }}
                  >
                    {sendError && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#B91C1C',
                          padding: '0 4px 6px',
                        }}
                      >
                        {sendError}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                      <textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={handleDraftChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message…"
                        rows={1}
                        maxLength={2000}
                        style={{
                          flex: 1,
                          resize: 'none',
                          border: `1px solid ${COLOR.border}`,
                          borderRadius: 10,
                          padding: '10px 12px',
                          fontSize: 14,
                          fontFamily: 'inherit',
                          lineHeight: 1.4,
                          outline: 'none',
                          minHeight: 40,
                          maxHeight: 92,
                          letterSpacing: 0,
                          backgroundColor: COLOR.panel,
                          color: COLOR.textDark,
                        }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!draft.trim() || sending}
                        style={{
                          backgroundColor: !draft.trim() || sending ? '#D1D5DB' : COLOR.green,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          padding: '10px 14px',
                          cursor: !draft.trim() || sending ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: 'inherit',
                        }}
                      >
                        <Send size={16} />
                        Send
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: `calc(100vh - ${NAV_H}px)`,
            backgroundColor: COLOR.pageBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLOR.textLight,
            fontSize: 14,
          }}
        >
          Loading…
        </div>
      }
    >
      <MessagesPageInner />
    </Suspense>
  );
}
