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

/* ────────────────────────────────────────────────────────
   DESIGN TOKENS — keep in sync with mulligans-web-standards.md
   New platform spec: shadow allowed, weight 700 allowed
──────────────────────────────────────────────────────── */

const CARD_SHADOW =
  '0 4px 14px rgba(6,7,10,0.10), 0 2px 4px rgba(6,7,10,0.06)';
const CARD_SHADOW_HOVER =
  '0 8px 24px rgba(6,7,10,0.12), 0 3px 6px rgba(6,7,10,0.08)';
const SUMMARY_SHADOW =
  '0 4px 14px rgba(6,7,10,0.06), 0 2px 4px rgba(6,7,10,0.04)';

/* ──────────────────────────────────────────────────────── */

const fp = (n: number) => `£${n.toFixed(2)}`;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function shortOrderId(id: string): string {
  if (!id) return '';
  const tail = id.replace(/-/g, '').slice(-8);
  return tail.toUpperCase();
}

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

/* Status badges */

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
        padding: '5px 12px',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        textTransform: 'capitalize',
      }}
    >
      {c.label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════
   NEXT-ACTION COPY — edit strings to tune wording.
   Set entry to null to hide pill for that status.
═══════════════════════════════════════════════════════ */

type ActionTone = 'info' | 'action' | 'warn' | 'danger';
type ActionPill = {
  text: string;
  tone: ActionTone;
  icon: 'package' | 'truck' | 'check' | 'alert' | 'clock' | 'refresh';
} | null;

const NEXT_ACTION_COPY: Record<TabKey, Record<string, ActionPill>> = {
  purchases: {
    pending:    { text: 'Awaiting payment confirmation',      tone: 'info',   icon: 'clock'   },
    paid:       { text: 'Awaiting seller dispatch',           tone: 'info',   icon: 'clock'   },
    to_ship:    { text: 'Awaiting seller dispatch',           tone: 'info',   icon: 'clock'   },
    shipped:    { text: 'Track package',                      tone: 'info',   icon: 'truck'   },
    in_transit: { text: 'Track package',                      tone: 'info',   icon: 'truck'   },
    delivered:  { text: 'Confirm receipt to release payment', tone: 'action', icon: 'check'   },
    completed:  null,
    cancelled:  null,
    disputed:   { text: 'Awaiting Mulligans review',          tone: 'danger', icon: 'alert'   },
    refunded:   { text: 'Refund issued',                      tone: 'info',   icon: 'refresh' },
  },
  sold: {
    pending:    { text: 'Awaiting buyer payment',             tone: 'info',   icon: 'clock'   },
    paid:       { text: 'Add tracking & ship item',           tone: 'action', icon: 'package' },
    to_ship:    { text: 'Add tracking & ship item',           tone: 'action', icon: 'package' },
    shipped:    { text: 'On its way to buyer',                tone: 'info',   icon: 'truck'   },
    in_transit: { text: 'On its way to buyer',                tone: 'info',   icon: 'truck'   },
    delivered:  { text: 'Awaiting buyer confirmation',        tone: 'info',   icon: 'clock'   },
    completed:  null,
    cancelled:  null,
    disputed:   { text: 'Awaiting Mulligans review',          tone: 'danger', icon: 'alert'   },
    refunded:   { text: 'Refund issued to buyer',             tone: 'info',   icon: 'refresh' },
  },
};

const ACTION_TONE_STYLES: Record<ActionTone, { bg: string; color: string }> = {
  info:   { bg: 'rgba(39,138,176,0.08)', color: '#1C4670' },
  action: { bg: 'rgba(29,198,144,0.10)', color: '#065F46' },
  warn:   { bg: 'rgba(245,158,11,0.10)', color: '#92400E' },
  danger: { bg: 'rgba(239,68,68,0.08)',  color: '#991B1B' },
};

function ActionIcon({
  name,
  color,
}: {
  name: NonNullable<ActionPill>['icon'];
  color: string;
}) {
  const props: { size: number | string; color: string } = { size: 14, color };
  switch (name) {
    case 'package': return <Package {...props} />;
    case 'truck':   return <Truck {...props} />;
    case 'check':   return <CheckCircle {...props} />;
    case 'alert':   return <AlertCircle {...props} />;
    case 'clock':   return <Clock {...props} />;
    case 'refresh': return <RefreshCcw {...props} />;
    default:        return null;
  }
}

function NextActionPill({ pill }: { pill: NonNullable<ActionPill> }) {
  const styles = ACTION_TONE_STYLES[pill.tone];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        backgroundColor: styles.bg,
        color: styles.color,
        padding: '7px 13px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        width: 'fit-content',
        maxWidth: '100%',
      }}
    >
      <ActionIcon name={pill.icon} color={styles.color} />
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {pill.text}
      </span>
    </div>
  );
}

/* Mini avatar — uses real avatar URL if available, falls back to initials */

function MiniAvatar({
  name,
  url,
  size = 28,
}: {
  name: string | null | undefined;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? ''}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
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
        background: 'linear-gradient(135deg, #278AB0, #1C4670)',
        color: '#FFFFFF',
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
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

/* ════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('purchases');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [orders, setOrders] = useState<AnyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<OrderCounts | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getOrderCounts()
      .then(setCounts)
      .catch(() => {});
  }, [isAuthenticated]);

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

  useEffect(() => {
    setFilter('all');
  }, [tab]);

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
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '32px 32px 64px',
        }}
      >
        <PageHeader title="Orders" />

        <SummaryStrip orders={orders} tab={tab} loading={loading} />

        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E5E7EB',
            marginBottom: 18,
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

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 28,
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

        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyOrders tab={tab} filter={filter} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} tab={tab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   SUMMARY STRIP
═══════════════════════════════════════════════════════ */

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
      tab === 'purchases'
        ? ACTION_NEEDED_BUYER_STATUSES
        : ACTION_NEEDED_SELLER_STATUSES;
    const actionNeeded = orders.filter((o) =>
      actionStatuses.includes(o.status),
    ).length;

    const inTransit = orders.filter((o) =>
      ['shipped', 'in_transit'].includes(o.status),
    ).length;

    /* Money figure:
       - Purchases tab → Total Spent (buyer price = amount * 1.075 + 0.99)
       - Sold tab     → Total Earned (raw amount; adjust here if seller-side
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

  const inTransitSub =
    stats.inTransit === 0
      ? 'None right now'
      : stats.inTransit === 1
      ? 'Arriving soon'
      : 'On the way';

  const cards: {
    label: string;
    value: string;
    sub: string;
    valueColor?: string;
  }[] = [
    {
      label: 'Total Orders',
      value: loading ? '—' : String(stats.total),
      sub: 'All time',
    },
    {
      label: 'Awaiting You',
      value: loading ? '—' : String(stats.actionNeeded),
      sub: stats.actionNeeded === 0 ? "You're all caught up" : 'Action needed',
      valueColor:
        stats.actionNeeded > 0
          ? '#92400E'
          : loading
          ? '#06070A'
          : '#9CA3AF',
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
      sub: inTransitSub,
      valueColor: stats.inTransit === 0 && !loading ? '#9CA3AF' : '#06070A',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 32,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: '20px 22px',
            boxShadow: SUMMARY_SHADOW,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#278AB0',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              marginBottom: 10,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: card.valueColor ?? '#06070A',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
            }}
          >
            {card.value}
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#9CA3AF',
              marginTop: 6,
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
            }}
          >
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   FILTER PILL
═══════════════════════════════════════════════════════ */

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
        fontSize: 14,
        fontWeight: 600,
        padding: '10px 18px',
        borderRadius: 22,
        border: active
          ? 'none'
          : `1px solid ${hovered ? '#D1D5DB' : '#E5E7EB'}`,
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

/* ════════════════════════════════════════════════════════
   TAB BUTTON
═══════════════════════════════════════════════════════ */

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
        padding: '14px 0',
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        fontWeight: active ? 700 : 500,
        color: active ? '#06070A' : '#9CA3AF',
        background: 'none',
        border: 'none',
        borderBottom: active
          ? '2px solid #1DC690'
          : '2px solid transparent',
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
            fontSize: 12,
            fontWeight: 700,
            padding: '2px 8px',
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

/* ════════════════════════════════════════════════════════
   SKELETON LIST
═══════════════════════════════════════════════════════ */

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            display: 'grid',
            gridTemplateColumns: '130px 1fr 110px',
            alignItems: 'center',
            gap: 24,
            backgroundColor: '#F7F7F5',
            borderRadius: 16,
            padding: '20px 22px',
            minHeight: 170,
          }}
        >
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: 14,
              backgroundColor: '#E5E7EB',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div
              style={{
                height: 18,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: '50%',
              }}
            />
            <div
              style={{
                height: 14,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: '38%',
              }}
            />
            <div
              style={{
                height: 30,
                borderRadius: 8,
                backgroundColor: '#E5E7EB',
                width: '45%',
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
                height: 22,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: 90,
              }}
            />
            <div
              style={{
                height: 13,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: 70,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ORDER CARD
═══════════════════════════════════════════════════════ */

function OrderCard({ order, tab }: { order: AnyOrder; tab: TabKey }) {
  const [hovered, setHovered] = useState(false);
  const raw = Number(order.amount);
  const buyerPrice = raw * 1.075 + 0.99;
  const isSold = tab === 'sold';
  const isCancelled = order.status === 'cancelled';

  const displayPrice = isSold ? raw : buyerPrice;

  const counterpartyName = isSold
    ? (order as SoldOrder).buyer_name
    : (order as PurchasedOrder).seller_name;

  /* Avatar URL — auto-wires if backend ever returns one. Falls back to initials. */
  const counterpartyAvatar = isSold
    ? ((order as any).buyer_avatar_url as string | undefined)
    : ((order as any).seller_avatar_url as string | undefined);

  const roleLabel = isSold ? 'Buyer' : 'Seller';

  const imgs = (order as any).listing?.images as
    | { image_url: string; display_order?: number }[]
    | undefined;
  const sorted = imgs?.length
    ? [...imgs].sort(
        (a, b) => (a.display_order ?? 99) - (b.display_order ?? 99),
      )
    : [];
  const imageUrl = sorted[0]?.image_url || (order as any).listing_image || null;

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
          gridTemplateColumns: '130px 1fr auto',
          gap: 24,
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: `1px solid ${hovered ? '#D1D5DB' : '#E5E7EB'}`,
          padding: '20px 22px',
          cursor: 'pointer',
          boxShadow: hovered ? CARD_SHADOW_HOVER : CARD_SHADOW,
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          transition:
            'box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease',
        }}
      >
        {/* Image */}
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: 14,
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
            <Package size={36} color="#9CA3AF" />
          )}
        </div>

        {/* Middle column */}
        <div
          style={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}
        >
          {/* Title + status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 18,
                fontWeight: 700,
                color: '#06070A',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                letterSpacing: '-0.005em',
              }}
            >
              {order.listing_title}
            </span>
            <StatusBadge status={order.status} />
          </div>

          {/* Meta line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: '#6B7280',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <MiniAvatar
                name={counterpartyName}
                url={counterpartyAvatar}
                size={28}
              />
              <span>
                {roleLabel}{' '}
                <span style={{ color: '#06070A', fontWeight: 700 }}>
                  {counterpartyName}
                </span>
              </span>
            </span>

            <span style={{ color: '#E0E0E0' }}>·</span>

            <span
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 13,
                color: '#9CA3AF',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              #{shortOrderId(order.id)}
            </span>
          </div>

          {/* Next-action pill */}
          {pill && <NextActionPill pill={pill} />}
        </div>

        {/* Right column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
            flexShrink: 0,
            minWidth: 110,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 22,
              fontWeight: 700,
              color: isCancelled ? '#9CA3AF' : '#1DC690',
              textDecoration: isCancelled ? 'line-through' : 'none',
              letterSpacing: '-0.01em',
            }}
          >
            {fp(displayPrice)}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: '#9CA3AF',
              fontWeight: 500,
            }}
          >
            {formatDate(order.created_at)}
          </div>
          <ChevronRight size={20} color="#D1D5DB" style={{ marginTop: 4 }} />
        </div>
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════ */

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
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        boxShadow: CARD_SHADOW,
      }}
    >
      <Package size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 18,
          fontWeight: 700,
          color: '#06070A',
          margin: '0 0 6px',
        }}
      >
        {msg.heading}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: '#9CA3AF',
          margin: 0,
          maxWidth: 360,
          fontWeight: 500,
        }}
      >
        {msg.sub}
      </p>
    </div>
  );
}
