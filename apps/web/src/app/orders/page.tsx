'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  RefreshCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import {
  getMyPurchases,
  getMySales,
  getOrderCounts,
} from '@mulligans/api-client';
import type {
  PurchasedOrder,
  SoldOrder,
  OrderCounts,
} from '@mulligans/api-client';

/* ── Helpers ──────────────────────────────────────────── */

const fp = (n: number) => `£${n.toFixed(2)}`;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Last 8 chars of an order id, uppercased — e.g. "A8F23491" */
function shortOrderId(id: string): string {
  if (!id) return '';
  const tail = id.replace(/-/g, '').slice(-8);
  return tail.toUpperCase();
}

/** Counterparty initials for mini-avatar fallback */
function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type TabKey = 'purchases' | 'sold';
type FilterKey = 'all' | 'in_progress' | 'cancelled' | 'completed';

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'completed', label: 'Completed' },
];

const IN_PROGRESS_STATUSES = [
  'pending',
  'paid',
  'to_ship',
  'in_transit',
  'shipped',
  'delivered',
];

const ACTION_NEEDED_BUYER_STATUSES = ['delivered'];
const ACTION_NEEDED_SELLER_STATUSES = ['paid', 'to_ship'];

type AnyOrder = PurchasedOrder | SoldOrder;

function filterOrders(orders: AnyOrder[], filter: FilterKey): AnyOrder[] {
  if (filter === 'all') return orders;
  if (filter === 'in_progress')
    return orders.filter((o) => IN_PROGRESS_STATUSES.includes(o.status));
  if (filter === 'cancelled')
    return orders.filter((o) => o.status === 'cancelled');
  if (filter === 'completed')
    return orders.filter((o) => o.status === 'completed');
  return orders;
}

/* ── Status badge config ──────────────────────────────── */

const STATUS_BADGE_CONFIG: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  pending:    { bg: 'rgba(39,138,176,0.10)', color: '#278AB0', label: 'Pending'    },
  paid:       { bg: 'rgba(39,138,176,0.10)', color: '#278AB0', label: 'Paid'       },
  to_ship:    { bg: 'rgba(245,158,11,0.10)', color: '#92400E', label: 'To Ship'    },
  in_transit: { bg: 'rgba(39,138,176,0.10)', color: '#1C4670', label: 'In Transit' },
  shipped:    { bg: 'rgba(39,138,176,0.10)', color: '#1C4670', label: 'Shipped'    },
  delivered:  { bg: 'rgba(29,198,144,0.10)', color: '#065F46', label: 'Delivered'  },
  completed:  { bg: 'rgba(29,198,144,0.10)', color: '#065F46', label: 'Completed'  },
  cancelled:  { bg: 'rgba(239,68,68,0.08)',  color: '#991B1B', label: 'Cancelled'  },
  disputed:   { bg: 'rgba(249,115,22,0.08)', color: '#9A3412', label: 'Disputed'   },
  refunded:   { bg: 'rgba(245,158,11,0.10)', color: '#92400E', label: 'Refunded'   },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_BADGE_CONFIG[status] ?? {
    bg: 'rgba(156,163,175,0.10)',
    color: '#6B7280',
    label: status.replace(/_/g, ' '),
  };
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: c.bg,
        color: c.color,
        borderRadius: 20,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        textTransform: 'capitalize',
      }}
    >
      {c.label}
    </span>
  );
}

/* ══ NEXT ACTION ═════════════════════════════════════════
   Edit the strings in NEXT_ACTION_COPY below to tune copy.
   Tone keys map to colours:
     'info'   → blue tint  (informational)
     'action' → green tint (your action — primary nudge)
     'warn'   → amber tint (attention required, non-urgent)
     'danger' → red tint   (problem / awaiting resolution)
   Set to null to suppress the pill for that status.
═══════════════════════════════════════════════════════ */

type ActionTone = 'info' | 'action' | 'warn' | 'danger';
type ActionPill = { text: string; tone: ActionTone; icon: 'package' | 'truck' | 'check' | 'alert' | 'clock' | 'refresh' } | null;

const NEXT_ACTION_COPY: Record<TabKey, Record<string, ActionPill>> = {
  /* ── Buyer (Purchases tab) ── */
  purchases: {
    pending:    { text: 'Awaiting payment confirmation',          tone: 'info',   icon: 'clock'   },
    paid:       { text: 'Awaiting seller dispatch',               tone: 'info',   icon: 'clock'   },
    to_ship:    { text: 'Awaiting seller dispatch',               tone: 'info',   icon: 'clock'   },
    shipped:    { text: 'Track package',                          tone: 'info',   icon: 'truck'   },
    in_transit: { text: 'Track package',                          tone: 'info',   icon: 'truck'   },
    delivered:  { text: 'Confirm receipt to release payment',     tone: 'action', icon: 'check'   },
    completed:  null,
    cancelled:  null,
    disputed:   { text: 'Awaiting Mulligans review',              tone: 'danger', icon: 'alert'   },
    refunded:   { text: 'Refund issued',                          tone: 'info',   icon: 'refresh' },
  },
  /* ── Seller (Sold tab) ── */
  sold: {
    pending:    { text: 'Awaiting buyer payment',                 tone: 'info',   icon: 'clock'   },
    paid:       { text: 'Add tracking & ship item',               tone: 'action', icon: 'package' },
    to_ship:    { text: 'Add tracking & ship item',               tone: 'action', icon: 'package' },
    shipped:    { text: 'On its way to buyer',                    tone: 'info',   icon: 'truck'   },
    in_transit: { text: 'On its way to buyer',                    tone: 'info',   icon: 'truck'   },
    delivered:  { text: 'Awaiting buyer confirmation',            tone: 'info',   icon: 'clock'   },
    completed:  null,
    cancelled:  null,
    disputed:   { text: 'Awaiting Mulligans review',              tone: 'danger', icon: 'alert'   },
    refunded:   { text: 'Refund issued to buyer',                 tone: 'info',   icon: 'refresh' },
  },
};

const ACTION_TONE_STYLES: Record<ActionTone, { bg: string; color: string }> = {
  info:   { bg: 'rgba(39,138,176,0.08)',  color: '#1C4670' },
  action: { bg: 'rgba(29,198,144,0.10)',  color: '#065F46' },
  warn:   { bg: 'rgba(245,158,11,0.10)',  color: '#92400E' },
  danger: { bg: 'rgba(239,68,68,0.08)',   color: '#991B1B' },
};

function ActionIcon({ name, color }: { name: NonNullable<ActionPill>['icon']; color: string }) {
  const props = { size: 13 as number | string, color };
  switch (name) {
    case 'package':  return <Package {...props} />;
    case 'truck':    return <Truck {...props} />;
    case 'check':    return <CheckCircle {...props} />;
    case 'alert':    return <AlertCircle {...props} />;
    case 'clock':    return <Clock {...props} />;
    case 'refresh':  return <RefreshCcw {...props} />;
    default:         return null;
  }
}

function NextActionPill({ pill }: { pill: NonNullable<ActionPill> }) {
  const styles = ACTION_TONE_STYLES[pill.tone];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        backgroundColor: styles.bg,
        color: styles.color,
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        width: 'fit-content',
        maxWidth: '100%',
      }}
    >
      <ActionIcon name={pill.icon} color={styles.color} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {pill.text}
      </span>
    </div>
  );
}

/* ══ MINI AVATAR ═══════════════════════════════════════ */

function MiniAvatar({ name, size = 26 }: { name: string | null | undefined; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #278AB0, #1C4670)',
        color: '#FFFFFF',
        fontSize: Math.round(size * 0.42),
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '0.02em',
      }}
    >
      {initials(name)}
    </div>
  );
}

/* ══ PAGE ══════════════════════════════════════════════ */

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('purchases');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [orders, setOrders] = useState<AnyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<OrderCounts | null>(null);

  /* Auth gate */
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [isLoading, isAuthenticated, router]);

  /* Fetch counts */
  useEffect(() => {
    if (!isAuthenticated) return;
    getOrderCounts()
      .then(setCounts)
      .catch(() => {});
  }, [isAuthenticated]);

  /* Fetch orders on tab change */
  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      if (tab === 'purchases') {
        const res = await getMyPurchases();
        const d = (res as any)?.data?.data ?? (res as any)?.data ?? res;
        setOrders(d.orders ?? []);
      } else {
        const res = await getMySales();
        const d = (res as any)?.data?.data ?? (res as any)?.data ?? res;
        setOrders(d.orders ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, tab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* Reset filter when switching tabs */
  useEffect(() => {
    setFilter('all');
  }, [tab]);

  /* Auth loading */
  if (isLoading || !isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '96px 0',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: 32,
            height: 32,
            border: '2px solid #1DC690',
            borderTopColor: 'transparent',
            borderRadius: '50%',
          }}
        />
      </div>
    );
  }

  const filtered = filterOrders(orders, filter);

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <div
        style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px 48px' }}
      >
        {/* Title */}
        <PageHeader title="Orders" />

        {/* ── Summary strip ── */}
        <SummaryStrip orders={orders} tab={tab} loading={loading} />

        {/* ── Tabs ── */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E5E7EB',
            marginBottom: 16,
          }}
        >
          <TabButton
            active={tab === 'purchases'}
            onClick={() => setTab('purchases')}
            label="Purchases"
            count={counts?.new_purchases}
          />
          <TabButton
            active={tab === 'sold'}
            onClick={() => setTab('sold')}
            label="Sold"
            count={counts?.pending_sales}
          />
        </div>

        {/* ── Filter chips ── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          {FILTER_CHIPS.map((chip) => (
            <FilterPill
              key={chip.key}
              active={filter === chip.key}
              label={chip.label}
              onClick={() => setFilter(chip.key)}
            />
          ))}
        </div>

        {/* ── Order list ── */}
        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyOrders tab={tab} filter={filter} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} tab={tab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ SUMMARY STRIP ═════════════════════════════════════ */

function SummaryStrip({
  orders,
  tab,
  loading,
}: {
  orders: AnyOrder[];
  tab: TabKey;
  loading: boolean;
}) {
  const stats = useMemo(() => {
    const total = orders.length;

    const actionStatuses =
      tab === 'purchases' ? ACTION_NEEDED_BUYER_STATUSES : ACTION_NEEDED_SELLER_STATUSES;
    const actionNeeded = orders.filter((o) => actionStatuses.includes(o.status)).length;

    const inTransit = orders.filter((o) =>
      ['shipped', 'in_transit'].includes(o.status),
    ).length;

    /* Money figure:
       - Purchases tab → Total Spent (buyer price = amount * 1.075 + 0.99)
       - Sold tab     → Total Earned (seller take = amount, no fee deduction
                                       known — adjust formula here if seller-side
                                       fees apply later) */
    const moneyExcludeStatuses = ['cancelled', 'refunded'];
    const moneyTotal = orders
      .filter((o) => !moneyExcludeStatuses.includes(o.status))
      .reduce((sum, o) => {
        const raw = Number(o.amount) || 0;
        return sum + (tab === 'purchases' ? raw * 1.075 + 0.99 : raw);
      }, 0);

    return { total, actionNeeded, inTransit, moneyTotal };
  }, [orders, tab]);

  const moneyLabel = tab === 'purchases' ? 'Total Spent' : 'Total Earned';

  const cards: { label: string; value: string; sub: string; valueColor?: string }[] = [
    {
      label: 'Total Orders',
      value: loading ? '—' : String(stats.total),
      sub: 'All time',
    },
    {
      label: 'Awaiting You',
      value: loading ? '—' : String(stats.actionNeeded),
      sub: stats.actionNeeded === 0 ? "You're all caught up" : 'Action needed',
      valueColor: stats.actionNeeded > 0 ? '#92400E' : '#06070A',
    },
    {
      label: moneyLabel,
      value: loading ? '—' : fp(stats.moneyTotal),
      sub: 'Excl. cancelled & refunded',
      valueColor: '#1DC690',
    },
    {
      label: 'In Transit',
      value: loading ? '—' : String(stats.inTransit),
      sub: stats.inTransit === 1 ? 'Arriving soon' : 'On the way',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: 28,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: 14,
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#278AB0',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: card.valueColor ?? '#06070A',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.1,
            }}
          >
            {card.value}
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#9CA3AF',
              marginTop: 4,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══ FILTER PILL ═══════════════════════════════════════ */

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 500,
        padding: '8px 16px',
        borderRadius: 20,
        border: active ? 'none' : `1px solid ${hovered ? '#D1D5DB' : '#E5E7EB'}`,
        backgroundColor: active ? '#06070A' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#6B7280',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

/* ══ TAB BUTTON ════════════════════════════════════════ */

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 0',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: active ? 600 : 500,
        color: active ? '#06070A' : '#9CA3AF',
        background: 'none',
        border: 'none',
        borderBottom: active ? '2px solid #1DC690' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {label}
      {count != null && count > 0 && (
        <span
          style={{
            backgroundColor: '#1DC690',
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 7px',
            borderRadius: 10,
            lineHeight: '16px',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ══ SKELETON LIST ═════════════════════════════════════ */

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            display: 'grid',
            gridTemplateColumns: '88px 1fr 140px',
            alignItems: 'center',
            gap: 18,
            backgroundColor: '#F7F7F5',
            borderRadius: 14,
            padding: 16,
            minHeight: 120,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 12,
              backgroundColor: '#E5E7EB',
              flexShrink: 0,
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                height: 16,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: '50%',
              }}
            />
            <div
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: '35%',
              }}
            />
            <div
              style={{
                height: 28,
                borderRadius: 8,
                backgroundColor: '#E5E7EB',
                width: '40%',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 8,
            }}
          >
            <div
              style={{
                height: 18,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: 80,
              }}
            />
            <div
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: 60,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══ ORDER CARD ════════════════════════════════════════ */

function OrderCard({ order, tab }: { order: AnyOrder; tab: TabKey }) {
  const [hovered, setHovered] = useState(false);
  const raw = Number(order.amount);
  const buyerPrice = raw * 1.075 + 0.99;
  const isSold = tab === 'sold';
  const isCancelled = order.status === 'cancelled';

  /* For sold tab show seller's amount (raw); for purchases show buyer-paid total */
  const displayPrice = isSold ? raw : buyerPrice;

  const counterpartyName = isSold
    ? (order as SoldOrder).buyer_name
    : (order as PurchasedOrder).seller_name;
  const roleLabel = isSold ? 'Buyer' : 'Seller';

  /* Image extraction — prefer images array, fall back to flat field */
  const imgs = (order as any).listing?.images as
    | { image_url: string; display_order?: number }[]
    | undefined;
  const sorted = imgs?.length
    ? [...imgs].sort(
        (a, b) => (a.display_order ?? 99) - (b.display_order ?? 99),
      )
    : [];
  const imageUrl = sorted[0]?.image_url || (order as any).listing_image || null;

  /* Resolve the next-action pill from the tuneable copy table */
  const pill = NEXT_ACTION_COPY[tab][order.status] ?? null;

  return (
    <Link
      href={`/orders/${order.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '88px 1fr auto',
          gap: 20,
          alignItems: 'center',
          backgroundColor: hovered ? '#FAFAF8' : '#FFFFFF',
          borderRadius: 14,
          border: `1px solid ${hovered ? '#D1D5DB' : '#E0E0E0'}`,
          padding: '16px 20px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        {/* ── Image ── */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: '#F7F7F5',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Package size={28} color="#9CA3AF" />
          )}
        </div>

        {/* ── Middle: title+badge / meta / pill ── */}
        <div
          style={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          {/* Title + status badge inline */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
                fontWeight: 600,
                color: '#06070A',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {order.listing_title}
            </span>
            <StatusBadge status={order.status} />
          </div>

          {/* Meta line: counterparty avatar + name · order id */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: '#6B7280',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MiniAvatar name={counterpartyName} size={26} />
              <span>
                {roleLabel}{' '}
                <span style={{ color: '#06070A', fontWeight: 500 }}>
                  {counterpartyName}
                </span>
              </span>
            </span>

            <span style={{ color: '#E0E0E0' }}>·</span>

            <span
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12,
                color: '#9CA3AF',
                letterSpacing: '0.02em',
              }}
            >
              #{shortOrderId(order.id)}
            </span>
          </div>

          {/* Next-action pill (only if applicable) */}
          {pill && <NextActionPill pill={pill} />}
        </div>

        {/* ── Right: price + date + chevron ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
            flexShrink: 0,
            minWidth: 100,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 18,
              fontWeight: 600,
              color: isCancelled ? '#9CA3AF' : '#1DC690',
              textDecoration: isCancelled ? 'line-through' : 'none',
            }}
          >
            {fp(displayPrice)}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: '#9CA3AF',
            }}
          >
            {formatDate(order.created_at)}
          </div>
          <ChevronRight size={18} color="#D1D5DB" style={{ marginTop: 2 }} />
        </div>
      </div>
    </Link>
  );
}

/* ══ EMPTY STATE ═══════════════════════════════════════ */

function EmptyOrders({ tab, filter }: { tab: TabKey; filter: FilterKey }) {
  const messages: Record<FilterKey, { heading: string; sub: string }> = {
    all: {
      heading: tab === 'purchases' ? 'No purchases yet' : 'No sales yet',
      sub:
        tab === 'purchases'
          ? 'When you buy something on Mulligans, it will appear here.'
          : 'When you sell something on Mulligans, it will appear here.',
    },
    in_progress: {
      heading: 'No orders in progress',
      sub: 'Orders that are being processed will appear here.',
    },
    cancelled: {
      heading: 'No cancelled orders',
      sub: 'Any cancelled orders will appear here.',
    },
    completed: {
      heading: 'No completed orders',
      sub: 'Completed orders will appear here.',
    },
  };

  const msg = messages[filter];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 0',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E0E0E0',
        borderRadius: 14,
      }}
    >
      <Package size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 16,
          fontWeight: 600,
          color: '#06070A',
          margin: '0 0 6px',
        }}
      >
        {msg.heading}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: '#9CA3AF',
          margin: 0,
          maxWidth: 320,
        }}
      >
        {msg.sub}
      </p>
    </div>
  );
}