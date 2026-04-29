'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Copy,
  Check,
  Package,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SimpleModal from '@/components/SimpleModal';
import { getOrder } from '@mulligans/api-client';
import {
  getShippingRates,
  createShippingLabel,
  markShipped,
} from '@mulligans/api-client';
import type { OrderDetail } from '@mulligans/api-client';
import type { ShippingRate } from '@mulligans/api-client';

// ─── Constants ───────────────────────────────────────────────────────────────

const CLOUDFRONT_BASE = 'https://d1bhj4xuvi3dve.cloudfront.net/';

// ─── Shared style constants (match dispute page) ────────────────────────────

const CONTAINER: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: 20,
  backgroundColor: '#FFFFFF',
  minHeight: '100vh',
};

const BACK_LINK: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  color: '#1DC690',
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.02em',
  textDecoration: 'none',
  marginBottom: 24,
};

const CARD: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E0E0E0',
  borderRadius: 14,
  padding: 20,
  marginBottom: 14,
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#278AB0',
  fontWeight: 500,
  marginBottom: 14,
};

const PRIMARY_BTN: React.CSSProperties = {
  width: '100%',
  height: 46,
  backgroundColor: '#1DC690',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const DISABLED_BTN: React.CSSProperties = {
  ...PRIMARY_BTN,
  backgroundColor: '#F7F7F5',
  color: '#9CA3AF',
  border: '1px solid #F0F0F0',
  opacity: 0.7,
  cursor: 'not-allowed',
};

const SECONDARY_BTN: React.CSSProperties = {
  width: '100%',
  height: 46,
  backgroundColor: '#FFFFFF',
  color: '#1C4670',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildImageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${CLOUDFRONT_BASE}${key}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTimeFull(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fp(n: number | string | null | undefined): string {
  if (n == null) return '£0.00';
  return `£${parseFloat(String(n)).toFixed(2)}`;
}

function getCountdown(deadline: string): { text: string; urgent: boolean; expired: boolean } {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { text: 'Deadline expired — this order may be auto-cancelled', urgent: true, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (days === 0 && minutes > 0) parts.push(`${minutes} min`);

  const urgent = diff < 24 * 60 * 60 * 1000;
  return {
    text: `Ship by ${formatDateTimeFull(deadline)} — ${parts.join(', ')} remaining`,
    urgent,
    expired: false,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ShipOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const orderId = params?.id as string;

  // Data
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State B: manual label flow
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  // Actions
  const [purchasing, setPurchasing] = useState(false);
  const [shipping, setShipping] = useState(false);

  // Modals
  const [showShipModal, setShowShipModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Countdown
  const [countdown, setCountdown] = useState<{ text: string; urgent: boolean; expired: boolean } | null>(null);

  // Clipboard feedback
  const [copied, setCopied] = useState(false);

  // ── Toast helper ────────────────────────────────────────────────────────
  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Auth gate ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderId}/ship`);
    }
  }, [isAuthenticated, authLoading, router, orderId]);

  // ── Fetch order ─────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await getOrder(orderId);
      const d = res?.data?.data ?? res?.data ?? res;
      const o: OrderDetail = (d as any)?.order ?? d;
      setOrder(o);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isAuthenticated && orderId) fetchOrder();
  }, [isAuthenticated, orderId, fetchOrder]);

  // ── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!order?.auto_cancel_at) {
      setCountdown(null);
      return;
    }
    const tick = () => setCountdown(getCountdown(order.auto_cancel_at as string));
    tick();
    const iv = setInterval(tick, 60_000);
    return () => clearInterval(iv);
  }, [order?.auto_cancel_at]);

  // ── Fetch shipping rates (State B) ──────────────────────────────────────
  const fetchRates = useCallback(async () => {
    try {
      setRatesLoading(true);
      setRatesError(null);
      const res = await getShippingRates(orderId);
      const d = res?.data?.data ?? res?.data ?? res;
      const payload = (d as any)?.data ?? d;
      const rateList: ShippingRate[] = payload?.rates ?? [];
      setRates(rateList);
    } catch (err: any) {
      setRatesError(err?.message || 'Unable to fetch shipping rates');
    } finally {
      setRatesLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (order && !order.label_url && (order.status === 'paid' || order.status === 'to_ship')) {
      fetchRates();
    }
  }, [order, fetchRates]);

  // ── Purchase label ──────────────────────────────────────────────────────
  async function handlePurchaseLabel() {
    if (!selectedRate) return;
    try {
      setPurchasing(true);
      await createShippingLabel(orderId, selectedRate.id);
      showToast('success', 'Shipping label purchased');
      setShowPurchaseModal(false);
      await fetchOrder();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to purchase label');
    } finally {
      setPurchasing(false);
    }
  }

  // ── Mark as shipped ─────────────────────────────────────────────────────
  async function handleMarkShipped() {
    try {
      setShipping(true);
      await markShipped(orderId);
      showToast('success', 'Order shipped!');
      setShowShipModal(false);
      setTimeout(() => router.push(`/orders/${orderId}`), 1200);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to mark as shipped');
    } finally {
      setShipping(false);
    }
  }

  // ── Copy tracking number ────────────────────────────────────────────────
  function copyTracking() {
    if (!order?.tracking_number) return;
    navigator.clipboard.writeText(order.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Derive state ────────────────────────────────────────────────────────
  const isSeller = !!user && !!order && user.id === (order as any).seller_id;
  const status = order?.status || '';
  const canShip = status === 'paid' || status === 'to_ship';
  const hasLabel = !!order?.label_url;
  const alreadyShipped = ['in_transit', 'shipped', 'delivered', 'completed'].includes(status);

  // ── First item image ────────────────────────────────────────────────────
  const itemImage = (() => {
    if (!order) return null;
    const items = (order as any).items ?? (order as any).order_items ?? [];
    if (items.length > 0) {
      const img =
        items[0]?.listing?.images?.[0]?.image_url ??
        items[0]?.image_url ??
        items[0]?.listing?.image_url;
      return buildImageUrl(img);
    }
    const directImg =
      (order as any).listing?.images?.[0]?.image_url ??
      (order as any).listing?.image_url ??
      (order as any).image_url;
    return buildImageUrl(directImg);
  })();

  const itemTitle = (() => {
    if (!order) return 'Item';
    const items = (order as any).items ?? (order as any).order_items ?? [];
    if (items.length > 0) return items[0]?.listing?.title ?? 'Item';
    return (order as any).listing?.title ?? 'Item';
  })();

  const buyerName = (() => {
    if (!order) return '';
    const buyer = (order as any).buyer;
    return buyer?.display_name ?? buyer?.name ?? '';
  })();

  // ─── Loading state ─────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div style={CONTAINER}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#F7F7F5',
                borderRadius: 14,
                height: i === 1 ? 100 : i === 2 ? 80 : 180,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div style={CONTAINER}>
        <Link href={`/orders/${orderId}`} style={BACK_LINK}>
          <ArrowLeft size={16} />
          Back to order
        </Link>
        <div style={CARD}>
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#6B7280', fontSize: 14 }}>
            {fetchError}
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  // ─── Access denied (not seller) ────────────────────────────────────────
  if (!isSeller) {
    return (
      <div style={CONTAINER}>
        <Link href={`/orders/${orderId}`} style={BACK_LINK}>
          <ArrowLeft size={16} />
          Back to order
        </Link>
        <div style={CARD}>
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#6B7280', fontSize: 14 }}>
            Only the seller can ship this order.
          </div>
        </div>
      </div>
    );
  }

  // ─── Already shipped / not shippable ───────────────────────────────────
  if (!canShip) {
    return (
      <div style={CONTAINER}>
        <Link href={`/orders/${orderId}`} style={BACK_LINK}>
          <ArrowLeft size={16} />
          Back to order
        </Link>
        <div style={CARD}>
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#6B7280', fontSize: 14 }}>
            {alreadyShipped
              ? 'This order has already been shipped.'
              : 'This order cannot be shipped in its current state.'}
          </div>
          {alreadyShipped && order.tracking_number && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>Tracking: </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#06070A' }}>
                {order.tracking_number}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────
  return (
    <div style={CONTAINER}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1000,
            backgroundColor: toast.type === 'success' ? '#1DC690' : '#DC2626',
            color: '#FFFFFF',
            borderRadius: 10,
            padding: '12px 18px',
            fontSize: 14,
            fontWeight: 500,
            maxWidth: 320,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Back link */}
      <Link href={`/orders/${orderId}`} style={BACK_LINK}>
        <ArrowLeft size={16} />
        Back to order
      </Link>

      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: '#111827',
            margin: '0 0 6px',
            lineHeight: 1.2,
          }}
        >
          Ship Order
        </h1>
        <div style={{ width: 32, height: 3, backgroundColor: '#1DC690', borderRadius: 2 }} />
      </div>

      {/* CARD 1 — Order context */}
      <div style={CARD}>
        <div style={SECTION_LABEL}>ORDER</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {itemImage ? (
            <img
              src={itemImage}
              alt=""
              style={{
                width: 64,
                height: 64,
                borderRadius: 10,
                objectFit: 'cover',
                backgroundColor: '#F7F7F5',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 10,
                backgroundColor: '#F7F7F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Package size={24} color="#9CA3AF" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#06070A',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {itemTitle}
            </div>
            {buyerName && (
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{buyerName}</div>
            )}
            <div style={{ fontSize: 13, color: '#D1D5DB', marginTop: 2 }}>
              {formatDate((order as any).created_at)}
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1DC690', flexShrink: 0 }}>
            {fp((order as any).amount)}
          </div>
        </div>
      </div>

      {/* CARD 2 — Shipping deadline */}
      {countdown && (
        <div
          style={{
            backgroundColor: 'rgba(245,158,11,0.08)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Clock
            size={18}
            color={countdown.urgent ? '#DC2626' : '#D97706'}
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <span
            style={{
              fontSize: 14,
              color: countdown.urgent ? '#DC2626' : '#92400E',
              lineHeight: 1.4,
            }}
          >
            {countdown.text}
          </span>
        </div>
      )}

      {/* ── STATE A: Label ready ────────────────────────────────────────── */}
      {hasLabel && (
        <>
          {/* CARD 3 — Shipping label */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>YOUR SHIPPING LABEL</div>

            {/* Success banner */}
            <div
              style={{
                backgroundColor: 'rgba(29,198,144,0.08)',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <CheckCircle
                size={18}
                color="#059669"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <span style={{ fontSize: 13, color: '#065F46', lineHeight: 1.4 }}>
                A pre-paid shipping label has been generated for this order.
              </span>
            </div>

            {/* Data rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>Carrier</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#06070A' }}>
                  {(order as any).carrier || 'Shippo'}
                </span>
              </div>

              {order.tracking_number && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#9CA3AF' }}>Tracking</span>
                  <button
                    onClick={copyTracking}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: 0,
                    }}
                    title="Click to copy"
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#06070A',
                        fontFamily: 'monospace',
                      }}
                    >
                      {order.tracking_number}
                    </span>
                    {copied ? (
                      <Check size={14} color="#1DC690" />
                    ) : (
                      <Copy size={14} color="#9CA3AF" />
                    )}
                  </button>
                </div>
              )}

              {(order as any).label_cost != null && parseFloat(String((order as any).label_cost)) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#9CA3AF' }}>Label cost</span>
                  <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                    {fp((order as any).label_cost)}
                  </span>
                </div>
              )}
            </div>

            {/* Download button */}
            <a
              href={order.label_url!}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...SECONDARY_BTN,
                textDecoration: 'none',
                marginTop: 16,
              }}
            >
              <Download size={18} />
              Download Shipping Label
            </a>
          </div>

          {/* CARD 4 — Shipping instructions */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>HOW TO SHIP</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 0 4px' }}>
              {[
                'Print the shipping label above',
                'Pack the item securely',
                'Attach the label to the outside of the parcel',
                `Drop off at any ${(order as any).carrier || 'carrier'} collection point`,
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#06070A', minWidth: 18 }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontSize: 14, color: '#06070A' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 5 — Mark as shipped */}
          <div style={CARD}>
            <p
              style={{
                fontSize: 13,
                color: '#6B7280',
                lineHeight: 1.5,
                margin: '0 0 14px',
              }}
            >
              Once you mark this as shipped, the buyer will be notified and tracking will begin.
              The buyer has 5 days after delivery to inspect the item before your payment is
              released.
            </p>
            <button
              onClick={() => setShowShipModal(true)}
              disabled={shipping}
              style={shipping ? DISABLED_BTN : PRIMARY_BTN}
            >
              {shipping ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
              Mark as Shipped
            </button>
          </div>
        </>
      )}

      {/* ── STATE B: No label ───────────────────────────────────────────── */}
      {!hasLabel && (
        <>
          {/* CARD 3 — Warning banner */}
          <div
            style={{
              backgroundColor: 'rgba(245,158,11,0.08)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <AlertTriangle
              size={18}
              color="#D97706"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <span style={{ fontSize: 13, color: '#92400E', lineHeight: 1.4 }}>
              A shipping label could not be automatically generated for this order. Please
              select a shipping service below to purchase a label.
            </span>
          </div>

          {/* CARD 4 — Shipping options */}
          <div style={CARD}>
            <div style={SECTION_LABEL}>SHIPPING OPTIONS</div>

            {ratesLoading && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px 0',
                  gap: 10,
                }}
              >
                <Loader2 size={24} color="#1DC690" className="animate-spin" />
                <span style={{ fontSize: 13, color: '#6B7280' }}>
                  Fetching shipping options...
                </span>
              </div>
            )}

            {ratesError && !ratesLoading && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 12px' }}>
                  Unable to fetch shipping rates. Please try again or contact support.
                </p>
                <button onClick={fetchRates} style={{ ...SECONDARY_BTN, width: 'auto', padding: '0 20px', margin: '0 auto' }}>
                  Retry
                </button>
              </div>
            )}

            {!ratesLoading && !ratesError && rates.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 12px' }}>
                  No tracked shipping options available for this order.
                </p>
                <button onClick={fetchRates} style={{ ...SECONDARY_BTN, width: 'auto', padding: '0 20px', margin: '0 auto' }}>
                  Retry
                </button>
              </div>
            )}

            {!ratesLoading && !ratesError && rates.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rates.map((rate) => {
                  const isSelected = selectedRate?.id === rate.id;
                  return (
                    <button
                      key={rate.id}
                      onClick={() => setSelectedRate(rate)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 14,
                        border: isSelected ? '2px solid #1DC690' : '1px solid #E5E7EB',
                        borderRadius: 12,
                        backgroundColor: isSelected ? 'rgba(29,198,144,0.04)' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#06070A' }}>
                          {rate.service}
                        </div>
                        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                          {rate.estimatedDays
                            ? `${rate.estimatedDays} business day${rate.estimatedDays !== 1 ? 's' : ''}`
                            : rate.durationTerms || 'Standard delivery'}
                        </div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                          {rate.carrier}
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#1DC690', flexShrink: 0 }}>
                        {fp(rate.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* CARD 5 — Purchase label */}
          {rates.length > 0 && !ratesLoading && (
            <div style={CARD}>
              <button
                onClick={() => selectedRate && setShowPurchaseModal(true)}
                disabled={!selectedRate || purchasing}
                style={!selectedRate || purchasing ? DISABLED_BTN : PRIMARY_BTN}
              >
                {purchasing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Purchase Label
                    {selectedRate && ` — ${fp(selectedRate.price)}`}
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* Mark as shipped modal */}
      <SimpleModal
        open={showShipModal}
        onClose={() => !shipping && setShowShipModal(false)}
        title="Confirm Shipment?"
      >
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, margin: '0 0 20px' }}>
          Confirm that you've posted this item with the shipping label attached? The buyer
          will be notified immediately.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowShipModal(false)}
            disabled={shipping}
            style={{ ...SECONDARY_BTN, flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleMarkShipped}
            disabled={shipping}
            style={{ ...(shipping ? DISABLED_BTN : PRIMARY_BTN), flex: 1 }}
          >
            {shipping ? <Loader2 size={18} className="animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </SimpleModal>

      {/* Purchase label modal */}
      <SimpleModal
        open={showPurchaseModal}
        onClose={() => !purchasing && setShowPurchaseModal(false)}
        title="Purchase Shipping Label?"
      >
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, margin: '0 0 20px' }}>
          Purchase a {selectedRate?.service} label for {selectedRate ? fp(selectedRate.price) : ''}?
          The cost will be deducted from your payout.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowPurchaseModal(false)}
            disabled={purchasing}
            style={{ ...SECONDARY_BTN, flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handlePurchaseLabel}
            disabled={purchasing}
            style={{ ...(purchasing ? DISABLED_BTN : PRIMARY_BTN), flex: 1 }}
          >
            {purchasing ? <Loader2 size={18} className="animate-spin" /> : 'Purchase'}
          </button>
        </div>
      </SimpleModal>

      {/* spin animation for Loader2 */}
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 640px) {
          .ship-container { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
