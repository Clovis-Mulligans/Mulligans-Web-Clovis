'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';
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

/* ── Status Badge ─────────────────────────────────────── */

const STATUS_BADGE_CONFIG: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  pending:    { bg: 'rgba(39,138,176,0.1)',  color: '#278AB0', label: 'Pending'    },
  paid:       { bg: 'rgba(39,138,176,0.1)',  color: '#278AB0', label: 'Paid'       },
  to_ship:    { bg: 'rgba(39,138,176,0.1)',  color: '#278AB0', label: 'To Ship'    },
  in_transit: { bg: 'rgba(39,138,176,0.1)',  color: '#278AB0', label: 'In Transit' },
  shipped:    { bg: 'rgba(39,138,176,0.1)',  color: '#278AB0', label: 'Shipped'    },
  delivered:  { bg: 'rgba(29,198,144,0.1)',  color: '#059669', label: 'Delivered'  },
  completed:  { bg: 'rgba(29,198,144,0.1)',  color: '#059669', label: 'Completed'  },
  cancelled:  { bg: 'rgba(239,68,68,0.08)', color: '#DC2626', label: 'Cancelled'  },
  disputed:   { bg: 'rgba(245,158,11,0.1)', color: '#D97706', label: 'Disputed'   },
  refunded:   { bg: 'rgba(124,92,191,0.1)', color: '#7C5CBF', label: 'Refunded'   },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_BADGE_CONFIG[status] ?? {
    bg: 'rgba(156,163,175,0.1)',
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
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
      }}
    >
      {c.label}
    </span>
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
        style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 48px' }}
      >
        {/* Title */}
        <PageHeader title="Orders" />

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
            marginBottom: 20,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} tab={tab} />
            ))}
          </div>
        )}
      </div>
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
        padding: '10px 0',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: active ? 600 : 400,
        color: active ? '#06070A' : '#9CA3AF',
        background: 'none',
        border: 'none',
        borderBottom: active ? '2px solid #1DC690' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
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
            padding: '2px 6px',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            backgroundColor: '#F7F7F5',
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 10,
              backgroundColor: '#E5E7EB',
              flexShrink: 0,
            }}
          />
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                height: 14,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: '60%',
              }}
            />
            <div
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: '40%',
              }}
            />
            <div
              style={{
                height: 14,
                borderRadius: 6,
                backgroundColor: '#E5E7EB',
                width: '30%',
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
        (a, b) => (a.display_order ?? 99) - (b.display_order ?? 99)
      )
    : [];
  const imageUrl = sorted[0]?.image_url || (order as any).listing_image || null;

  return (
    <Link
      href={`/orders/${order.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          border: `1px solid ${hovered ? '#D1D5DB' : '#E0E0E0'}`,
          padding: 16,
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
      >
        {/* Image */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 10,
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
            <Package size={24} color="#9CA3AF" />
          )}
        </div>

        {/* Centre */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              fontWeight: 600,
              color: '#06070A',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {order.listing_title}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: '#9CA3AF',
              marginTop: 2,
            }}
          >
            {roleLabel}: {counterpartyName}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              fontWeight: 600,
              color: '#1DC690',
              marginTop: 3,
            }}
          >
            {fp(buyerPrice)}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: '#D1D5DB',
              marginTop: 2,
            }}
          >
            {formatDate(order.created_at)}
          </div>
        </div>

        {/* Right */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <StatusBadge status={order.status} />
          <ChevronRight size={18} color="#D1D5DB" />
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
        padding: '60px 0',
        textAlign: 'center',
      }}
    >
      <Package size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 16,
          fontWeight: 500,
          color: '#6B7280',
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
          maxWidth: 280,
        }}
      >
        {msg.sub}
      </p>
    </div>
  );
}
