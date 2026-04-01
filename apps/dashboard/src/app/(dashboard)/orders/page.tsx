'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getMySales, getMyPurchases } from '@mulligans/api-client';
import type { SoldOrder, PurchasedOrder, OrderStatus } from '@mulligans/api-client';

// --- Status colour map (from design bible section 15) ---
const ORDER_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  completed: { bg: 'rgba(29,198,144,0.15)', text: '#1DC690' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', text: '#E53E3E' },
  in_progress: { bg: 'rgba(39,138,176,0.15)', text: '#278AB0' },
  to_ship: { bg: 'rgba(39,138,176,0.15)', text: '#278AB0' },
  in_transit: { bg: 'rgba(28,70,112,0.15)', text: '#1C4670' },
  delivered: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  disputed: { bg: 'rgba(239,68,68,0.12)', text: '#E53E3E' },
  refunded: { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' },
  returned: { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' },
  delivery_failed: { bg: 'rgba(239,68,68,0.12)', text: '#E53E3E' },
  pending: { bg: 'rgba(39,138,176,0.15)', text: '#278AB0' },
  paid: { bg: 'rgba(39,138,176,0.15)', text: '#278AB0' },
};

const STATUS_LABELS: Record<string, string> = {
  to_ship: 'To Ship',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
  refunded: 'Refunded',
  returned: 'Returned',
  delivery_failed: 'Delivery Failed',
  pending: 'Pending',
  paid: 'Paid',
  in_progress: 'In Progress',
};

const SOLD_FILTERS = ['all', 'to_ship', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed'] as const;
const PURCHASE_FILTERS = ['all', 'in_progress', 'in_transit', 'delivered', 'completed', 'cancelled'] as const;

function StatusBadge({ status }: { status: string }) {
  const style = ORDER_STATUS_STYLES[status] || { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontSize: '0.72rem',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 600,
      }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function EscrowCountdown({ escrowReleaseAt }: { escrowReleaseAt: string }) {
  const releaseDate = new Date(escrowReleaseAt);
  const now = new Date();
  const diffMs = releaseDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return (
    <div
      className="mt-3 rounded-b-xl px-4 py-2"
      style={{
        background: 'rgba(245,158,11,0.08)',
        borderTop: '1px solid rgba(245,158,11,0.2)',
      }}
    >
      <span style={{ color: '#F59E0B', fontSize: '0.78rem', fontFamily: 'Montserrat, sans-serif' }}>
        ⏱ Escrow releases in {diffDays} day{diffDays !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white p-4 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div className="flex gap-4">
        <div className="h-[72px] w-[72px] rounded-lg bg-[#F4F4F0] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-[#F4F4F0] animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-[#F4F4F0] animate-pulse" />
          <div className="h-4 w-1/4 rounded bg-[#F4F4F0] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPrice(amount: number) {
  return `£${amount.toFixed(2)}`;
}

// --- Sold Order Card ---
function SoldOrderCard({ order }: { order: SoldOrder }) {
  return (
    <div className="rounded-xl bg-white mb-3 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="h-[72px] w-[72px] flex-shrink-0 rounded-lg bg-[#F4F4F0] overflow-hidden">
            {order.listing_image ? (
              <img src={order.listing_image} alt={order.listing_title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {/* Row 1: Title + Date */}
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-bold text-[#0D0D0D]" style={{ fontSize: '0.95rem', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                {order.listing_title}
              </p>
              <span className="flex-shrink-0 text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>
                {formatDate(order.created_at)}
              </span>
            </div>

            {/* Row 2: Buyer + Status */}
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-[#F4F4F0] overflow-hidden flex-shrink-0">
                  {order.buyer_avatar ? (
                    <img src={order.buyer_avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#1DC690] text-white" style={{ fontSize: '0.6rem', fontWeight: 700 }}>
                      {(order.buyer_name || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-[#6B6B6B]" style={{ fontSize: '0.85rem' }}>{order.buyer_name || 'Buyer'}</span>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Row 3: Price + View link */}
            <div className="mt-1.5 flex items-center justify-between">
              <span style={{ color: '#1DC690', fontSize: '0.95rem', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                {formatPrice(order.amount)}
              </span>
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center gap-1 hover:underline"
                style={{ color: '#1DC690', fontSize: '0.85rem', fontFamily: 'Montserrat, sans-serif' }}
              >
                View Order →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow countdown for delivered orders */}
      {order.status === 'delivered' && order.escrow_release_at && (
        <EscrowCountdown escrowReleaseAt={order.escrow_release_at} />
      )}
    </div>
  );
}

// --- Purchased Order Card ---
function PurchasedOrderCard({ order }: { order: PurchasedOrder }) {
  return (
    <div className="rounded-xl bg-white mb-3 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="h-[72px] w-[72px] flex-shrink-0 rounded-lg bg-[#F4F4F0] overflow-hidden">
            {order.listing_image ? (
              <img src={order.listing_image} alt={order.listing_title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {/* Row 1: Title + Date */}
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-bold text-[#0D0D0D]" style={{ fontSize: '0.95rem', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                {order.listing_title}
              </p>
              <span className="flex-shrink-0 text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>
                {formatDate(order.created_at)}
              </span>
            </div>

            {/* Row 2: Seller + Status */}
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-[#F4F4F0] overflow-hidden flex-shrink-0">
                  {order.seller_avatar ? (
                    <img src={order.seller_avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#1DC690] text-white" style={{ fontSize: '0.6rem', fontWeight: 700 }}>
                      {(order.seller_name || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-[#6B6B6B]" style={{ fontSize: '0.85rem' }}>{order.seller_name || 'Seller'}</span>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Row 3: Price + View link */}
            <div className="mt-1.5 flex items-center justify-between">
              <span style={{ color: '#1DC690', fontSize: '0.95rem', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                {formatPrice(order.amount)}
              </span>
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center gap-1 hover:underline"
                style={{ color: '#1DC690', fontSize: '0.85rem', fontFamily: 'Montserrat, sans-serif' }}
              >
                View Order →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow countdown for delivered orders */}
      {order.status === 'delivered' && order.escrow_release_at && (
        <EscrowCountdown escrowReleaseAt={order.escrow_release_at} />
      )}
    </div>
  );
}

// --- Empty State ---
function EmptyState({ type }: { type: 'sold' | 'purchases' }) {
  const isSold = type === 'sold';
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-[#F4F4F0] p-4">
        {isSold ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        )}
      </div>
      <p className="text-[#6B6B6B] font-medium" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        No {isSold ? 'sold' : 'purchase'} orders yet
      </p>
      <p className="mt-1 text-sm text-[#ADADAD]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {isSold
          ? 'When buyers purchase your listings, orders will appear here.'
          : 'Orders you place will appear here.'}
      </p>
    </div>
  );
}

// --- Filter Pill ---
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
      style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 600,
        backgroundColor: active ? '#1DC690' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#6B6B6B',
        border: active ? 'none' : '1px solid #E0E0D8',
      }}
    >
      {label}
    </button>
  );
}

// --- Main Page ---
export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'sold' | 'purchases'>('sold');
  const [soldFilter, setSoldFilter] = useState<string>('all');
  const [purchaseFilter, setPurchaseFilter] = useState<string>('all');
  const [soldOrders, setSoldOrders] = useState<SoldOrder[]>([]);
  const [purchasedOrders, setPurchasedOrders] = useState<PurchasedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'sold') {
        const params = soldFilter !== 'all' ? { status: soldFilter as 'to_ship' } : undefined;
        const res = await getMySales(params);
        setSoldOrders(res.orders || []);
      } else {
        const params = purchaseFilter !== 'all' ? { status: purchaseFilter as 'in_progress' } : undefined;
        const res = await getMyPurchases(params);
        setPurchasedOrders(res.orders || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, soldFilter, purchaseFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Client-side filter for statuses not supported by backend params
  const filteredSoldOrders = soldFilter === 'all' || ['to_ship', 'in_transit', 'cancelled', 'completed'].includes(soldFilter)
    ? soldOrders
    : soldOrders.filter((o) => o.status === soldFilter);

  const filteredPurchasedOrders = purchaseFilter === 'all' || ['in_progress', 'cancelled', 'completed'].includes(purchaseFilter)
    ? purchasedOrders
    : purchasedOrders.filter((o) => o.status === purchaseFilter);

  return (
    <div className="min-h-screen" style={{ background: '#EAEAE0' }}>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Page Title */}
        <h1
          className="mb-6"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: '0.75rem',
            color: '#6B6B6B',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Orders
        </h1>

        {/* Tabs */}
        <div className="mb-4 flex gap-6 border-b border-[#E0E0D8]">
          {(['sold', 'purchases'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative pb-3 text-sm font-semibold transition-colors"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 600,
                color: activeTab === tab ? '#1DC690' : '#6B6B6B',
              }}
            >
              {tab === 'sold' ? 'Sold' : 'Purchases'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DC690]" />
              )}
            </button>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {activeTab === 'sold'
            ? SOLD_FILTERS.map((f) => (
                <FilterPill
                  key={f}
                  label={STATUS_LABELS[f] || f.charAt(0).toUpperCase() + f.slice(1)}
                  active={soldFilter === f}
                  onClick={() => setSoldFilter(f)}
                />
              ))
            : PURCHASE_FILTERS.map((f) => (
                <FilterPill
                  key={f}
                  label={STATUS_LABELS[f] || f.charAt(0).toUpperCase() + f.slice(1)}
                  active={purchaseFilter === f}
                  onClick={() => setPurchaseFilter(f)}
                />
              ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Orders List */}
        {!loading && activeTab === 'sold' && (
          filteredSoldOrders.length > 0 ? (
            filteredSoldOrders.map((order) => <SoldOrderCard key={order.id} order={order} />)
          ) : (
            <EmptyState type="sold" />
          )
        )}

        {!loading && activeTab === 'purchases' && (
          filteredPurchasedOrders.length > 0 ? (
            filteredPurchasedOrders.map((order) => <PurchasedOrderCard key={order.id} order={order} />)
          ) : (
            <EmptyState type="purchases" />
          )
        )}
      </div>
    </div>
  );
}
