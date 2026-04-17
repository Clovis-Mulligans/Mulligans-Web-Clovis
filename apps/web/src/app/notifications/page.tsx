'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MessageCircle,
  Heart,
  Package,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  CreditCard,
  FileText,
  AlertTriangle,
  AlertCircle,
  MessagesSquare,
  ArrowLeftRight,
  Tag,
  Clock,
  ShieldCheck,
  Award,
  Trophy,
  Hand,
  Info,
  Megaphone,
  RefreshCw,
  UserCircle,
  Wallet,
  CheckCheck,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import {
  apiClient,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from '@mulligans/api-client';

// Palette matches the brief's design system.
const PALETTE = {
  bg: '#EAEAE0',
  card: '#FFFFFF',
  green: '#1DC690',
  blue: '#278AB0',
  offersPurple: '#7C5CBF',
  textDark: '#111827',
  textLight: '#6B7280',
  border: '#E5E7EB',
  unreadBg: '#F0FDF4',
};

// CloudFront CDN for any S3 image paths stored as relative keys.
const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net';

function resolveImage(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${CLOUDFRONT_BASE}/${url.replace(/^\//, '')}`;
}

// ─── Type helpers (mirror mobile) ──────────────────────────────────────────

const ORDER_TYPES = new Set([
  'order', 'sale', 'shipped', 'delivered', 'payout', 'cancelled', 'refund',
  'order_shipped', 'order_delivered', 'shipping_label_created',
  'order_cancelled', 'payout_pending', 'payment_processing', 'payment_received',
]);

const BUYER_TYPES = new Set([
  'order', 'shipped', 'delivered', 'order_shipped', 'order_delivered',
  'shipping_label_created', 'payment_processing',
]);

const DISPUTE_TYPES = new Set([
  'dispute', 'dispute_update', 'dispute_escalated', 'dispute_resolved', 'dispute_counter',
]);

const OFFER_TYPES = new Set([
  'offer', 'new_offer', 'offer_received', 'offer_accepted', 'offer_declined',
  'offer_expired', 'offer_countered', 'counter_offer', 'purchase_expired',
  'offer_void', 'offer_expiring',
]);

const SYSTEM_TYPES = new Set([
  'verified_status', 'badge', 'achievement', 'welcome', 'system',
  'promotion', 'update', 'account',
]);

const MESSAGE_OFFER_RECEIVED_TYPES = new Set(['new_offer', 'offer_received']);

function isOrderType(t: string) { return ORDER_TYPES.has(t); }
function isBuyerType(t: string) { return BUYER_TYPES.has(t); }
function isDisputeType(t: string) { return DISPUTE_TYPES.has(t); }
function isOfferType(t: string) { return OFFER_TYPES.has(t); }
function isSystemType(t: string) { return SYSTEM_TYPES.has(t); }

// Map mobile "Counter Offer" wording to "Counter Dispute" on dispute rows.
function fixTitle(title: string, type: string): string {
  if (!isDisputeType(type)) return title;
  return title
    .replace(/Counter Offer/gi, 'Counter Dispute')
    .replace(/counter offer/gi, 'counter dispute');
}

// Relative time — Just now / Xm ago / Xh ago / Xd ago / date.
function formatTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

// Lucide equivalent of each Ionicons entry from mobile activity.tsx.
function getIconAndColor(type: string): { Icon: React.ComponentType<{ size?: number | string; color?: string }>; color: string } {
  switch (type) {
    case 'message': return { Icon: MessageCircle, color: '#1C4670' };
    case 'favorite': return { Icon: Heart, color: '#EF4444' };
    case 'order': return { Icon: ShoppingBag, color: '#1DC690' };
    case 'sale': return { Icon: Wallet, color: '#22C55E' };
    case 'payout':
    case 'payout_pending': return { Icon: Wallet, color: '#F59E0B' };
    case 'shipped':
    case 'order_shipped': return { Icon: Truck, color: '#278AB0' };
    case 'delivered':
    case 'order_delivered': return { Icon: CheckCircle, color: '#22C55E' };
    case 'cancelled':
    case 'order_cancelled': return { Icon: XCircle, color: '#EF4444' };
    case 'refund': return { Icon: RotateCcw, color: '#F59E0B' };
    case 'payment_processing': return { Icon: CreditCard, color: '#3B82F6' };
    case 'payment_received': return { Icon: CreditCard, color: '#22C55E' };
    case 'shipping_label_created': return { Icon: FileText, color: '#278AB0' };
    case 'dispute': return { Icon: AlertTriangle, color: '#F97316' };
    case 'dispute_update': return { Icon: MessagesSquare, color: '#3B82F6' };
    case 'dispute_counter': return { Icon: ArrowLeftRight, color: '#8B5CF6' };
    case 'dispute_escalated': return { Icon: AlertCircle, color: '#EF4444' };
    case 'dispute_resolved': return { Icon: CheckCircle, color: '#22C55E' };
    case 'offer':
    case 'new_offer':
    case 'offer_received': return { Icon: Tag, color: '#7159A8' };
    case 'offer_accepted': return { Icon: CheckCircle, color: '#22C55E' };
    case 'offer_declined': return { Icon: XCircle, color: '#EF4444' };
    case 'offer_expiring': return { Icon: Clock, color: '#F59E0B' };
    case 'offer_countered':
    case 'counter_offer': return { Icon: ArrowLeftRight, color: '#F59E0B' };
    case 'verified_status': return { Icon: ShieldCheck, color: '#278AB0' };
    case 'badge': return { Icon: Award, color: '#8B5CF6' };
    case 'achievement': return { Icon: Trophy, color: '#F59E0B' };
    case 'welcome': return { Icon: Hand, color: '#1DC690' };
    case 'system': return { Icon: Info, color: '#6B7280' };
    case 'promotion': return { Icon: Megaphone, color: '#EC4899' };
    case 'update': return { Icon: RefreshCw, color: '#3B82F6' };
    case 'account': return { Icon: UserCircle, color: '#278AB0' };
    default: return { Icon: Bell, color: '#278AB0' };
  }
}

// ─── Page component ────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  // Auth gate — redirect unauthenticated users.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/notifications');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setError(null);
    try {
      const res = await getNotifications();
      const list = (res as { notifications?: Notification[] }).notifications
        || (Array.isArray(res) ? (res as unknown as Notification[]) : []);
      setNotifications(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications],
  );

  // ─── Navigation — mirrors mobile activity.tsx handleNotificationPress ───
  const navigateForNotification = useCallback(async (n: Notification) => {
    if (!n.related_id) return;

    if (isDisputeType(n.type)) {
      // Fetch the dispute to discover the order_id and which side the viewer is on.
      try {
        const disputeRes = await apiClient.get<{ dispute?: { order_id?: string; is_buyer?: boolean } }>(
          `/api/disputes/${n.related_id}`,
        );
        const orderId = disputeRes.dispute?.order_id;
        if (orderId) {
          router.push(`/orders/${orderId}`);
        } else {
          router.push('/orders');
        }
      } catch {
        router.push('/orders');
      }
      return;
    }

    if (isOrderType(n.type)) {
      // Web has a single /orders/[id] route (unlike mobile's split purchase/sold).
      router.push(`/orders/${n.related_id}`);
      return;
    }

    if (n.type === 'message') {
      router.push(`/messages?id=${encodeURIComponent(n.related_id)}`);
      return;
    }

    if (isOfferType(n.type)) {
      let tab: 'received' | 'made' = 'made';
      if (MESSAGE_OFFER_RECEIVED_TYPES.has(n.type)) {
        tab = 'received';
      } else if (n.type === 'offer') {
        const title = (n.title || '').toLowerCase();
        if (title.includes('new') || title.includes('received')) tab = 'received';
      }
      router.push(`/offers?tab=${tab}`);
      return;
    }

    if (!isSystemType(n.type)) {
      // Favourites and any fallback with a related_id → listing page.
      router.push(`/listings/${n.related_id}`);
    }
    // System notifications don't navigate.
  }, [router]);

  const handleClick = useCallback(async (n: Notification) => {
    if (!n.is_read) {
      // Optimistic: flip the row immediately so the dot/tint clears.
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      markNotificationRead(n.id).catch(() => {
        // Revert on failure.
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: false } : x));
      });
    }
    navigateForNotification(n);
  }, [navigateForNotification]);

  const handleMarkAll = useCallback(async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    const prev = notifications;
    setNotifications(prev.map(n => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      setNotifications(prev);
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll, unreadCount, notifications]);

  // ─── Render branches ────────────────────────────────────────────────────

  if (authLoading || !isAuthenticated) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: PALETTE.textLight, fontSize: 14,
      }}>
        Loading…
      </div>
    );
  }

  const markAllAction = unreadCount > 0 ? (
    <button
      type="button"
      onClick={handleMarkAll}
      disabled={markingAll}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 8,
        border: `1px solid ${PALETTE.border}`,
        backgroundColor: PALETTE.card,
        color: PALETTE.blue,
        fontSize: 13,
        fontWeight: 600,
        cursor: markingAll ? 'not-allowed' : 'pointer',
        opacity: markingAll ? 0.6 : 1,
      }}
    >
      <CheckCheck size={16} color={PALETTE.blue} />
      Mark All Read
    </button>
  ) : null;

  return (
    <div style={{ backgroundColor: PALETTE.bg, minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <PageHeader title="Notifications" action={markAllAction} />

        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <NotificationSkeletons />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(n => (
              <NotificationCard
                key={n.id}
                notification={n}
                onClick={() => handleClick(n)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function NotificationCard({ notification, onClick }: {
  notification: Notification;
  onClick: () => void;
}) {
  const { Icon, color } = getIconAndColor(notification.type);
  const isSystem = isSystemType(notification.type);
  const title = fixTitle(notification.title || '', notification.type);
  const image = resolveImage(notification.image_url);
  const avatar = resolveImage(notification.related_user_avatar);
  const unread = !notification.is_read;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        backgroundColor: unread ? PALETTE.unreadBg : PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        borderLeft: unread ? `3px solid ${PALETTE.green}` : `1px solid ${PALETTE.border}`,
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'background-color 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = unread ? '#E6FBF0' : '#FAFAF6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = unread ? PALETTE.unreadBg : PALETTE.card;
      }}
    >
      {/* Icon circle */}
      <div style={{
        flexShrink: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={18} color="#FFFFFF" />
      </div>

      {/* Listing image or user avatar (hidden for system types) */}
      {!isSystem && (
        <div style={{ flexShrink: 0 }}>
          {image ? (
            <img
              src={image}
              alt=""
              style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', display: 'block' }}
            />
          ) : avatar ? (
            <img
              src={avatar}
              alt=""
              style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: 8,
              backgroundColor: '#F3F4F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={20} color="#9CA3AF" />
            </div>
          )}
        </div>
      )}

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: 11,
          color: '#9CA3AF',
          marginBottom: 2,
        }}>
          {formatTime(notification.created_at)}
        </div>
        <div style={{
          fontSize: 14,
          fontWeight: unread ? 700 : 600,
          color: PALETTE.textDark,
          lineHeight: 1.35,
          marginBottom: 2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 13,
          color: '#374151',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {notification.message}
        </div>
      </div>

      {/* Unread dot */}
      {unread && (
        <div style={{
          flexShrink: 0,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: PALETTE.green,
          marginLeft: 4,
        }} />
      )}
    </div>
  );
}

function NotificationSkeletons() {
  const rows = [0, 1, 2, 3, 4];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map(i => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            backgroundColor: PALETTE.card,
            border: `1px solid ${PALETTE.border}`,
            borderRadius: 10,
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: '#E5E7EB',
          }} />
          <div style={{
            width: 48, height: 48, borderRadius: 8,
            backgroundColor: '#E5E7EB',
          }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 12, width: '40%', backgroundColor: '#E5E7EB', borderRadius: 4 }} />
            <div style={{ height: 10, width: '90%', backgroundColor: '#EFEFE9', borderRadius: 4 }} />
            <div style={{ height: 10, width: '70%', backgroundColor: '#EFEFE9', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      backgroundColor: PALETTE.card,
      border: `1px solid ${PALETTE.border}`,
      borderRadius: 12,
      padding: '64px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Bell size={40} color="#9CA3AF" />
      </div>
      <div style={{
        fontSize: 18,
        fontWeight: 600,
        color: PALETTE.textDark,
        marginBottom: 6,
      }}>
        No notifications yet
      </div>
      <div style={{
        fontSize: 13,
        color: PALETTE.textLight,
        maxWidth: 360,
        lineHeight: 1.5,
      }}>
        You&apos;ll see updates about orders, messages, offers, and more here.
      </div>
    </div>
  );
}
