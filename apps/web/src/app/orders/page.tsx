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
import OrderStatusBadge from '@/components/OrderStatusBadge';

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

/** Status values that count as "in progress" for client-side filtering */
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
        setOrders(res.orders);
      } else {
        const res = await getMySales();
        setOrders(res.orders);
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '96px 0' }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '2px solid #1DC690',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  const filtered = filterOrders(orders, filter);

  return (
    <div style={{ backgroundColor: '#EAEAE0' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 767px) {
          .orders-page { padding-left: 12px !important; padding-right: 12px !important; }
        }
      `}</style>

      <div
        className="orders-page"
        style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 48px' }}
      >
        {/* Title */}
       <PageHeader title="Orders" />

        {/* ── Tabs ── */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #e0e0d8',
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
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: 20,
                border:
                  filter === chip.key ? 'none' : '1px solid #e0e0e0',
                backgroundColor:
                  filter === chip.key ? '#1DC690' : '#fff',
                color: filter === chip.key ? '#fff' : '#555',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── Order list ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 90,
                  borderRadius: 12,
                  backgroundColor: '#e0e0d8',
                  animation: 'spin 1.5s ease-in-out infinite',
                  animationName: 'none',
                  opacity: 0.6,
                }}
                className="animate-pulse"
              />
            ))}
          </div>
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
        fontWeight: 600,
        color: '#06070A',
        background: 'none',
        border: 'none',
        borderBottom: active ? '3px solid #1DC690' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
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
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 6px',
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

/* ══ ORDER CARD ════════════════════════════════════════ */

function OrderCard({ order, tab }: { order: AnyOrder; tab: TabKey }) {
  const raw = Number(order.amount);
  const buyerPrice = raw * 1.075 + 0.99;
  const isSold = tab === 'sold';

  /* Determine counterparty name */
  const counterpartyName = isSold
    ? (order as SoldOrder).buyer_name
    : (order as PurchasedOrder).seller_name;

  const roleLabel = isSold ? 'Buyer' : 'Seller';

  return (
    <Link
      href={`/orders/${order.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          backgroundColor: '#fff',
          borderRadius: 12,
          border: '0.5px solid #e8e8e4',
          padding: 14,
          cursor: 'pointer',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = '#fafaf8')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = '#fff')
        }
      >
        {/* Image */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#f0f0ec',
            flexShrink: 0,
          }}
        >
          {order.listing_image ? (
            <img
              src={order.listing_image}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={28} color="#ccc" />
            </div>
          )}
        </div>

        {/* Centre */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
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
              fontSize: 12,
              color: '#888',
              marginTop: 2,
            }}
          >
            {roleLabel}: {counterpartyName}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              fontWeight: 700,
              color: '#1DC690',
              marginTop: 3,
            }}
          >
            {fp(buyerPrice)}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              color: '#aaa',
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
          <OrderStatusBadge status={order.status} />
          <ChevronRight size={16} color="#ccc" />
        </div>
      </div>
    </Link>
  );
}

/* ══ EMPTY STATE ═══════════════════════════════════════ */

function EmptyOrders({ tab, filter }: { tab: TabKey; filter: FilterKey }) {
  const messages: Record<FilterKey, { heading: string; sub: string }> = {
    all: {
      heading:
        tab === 'purchases'
          ? 'No purchases yet'
          : 'No sales yet',
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
        padding: '60px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: '#e0e0d8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Package size={28} color="#9a9a92" />
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 17,
          fontWeight: 700,
          color: '#06070A',
          margin: '0 0 6px',
        }}
      >
        {msg.heading}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: '#888',
          margin: 0,
          maxWidth: 280,
        }}
      >
        {msg.sub}
      </p>
    </div>
  );
}
