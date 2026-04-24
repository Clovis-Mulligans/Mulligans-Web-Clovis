'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Star,
  ExternalLink,
  Truck,
  MessageCircle,
  MapPin,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Flag,
  XCircle,
  FileText,
  Printer,
  Wallet,
  CircleCheck,
  Hourglass,
  Info,
  AlertTriangle,
  Search,
  Ban,
  Circle,
  Send,
  Plane,
  Undo2,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/PageHeader';
import SimpleModal from '@/components/SimpleModal';
import {
  getOrder,
  confirmReceipt,
  cancelOrder,
  reportLost,
  markOrderViewed,
  createConversation,
} from '@mulligans/api-client';
import type { OrderDetail, OrderDispute, OrderParty } from '@mulligans/api-client';

/* ── Constants ──────────────────────────────────────────── */

const BRAND_GREEN = '#1DC690';
const BRAND_BLUE = '#278AB0';
const PAGE_BG = '#EAEAE0';
const CARD_BORDER = '#E5E7EB';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#6B7280';

type StatusKey =
  | 'pending'
  | 'paid'
  | 'to_ship'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded'
  | 'returned'
  | 'delivery_failed';

const STATUS_CONFIG: Record<
  string,
  {
    bg: string;
    color: string;
    label: string;
    icon: React.ComponentType<{ size?: number | string; color?: string }>;
    buyerMessage: string;
    sellerMessage: string;
  }
> = {
  pending: {
    bg: '#FEF3C7',
    color: '#92400E',
    label: 'Pending',
    icon: Clock,
    buyerMessage: 'Your order is being processed',
    sellerMessage: 'Waiting for payment confirmation',
  },
  paid: {
    bg: '#DCFCE7',
    color: '#166534',
    label: 'Paid',
    icon: CheckCircle2,
    buyerMessage: 'Payment received — seller is preparing your item',
    sellerMessage: 'Payment received — please ship the item',
  },
  to_ship: {
    bg: '#FEF3C7',
    color: '#92400E',
    label: 'Awaiting Shipment',
    icon: Package,
    buyerMessage: 'Seller is preparing your item for shipment',
    sellerMessage: 'Create a label and ship within 5 days',
  },
  shipped: {
    bg: '#DBEAFE',
    color: '#1E40AF',
    label: 'Shipped',
    icon: Plane,
    buyerMessage: 'Your item is on its way!',
    sellerMessage: 'Item has been shipped',
  },
  in_transit: {
    bg: '#E0E7FF',
    color: '#3730A3',
    label: 'In Transit',
    icon: Plane,
    buyerMessage: 'Your item is on its way!',
    sellerMessage: 'Item is on its way to the buyer',
  },
  delivered: {
    bg: '#EDE9FE',
    color: '#5B21B6',
    label: 'Delivered',
    icon: CheckCircle2,
    buyerMessage: 'Your item has been delivered',
    sellerMessage: 'Item delivered — payout releases after escrow period',
  },
  completed: {
    bg: '#D1FAE5',
    color: '#065F46',
    label: 'Completed',
    icon: CircleCheck,
    buyerMessage: 'Order completed successfully',
    sellerMessage: 'Payout released',
  },
  cancelled: {
    bg: '#FEE2E2',
    color: '#991B1B',
    label: 'Cancelled',
    icon: XCircle,
    buyerMessage: 'This order has been cancelled',
    sellerMessage: 'This order has been cancelled',
  },
  disputed: {
    bg: '#FED7AA',
    color: '#9A3412',
    label: 'Disputed',
    icon: AlertTriangle,
    buyerMessage: 'Your dispute is being reviewed',
    sellerMessage: 'A dispute has been opened on this order',
  },
  refunded: {
    bg: '#FEE2E2',
    color: '#991B1B',
    label: 'Refunded',
    icon: Undo2,
    buyerMessage: 'Your payment has been refunded',
    sellerMessage: 'Buyer has been refunded',
  },
  returned: {
    bg: '#F3F4F6',
    color: '#374151',
    label: 'Returned',
    icon: Undo2,
    buyerMessage: 'Item has been returned',
    sellerMessage: 'Item has been returned',
  },
  delivery_failed: {
    bg: '#FEE2E2',
    color: '#991B1B',
    label: 'Delivery Failed',
    icon: AlertCircle,
    buyerMessage: 'Delivery was unsuccessful',
    sellerMessage: 'Delivery attempt failed',
  },
};

const TRACKING_URLS: Record<string, string> = {
  'Royal Mail': 'https://www.royalmail.com/track-your-item#/tracking-results/',
  'Evri (Hermes)': 'https://www.evri.com/track/parcel/',
  Evri: 'https://www.evri.com/track/parcel/',
  Hermes: 'https://www.evri.com/track/parcel/',
  DPD: 'https://track.dpd.co.uk/parcels/',
  DHL: 'https://www.dhl.com/gb-en/home/tracking.html?tracking-id=',
  UPS: 'https://www.ups.com/track?tracknum=',
  FedEx: 'https://www.fedex.com/fedextrack/?trknbr=',
  Yodel: 'https://www.yodel.co.uk/track/',
};

const REASON_LABELS: Record<string, string> = {
  not_as_described: 'Item Not as Described',
  not_received: 'Item Not Received',
  damaged: 'Item Damaged',
  wrong_item: 'Wrong Item Sent',
  counterfeit: 'Suspected Counterfeit',
  missing_parts: 'Missing Parts/Accessories',
  other: 'Other Issue',
};

const CANCEL_REASONS: { value: string; label: string }[] = [
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'found_cheaper', label: 'Found a better price elsewhere' },
  { value: 'wrong_item', label: 'Ordered the wrong item' },
  { value: 'shipping_delay', label: 'Taking too long to ship' },
  { value: 'seller_unresponsive', label: 'Seller unresponsive' },
  { value: 'out_of_stock', label: 'Item no longer available' },
  { value: 'other', label: 'Other reason' },
];

/* ── Helpers ──────────────────────────────────────────── */

const fp = (n: number) => `\u00A3${n.toFixed(2)}`;

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getTrackingUrl(carrier: string | null, tracking: string | null): string | null {
  if (!tracking) return null;
  if (carrier) {
    const base = TRACKING_URLS[carrier];
    if (base) return base + tracking;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(
    (carrier || 'parcel') + ' tracking ' + tracking
  )}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getReasonTypeLabel(reasonType: string): string {
  return REASON_LABELS[reasonType] || reasonType.replace(/_/g, ' ');
}

function getDisputeOutcome(dispute: OrderDispute, isSeller: boolean) {
  if (dispute.status === 'resolved' || dispute.status === 'admin_resolved') {
    const final = Number(dispute.final_refund_amount || 0);
    const requested = Number(dispute.requested_refund_amount || 0);
    if (final === 0) {
      return isSeller
        ? { label: 'Resolved - In Your Favour', color: '#065F46', bg: '#D1FAE5', icon: CheckCircle2 }
        : { label: 'Resolved - No Refund', color: '#991B1B', bg: '#FEE2E2', icon: XCircle };
    } else if (final >= requested) {
      return isSeller
        ? { label: 'Resolved - Full Refund Issued', color: '#991B1B', bg: '#FEE2E2', icon: XCircle }
        : { label: 'Resolved - Full Refund', color: '#065F46', bg: '#D1FAE5', icon: CheckCircle2 };
    } else {
      return { label: 'Resolved - Partial Refund', color: '#92400E', bg: '#FEF3C7', icon: CheckCircle2 };
    }
  } else if (dispute.status === 'escalated') {
    return { label: 'Under Review by Mulligans', color: '#9A3412', bg: '#FED7AA', icon: Hourglass };
  } else if (dispute.status === 'counter_offered') {
    return { label: 'Counter Offer Sent', color: '#1E40AF', bg: '#DBEAFE', icon: Send };
  } else {
    return isSeller
      ? { label: 'Response Required', color: '#DC2626', bg: '#FEE2E2', icon: AlertCircle }
      : { label: 'Awaiting Response', color: '#1E40AF', bg: '#DBEAFE', icon: Clock };
  }
}

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

/* ── Responsive hook ──────────────────────────────────── */

function useIsNarrow(breakpoint = 700): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setNarrow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);
  return narrow;
}

/* ══ PAGE ══════════════════════════════════════════════ */

export default function OrderDetailPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const narrow = useIsNarrow();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConfirmReceiptModal, setShowConfirmReceiptModal] = useState(false);
  const [showReportLostModal, setShowReportLostModal] = useState(false);

  /* Auth gate */
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderId}`);
    }
  }, [isLoading, isAuthenticated, router, orderId]);

  /* Fetch order */
  const fetchOrder = useCallback(async () => {
    if (!isAuthenticated || !orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getOrder(orderId);
      const data: OrderDetail = ((res as any).order || res) as OrderDetail;
      if (!data) {
        setError('Order not found');
        return;
      }
      if (!data.is_buyer && !data.is_seller) {
        router.push('/orders');
        return;
      }
      setOrder(data);
      markOrderViewed(orderId).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /* ── Actions ── */

  const handleConfirmReceipt = async () => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await confirmReceipt(order.id);
      setShowConfirmReceiptModal(false);
      await fetchOrder();
    } catch (err: any) {
      setActionError(err?.data?.error || err?.message || 'Failed to confirm receipt');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (reason: string, reasonText: string) => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await cancelOrder(order.id, { reason, reasonText });
      setShowCancelModal(false);
      await fetchOrder();
    } catch (err: any) {
      setActionError(
        err?.data?.message || err?.data?.error || err?.message || 'Failed to cancel order'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportLost = async () => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await reportLost(order.id);
      setShowReportLostModal(false);
      await fetchOrder();
    } catch (err: any) {
      setActionError(err?.data?.error || err?.message || 'Failed to report item as lost');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessageCounterparty = async () => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    try {
      const counterpartyId = order.is_buyer ? order.seller.id : order.buyer.id;
      const res: any = await createConversation({
        listing_id: order.listing_id,
        seller_id: counterpartyId,
      });
      const conversation = res?.conversation || res;
      const conversationId = conversation?.id || res?.conversation_id;
      if (conversationId) {
        router.push(`/messages/${conversationId}`);
      }
    } catch (err) {
      // Non-fatal: surface a message near the button
      setActionError('Failed to start conversation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyTracking = async () => {
    if (!order?.tracking_number) return;
    try {
      await navigator.clipboard.writeText(order.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  /* ── Auth / loading / error states ── */

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ backgroundColor: PAGE_BG, minHeight: '60vh' }}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '96px 16px',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
            color: TEXT_MUTED,
            fontSize: 14,
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: PAGE_BG, minHeight: '60vh' }}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '96px 16px',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
            color: TEXT_MUTED,
            fontSize: 14,
          }}
        >
          Loading order...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ backgroundColor: PAGE_BG, minHeight: '60vh' }}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '60px 16px',
            textAlign: 'center',
          }}
        >
          <Package size={48} color="#ccc" />
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 17,
              fontWeight: 700,
              color: TEXT_DARK,
              margin: '16px 0 6px',
            }}
          >
            Order not found
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: TEXT_MUTED,
              margin: '0 0 20px',
            }}
          >
            {error || 'This order may not exist or you may not have access.'}
          </p>
          <Link
            href="/orders"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              fontWeight: 600,
              color: BRAND_GREEN,
              textDecoration: 'none',
            }}
          >
            {'\u2190'} Back to orders
          </Link>
        </div>
      </div>
    );
  }

  /* ── Derived values ── */
  const isBuyer = order.is_buyer;
  const isSeller = order.is_seller;
  const status = order.status;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  const qty = order.quantity || 1;
  const itemAmount = Number(order.amount) || 0;
  const shippingCost = Number(order.shipping_cost || 0);
  const buyerProtectionFee = itemAmount * 0.075 + 0.99 * qty;
  const totalPaid = itemAmount + shippingCost + buyerProtectionFee;
  const insurancePremium = Number(order.insurance_premium || 0);
  const sellerPayout =
    order.seller_payout != null
      ? Number(order.seller_payout)
      : itemAmount + shippingCost;

  const counterparty: OrderParty = isBuyer ? order.seller : order.buyer;
  const counterpartyLabel = isBuyer ? 'Seller' : 'Buyer';
  const counterpartyName =
    counterparty.display_name || counterparty.name || counterpartyLabel;
  const counterpartyAvatar = counterparty.avatar_url || counterparty.avatar || null;
  const counterpartyRating = Number(counterparty.rating || 0);
  const counterpartyVerified = !!counterparty.is_verified_seller;

  const mainImage = (() => {
    const images = (order.listing as any)?.images as
      | string[]
      | { image_url: string; display_order?: number }[]
      | undefined;
    if (!images || images.length === 0) return null;
    if (typeof images[0] === 'string') return images[0] as string;
    const sorted = [...(images as { image_url: string; display_order?: number }[])].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    return sorted[0]?.image_url || null;
  })();

  const trackingUrl = getTrackingUrl(order.carrier, order.tracking_number);

  /* Action flags — mirror mobile logic */
  const canCancel =
    (status === 'pending' || status === 'to_ship') && !order.label_url;
  const canReview =
    isBuyer && status === 'completed' && !order.has_reviewed;
  const canReportIssue =
    isBuyer && (status === 'in_transit' || status === 'delivered') && !order.dispute;
  const showConfirmReceipt = isBuyer && status === 'delivered' && !order.dispute;
  const showAwaitingDelivery = isBuyer && status === 'in_transit';

  const shippedDays = daysSince(order.shipped_at);
  const showLostTransitWarning =
    isBuyer &&
    status === 'in_transit' &&
    shippedDays >= 10 &&
    !order.reported_lost_at;
  const canReportLost =
    isBuyer &&
    status === 'in_transit' &&
    !!order.shipped_at &&
    !order.reported_lost_at &&
    shippedDays >= 14;

  const isDisputed = status === 'disputed';
  const showProminentTracking =
    status === 'in_transit' && !!order.tracking_number;

  const showEscrowInfo =
    isBuyer &&
    status === 'delivered' &&
    !!order.escrow_release_at &&
    !order.dispute;

  const showSellerPayoutCard =
    isSeller && ['to_ship', 'in_transit', 'delivered'].includes(status);

  const returnReq = (order as any).return_request as
    | {
        id?: string;
        status?: string;
        return_label_url?: string | null;
        who_pays_return?: 'buyer' | 'seller';
      }
    | null;
  const showBuyerReturnLabel =
    isBuyer &&
    returnReq &&
    !returnReq.return_label_url &&
    returnReq.who_pays_return === 'buyer';
  const showSellerReturnLabel =
    isSeller &&
    returnReq &&
    !returnReq.return_label_url &&
    returnReq.who_pays_return === 'seller';
  const showReturnAddressBanner =
    isSeller && returnReq && returnReq.status === 'awaiting_address';

  /* ── Card / style helpers ── */
  const cardBase: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    border: `1px solid ${CARD_BORDER}`,
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 700,
    color: TEXT_MUTED,
    margin: '0 0 12px',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  /* ══ RENDER ════════════════════════════════════════════ */

  return (
    <div style={{ backgroundColor: PAGE_BG, minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: narrow ? '16px 12px 48px' : '24px 16px 48px',
        }}
      >
        {/* Back to orders */}
        <Link
          href="/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 600,
            color: BRAND_GREEN,
            textDecoration: 'none',
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} />
          Back to orders
        </Link>

        <PageHeader
          title={isBuyer ? 'Purchase Details' : 'Sale Details'}
          subtitle={`Order #${order.id.slice(-8).toUpperCase()}`}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 1. STATUS BANNER */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 20px',
              borderRadius: 12,
              backgroundColor: statusCfg.bg,
            }}
          >
            <StatusIcon size={24} color={statusCfg.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: statusCfg.color,
                }}
              >
                {statusCfg.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: TEXT_MUTED,
                  marginTop: 2,
                }}
              >
                {isBuyer ? statusCfg.buyerMessage : statusCfg.sellerMessage}
              </div>
            </div>
          </div>

          {/* 2. REFUND INFO (buyer + cancelled) */}
          {isBuyer && status === 'cancelled' && (
            <div
              style={{
                ...cardBase,
                backgroundColor: '#F0FDF4',
                borderColor: '#BBF7D0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Wallet size={20} color="#065F46" />
                <h3
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#065F46',
                    margin: 0,
                  }}
                >
                  Refund Information
                </h3>
              </div>
              {order.cancel_reason === 'auto_cancelled_not_shipped' && (
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: '#374151',
                    lineHeight: 1.5,
                    margin: '0 0 12px',
                  }}
                >
                  This order was automatically cancelled because the seller didn't ship
                  it in time.
                </p>
              )}
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: TEXT_MUTED,
                  lineHeight: 1.5,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <Clock size={14} color={TEXT_MUTED} />
                <span>
                  Your refund has been processed. Please allow 5{'\u2013'}10 business
                  days for it to appear on your statement.
                </span>
              </p>
            </div>
          )}

          {/* 3. DISPUTE RESOLUTION CARD */}
          {order.dispute && (
            <DisputeCard dispute={order.dispute} isSeller={isSeller} />
          )}

          {/* 4. INSURANCE CLAIM CARD */}
          {order.reported_lost_at && (
            <InsuranceCard
              reportedAt={order.reported_lost_at}
              status={order.insurance_claim_status}
              insuredValue={null}
              isSeller={isSeller}
            />
          )}

          {/* 5. ESCROW INFO (buyer, delivered) */}
          {showEscrowInfo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: 20,
                borderRadius: 12,
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#D1FAE5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} color={BRAND_GREEN} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#065F46',
                  }}
                >
                  Buyer Protection Active
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    color: '#047857',
                    marginTop: 4,
                  }}
                >
                  {order.days_until_release && order.days_until_release > 0
                    ? `Payment will be released to seller in ${
                        order.days_until_release
                      } day${order.days_until_release !== 1 ? 's' : ''}`
                    : 'Payment will be released to seller soon'}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    color: '#059669',
                    marginTop: 6,
                  }}
                >
                  Confirm receipt below if you're happy with your item, or report an
                  issue if something's wrong.
                </div>
              </div>
            </div>
          )}

          {/* 6. LOST IN TRANSIT WARNING */}
          {showLostTransitWarning && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: 20,
                borderRadius: 12,
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
              }}
            >
              <AlertCircle size={24} color="#D97706" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#92400E',
                  }}
                >
                  {shippedDays} days since shipped
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    color: '#B45309',
                    marginTop: 4,
                  }}
                >
                  {shippedDays >= 14
                    ? 'You can now report this item as lost if it hasn\u2019t arrived.'
                    : `You can report as lost in ${14 - shippedDays} day${
                        14 - shippedDays !== 1 ? 's' : ''
                      } if not received.`}
                </div>
              </div>
            </div>
          )}

          {/* 7. PROMINENT TRACKING CARD (in_transit) */}
          {showProminentTracking && trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 20,
                borderRadius: 12,
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#D1FAE5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MapPin size={22} color={BRAND_GREEN} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#065F46',
                  }}
                >
                  Track Your Package
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: '#047857',
                    marginTop: 2,
                  }}
                >
                  {order.tracking_number}
                </div>
              </div>
              <ExternalLink size={18} color="#065F46" />
            </a>
          )}

          {/* 8. RETURN ADDRESS NEEDED (seller) */}
          {showReturnAddressBanner && (
            <div
              style={{
                ...cardBase,
                backgroundColor: '#FEF2F2',
                borderColor: '#FECACA',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <AlertTriangle size={24} color="#DC2626" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#991B1B',
                    }}
                  >
                    Action Required
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      color: '#B91C1C',
                      marginTop: 4,
                    }}
                  >
                    A return has been approved but you need to complete your Stripe
                    setup to provide a return address.
                  </div>
                  <a
                    href="https://dashboard.stripe.com/account"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 12,
                      padding: '8px 14px',
                      backgroundColor: '#DC2626',
                      color: '#fff',
                      borderRadius: 8,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Complete Stripe Setup
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 9. TWO-COLUMN GRID: ITEM + ORDER DETAILS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: narrow ? '1fr' : 'minmax(260px, 1fr) minmax(240px, 1fr)',
              gap: 16,
            }}
          >
            {/* ITEM CARD */}
            <div style={cardBase}>
              <h3 style={sectionTitle}>Item</h3>
              <Link
                href={`/listing/${order.listing_id}`}
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: '#F3F4F6',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Package size={28} color="#9CA3AF" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 15,
                      fontWeight: 600,
                      color: TEXT_DARK,
                      lineHeight: 1.3,
                    }}
                  >
                    {order.listing?.title || 'Item no longer available'}
                  </div>
                  {order.listing?.brand && (
                    <div
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        color: TEXT_MUTED,
                        marginTop: 4,
                      }}
                    >
                      {order.listing.brand}
                      {order.listing.category ? ` \u00B7 ${order.listing.category}` : ''}
                    </div>
                  )}
                  {(order.selected_size || qty > 1) && (
                    <div
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        color: TEXT_MUTED,
                        marginTop: 2,
                      }}
                    >
                      {order.selected_size && `Size: ${order.selected_size}`}
                      {order.selected_size && qty > 1 && ' \u2022 '}
                      {qty > 1 && `Qty: ${qty}`}
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 18,
                      fontWeight: 700,
                      color: BRAND_GREEN,
                      marginTop: 8,
                    }}
                  >
                    {fp(itemAmount)}
                  </div>
                </div>
              </Link>
            </div>

            {/* ORDER DETAILS */}
            <div style={cardBase}>
              <h3 style={sectionTitle}>Order Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <DetailRow
                  label="Order ID"
                  value={`#${order.id.slice(-8).toUpperCase()}`}
                  mono
                />
                <DetailRow label="Placed" value={formatDateShort(order.created_at)} />
                {order.paid_at && (
                  <DetailRow label="Paid" value={formatDateShort(order.paid_at)} />
                )}
                {order.shipped_at && (
                  <DetailRow label="Shipped" value={formatDateShort(order.shipped_at)} />
                )}
                {order.delivered_at && (
                  <DetailRow
                    label="Delivered"
                    value={formatDateShort(order.delivered_at)}
                  />
                )}
                <DetailRow label="Currency" value={(order.currency || 'GBP').toUpperCase()} />
                {isSeller && order.auto_cancel_at && status === 'to_ship' && (
                  <DetailRow
                    label="Ship by"
                    value={formatDateShort(order.auto_cancel_at)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 10. SHIPPING ADDRESS (seller) */}
          {isSeller && order.shipping_address && (
            <div style={cardBase}>
              <h3 style={sectionTitle}>Ship To</h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <MapPin size={20} color={TEXT_MUTED} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ShippingAddressBlock address={order.shipping_address} />
                </div>
              </div>
            </div>
          )}

          {/* 11. TRACKING (if tracking exists) */}
          {order.tracking_number && (
            <div style={cardBase}>
              <h3 style={sectionTitle}>Tracking</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <DetailRow
                  label="Carrier"
                  value={order.carrier || 'Not specified'}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      color: TEXT_MUTED,
                    }}
                  >
                    Tracking Number
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flex: 1,
                      justifyContent: 'flex-end',
                      minWidth: 0,
                    }}
                  >
                    {trackingUrl ? (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 14,
                          fontWeight: 600,
                          color: BRAND_GREEN,
                          textDecoration: 'underline',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {order.tracking_number}
                      </a>
                    ) : (
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 14,
                          fontWeight: 500,
                          color: TEXT_DARK,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {order.tracking_number}
                      </span>
                    )}
                    <button
                      onClick={handleCopyTracking}
                      aria-label="Copy tracking number"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        color: BRAND_BLUE,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                {order.label_url && (
                  <a
                    href={order.label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 4,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: BRAND_GREEN,
                      textDecoration: 'none',
                    }}
                  >
                    <FileText size={14} />
                    View Shipping Label
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 12. PAYMENT CARD (role-dependent) */}
          <div style={cardBase}>
            <h3 style={sectionTitle}>
              {isBuyer ? 'Payment Summary' : 'Payment'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <PaymentRow
                label={qty > 1 ? `Item Price (x${qty})` : 'Item Price'}
                value={fp(itemAmount)}
              />
              <PaymentRow
                label="Shipping"
                value={shippingCost > 0 ? fp(shippingCost) : 'Free'}
              />
              {isBuyer && (
                <PaymentRow
                  label="Buyer Protection"
                  value={fp(buyerProtectionFee)}
                  hint="7.5% + \u00A30.99/item"
                />
              )}
              {isBuyer && insurancePremium > 0 && (
                <PaymentRow label="Insurance Premium" value={fp(insurancePremium)} />
              )}
              <div
                style={{
                  height: 1,
                  backgroundColor: CARD_BORDER,
                  margin: '4px 0',
                }}
              />
              {isBuyer ? (
                <PaymentRow label="Total Paid" value={fp(totalPaid)} bold />
              ) : (
                <>
                  <PaymentRow
                    label="Your Payout"
                    value={fp(sellerPayout)}
                    bold
                    hint="After platform fee"
                  />
                  {showSellerPayoutCard && (
                    <SellerPayoutStatus order={order} />
                  )}
                </>
              )}
            </div>
          </div>

          {/* 13. TIMELINE */}
          <div style={cardBase}>
            <h3 style={sectionTitle}>Order Timeline</h3>
            <TimelineView order={order} />
          </div>

          {/* 14. COUNTERPARTY INFO */}
          <div style={cardBase}>
            <h3 style={sectionTitle}>{counterpartyLabel}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: BRAND_GREEN,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {counterpartyAvatar ? (
                  <img
                    src={counterpartyAvatar}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getInitials(counterpartyName)
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: TEXT_DARK,
                    }}
                  >
                    {counterpartyName}
                  </span>
                  {counterpartyVerified && (
                    <BadgeCheck size={16} color={BRAND_GREEN} />
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 3,
                  }}
                >
                  {counterpartyRating > 0 ? (
                    <>
                      <Star size={13} fill="#F59E0B" color="#F59E0B" />
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 13,
                          color: TEXT_MUTED,
                          fontWeight: 600,
                        }}
                      >
                        {counterpartyRating.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        color: TEXT_MUTED,
                      }}
                    >
                      {isBuyer ? 'New seller' : 'New buyer'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleMessageCounterparty}
                disabled={actionLoading}
                aria-label={`Message ${counterpartyLabel.toLowerCase()}`}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#ECFDF5',
                  border: 'none',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: actionLoading ? 0.5 : 1,
                }}
              >
                <MessageCircle size={18} color={BRAND_GREEN} />
              </button>
              <Link
                href={`/profile/${counterparty.id}`}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: BRAND_GREEN,
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                View profile
              </Link>
            </div>
          </div>

          {/* 15. REVIEW PROMPT */}
          {canReview && (
            <Link
              href={`/orders/${order.id}/review`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 20,
                borderRadius: 12,
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Star size={24} color="#F59E0B" />
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#92400E',
                    }}
                  >
                    Rate your experience
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      color: '#B45309',
                      marginTop: 2,
                    }}
                  >
                    Help others by leaving a review
                  </div>
                </div>
              </div>
              <ExternalLink size={18} color="#F59E0B" />
            </Link>
          )}

          {/* 16. ACTION ERROR BANNER */}
          {actionError && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertCircle size={18} color="#DC2626" />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: '#991B1B',
                  flex: 1,
                }}
              >
                {actionError}
              </span>
              <button
                onClick={() => setActionError(null)}
                aria-label="Dismiss error"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#991B1B',
                  padding: 4,
                  display: 'inline-flex',
                }}
              >
                <XCircle size={16} />
              </button>
            </div>
          )}

          {/* 17. ACTION BUTTONS */}
          <ActionBar
            isBuyer={isBuyer}
            isSeller={isSeller}
            status={status}
            labelUrl={order.label_url}
            canCancel={canCancel}
            canReview={canReview}
            canReportIssue={canReportIssue}
            showConfirmReceipt={showConfirmReceipt}
            showAwaitingDelivery={showAwaitingDelivery}
            canReportLost={canReportLost}
            isDisputed={isDisputed}
            showBuyerReturnLabel={!!showBuyerReturnLabel}
            showSellerReturnLabel={!!showSellerReturnLabel}
            returnRequestId={returnReq?.id}
            orderId={order.id}
            disputeStatus={order.dispute?.status || null}
            actionLoading={actionLoading}
            onCancel={() => setShowCancelModal(true)}
            onConfirmReceipt={() => setShowConfirmReceiptModal(true)}
            onReportLost={() => setShowReportLostModal(true)}
          />

          {/* 18. ORDER ID FOOTER */}
          <div
            style={{
              textAlign: 'center',
              paddingTop: 12,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: '#9CA3AF',
                marginBottom: 4,
              }}
            >
              Order ID
            </div>
            <div
              style={{
                fontFamily: 'Menlo, Consolas, monospace',
                fontSize: 12,
                color: '#9CA3AF',
              }}
            >
              {order.id}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <CancelModal
        open={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setActionError(null);
        }}
        onConfirm={handleCancel}
        loading={actionLoading}
        isBuyer={isBuyer}
      />
      <ConfirmReceiptModal
        open={showConfirmReceiptModal}
        onClose={() => {
          setShowConfirmReceiptModal(false);
          setActionError(null);
        }}
        onConfirm={handleConfirmReceipt}
        loading={actionLoading}
      />
      <ReportLostModal
        open={showReportLostModal}
        onClose={() => {
          setShowReportLostModal(false);
          setActionError(null);
        }}
        onConfirm={handleReportLost}
        loading={actionLoading}
      />
    </div>
  );
}

/* ══ SUB-COMPONENTS ════════════════════════════════════ */

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: TEXT_MUTED,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? 'Menlo, Consolas, monospace' : 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 500,
          color: TEXT_DARK,
          textAlign: 'right',
          maxWidth: '60%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PaymentRow({
  label,
  value,
  bold,
  hint,
}: {
  label: string;
  value: string;
  bold?: boolean;
  hint?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: bold ? 15 : 14,
            fontWeight: bold ? 700 : 400,
            color: bold ? TEXT_DARK : TEXT_MUTED,
          }}
        >
          {label}
        </span>
        {hint && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              color: '#9CA3AF',
              marginTop: 2,
            }}
          >
            {hint}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: bold ? 16 : 14,
          fontWeight: bold ? 700 : 500,
          color: bold ? BRAND_GREEN : TEXT_DARK,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ShippingAddressBlock({
  address,
}: {
  address: string | Record<string, string | null | undefined>;
}) {
  const textStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    color: TEXT_DARK,
    lineHeight: 1.5,
  };

  if (typeof address === 'string') {
    return <div style={textStyle}>{address}</div>;
  }
  const a = address;
  return (
    <div style={textStyle}>
      {a.name && (
        <div style={{ fontWeight: 600 }}>{String(a.name)}</div>
      )}
      {a.line1 && <div>{String(a.line1)}</div>}
      {a.line2 && <div>{String(a.line2)}</div>}
      <div>
        {[a.city, a.postal_code].filter(Boolean).join(', ')}
      </div>
      {a.country && <div>{String(a.country)}</div>}
    </div>
  );
}

function DisputeCard({
  dispute,
  isSeller,
}: {
  dispute: OrderDispute;
  isSeller: boolean;
}) {
  const outcome = getDisputeOutcome(dispute, isSeller);
  const OutcomeIcon = outcome.icon;
  const isResolved =
    dispute.status === 'resolved' || dispute.status === 'admin_resolved';
  const finalAmount = Number(dispute.final_refund_amount || 0);

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        border: `1px solid ${CARD_BORDER}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: outcome.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <OutcomeIcon size={20} color={outcome.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              fontWeight: 700,
              color: outcome.color,
            }}
          >
            {outcome.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: TEXT_MUTED,
              marginTop: 2,
            }}
          >
            {isResolved
              ? `Resolved ${formatDate(dispute.resolved_at)}`
              : `Opened ${formatDate(dispute.created_at)}`}
          </div>
        </div>
        {dispute.auto_escalated && (
          <div
            style={{
              backgroundColor: '#FEF3C7',
              padding: '4px 8px',
              borderRadius: 4,
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 700,
              color: '#92400E',
            }}
          >
            Auto-escalated
          </div>
        )}
      </div>

      <div
        style={{
          paddingTop: 12,
          borderTop: `1px solid ${CARD_BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <DetailRow label="Reason" value={getReasonTypeLabel(dispute.reason_type)} />
        {dispute.reason && (
          <div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: TEXT_MUTED,
                marginBottom: 4,
              }}
            >
              {isSeller ? "Buyer's Description" : 'Description'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: '#374151',
                lineHeight: 1.5,
              }}
            >
              {dispute.reason}
            </div>
          </div>
        )}
        {dispute.requested_refund_amount != null && (
          <DetailRow
            label={isSeller ? 'Refund Requested' : 'Requested Refund'}
            value={`${fp(Number(dispute.requested_refund_amount))}${
              dispute.requested_refund_percent
                ? ` (${dispute.requested_refund_percent}%)`
                : ''
            }`}
          />
        )}
        {isSeller && dispute.seller_response && (
          <div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: TEXT_MUTED,
                marginBottom: 4,
              }}
            >
              Your Response
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: '#374151',
                lineHeight: 1.5,
              }}
            >
              {dispute.seller_response}
            </div>
          </div>
        )}
        {dispute.counter_amount != null && !isResolved && (
          <DetailRow
            label={isSeller ? 'Your Counter Offer' : "Seller's Counter Offer"}
            value={`${fp(Number(dispute.counter_amount))}${
              dispute.counter_percent ? ` (${dispute.counter_percent}%)` : ''
            }`}
          />
        )}
        {isResolved && dispute.final_refund_amount != null && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: finalAmount === 0 ? '#ECFDF5' : '#FEF2F2',
              padding: '10px 12px',
              borderRadius: 8,
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 700,
                color: finalAmount === 0 ? '#065F46' : '#991B1B',
              }}
            >
              {isSeller ? 'Final Outcome' : 'Final Refund'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                fontWeight: 700,
                color: finalAmount === 0 ? '#065F46' : '#991B1B',
              }}
            >
              {isSeller
                ? finalAmount === 0
                  ? 'No refund - funds released to you'
                  : `${fp(finalAmount)} refunded`
                : finalAmount > 0
                ? fp(finalAmount)
                : 'No refund issued'}
            </span>
          </div>
        )}
        {dispute.resolution_notes && (
          <div
            style={{
              backgroundColor: '#F3F4F6',
              padding: '10px 12px',
              borderRadius: 8,
              marginTop: 4,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                color: TEXT_MUTED,
                marginBottom: 4,
              }}
            >
              Resolution Notes
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: '#374151',
                lineHeight: 1.5,
              }}
            >
              {dispute.resolution_notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InsuranceCard({
  reportedAt,
  status,
  insuredValue,
  isSeller,
}: {
  reportedAt: string;
  status: string | null;
  insuredValue: number | null;
  isSeller: boolean;
}) {
  const cfg = (() => {
    if (status === 'claim_approved') {
      return isSeller
        ? { bg: '#FEE2E2', color: '#DC2626', icon: AlertCircle, title: 'Lost Item Claim Approved' }
        : { bg: '#D1FAE5', color: '#059669', icon: CheckCircle2, title: 'Claim Approved' };
    }
    if (status === 'claim_denied') {
      return isSeller
        ? { bg: '#D1FAE5', color: '#059669', icon: CheckCircle2, title: 'Lost Item Claim Denied' }
        : { bg: '#FEE2E2', color: '#DC2626', icon: XCircle, title: 'Claim Denied' };
    }
    if (status === 'claim_filed') {
      return {
        bg: '#E0E7FF',
        color: '#4F46E5',
        icon: ShieldCheck,
        title: isSeller ? 'Lost Item Claim Filed' : 'Claim Filed',
      };
    }
    return {
      bg: '#FEF3C7',
      color: '#D97706',
      icon: Search,
      title: isSeller ? 'Item Reported Lost' : 'Under Investigation',
    };
  })();

  const Icon = cfg.icon;

  const message = (() => {
    if (status === 'claim_approved') {
      return isSeller
        ? "The buyer's lost item claim was approved. The buyer will be refunded from the shipping insurance. Your payout is unaffected as the item was insured."
        : 'Your claim has been approved. A refund will be processed to your original payment method within 3-5 business days.';
    }
    if (status === 'claim_denied') {
      return isSeller
        ? "The buyer's claim was denied. Your payout will proceed as normal once the escrow period ends."
        : 'Unfortunately your claim was not approved. Please contact support if you have questions.';
    }
    if (status === 'claim_filed') {
      return isSeller
        ? "The buyer has filed an insurance claim for this item. We're awaiting a decision from the insurer. Your payout is on hold until this is resolved."
        : "We've filed your claim with the shipping insurer. You'll be notified once a decision is made.";
    }
    return isSeller
      ? "The buyer has reported this item as lost in transit. We're investigating. Your payout is on hold until this is resolved."
      : "We're investigating your report. You'll receive an update within 5 business days.";
  })();

  return (
    <div
      style={{
        backgroundColor: '#F5F3FF',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #DDD6FE',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: cfg.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={22} color={cfg.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              fontWeight: 700,
              color: cfg.color,
            }}
          >
            {cfg.title}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: TEXT_MUTED,
              marginTop: 2,
            }}
          >
            Reported {formatDate(reportedAt)}
          </div>
        </div>
      </div>
      <div style={{ paddingTop: 12, borderTop: '1px solid #DDD6FE' }}>
        {insuredValue != null && insuredValue > 0 && (
          <DetailRow label="Insured Value" value={fp(insuredValue)} />
        )}
        <div
          style={{
            backgroundColor: '#fff',
            padding: 12,
            borderRadius: 8,
            marginTop: insuredValue ? 8 : 0,
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: '#4B5563',
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
}

function SellerPayoutStatus({ order }: { order: OrderDetail }) {
  const status = order.status;
  const config = (() => {
    if (order.reported_lost_at) {
      if (order.insurance_claim_status === 'claim_approved') {
        return {
          text: 'Claim Approved',
          color: '#DC2626',
          bg: '#FEE2E2',
          icon: AlertCircle,
        };
      }
      if (order.insurance_claim_status === 'claim_denied') {
        return {
          text: 'Claim Denied - Releasing',
          color: '#065F46',
          bg: '#D1FAE5',
          icon: CheckCircle2,
        };
      }
      return {
        text: 'Under Investigation',
        color: '#7C3AED',
        bg: '#EDE9FE',
        icon: Search,
      };
    }
    if (status === 'completed') {
      return { text: 'Paid', color: '#065F46', bg: '#D1FAE5', icon: CheckCircle2 };
    }
    if (status === 'cancelled') {
      return { text: 'Refunded', color: '#DC2626', bg: '#FEE2E2', icon: XCircle };
    }
    if (status === 'disputed') {
      return { text: 'On Hold', color: '#D97706', bg: '#FEF3C7', icon: AlertCircle };
    }
    if (status === 'delivered' && order.days_until_release != null) {
      if (order.days_until_release <= 0) {
        return {
          text: 'Releasing soon',
          color: '#1E40AF',
          bg: '#DBEAFE',
          icon: Clock,
        };
      }
      return {
        text: `Releases in ${order.days_until_release} day${
          order.days_until_release !== 1 ? 's' : ''
        }`,
        color: '#1E40AF',
        bg: '#DBEAFE',
        icon: Clock,
      };
    }
    return { text: 'Pending', color: '#92400E', bg: '#FEF3C7', icon: Clock };
  })();

  const Icon = config.icon;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-end',
        backgroundColor: config.bg,
        color: config.color,
        padding: '4px 10px',
        borderRadius: 20,
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 700,
        marginTop: 4,
      }}
    >
      <Icon size={12} color={config.color} />
      {config.text}
    </div>
  );
}

function TimelineView({ order }: { order: OrderDetail }) {
  type Step = {
    label: string;
    timestamp: string | null;
    completed: boolean;
    detail?: string | null;
    colour?: string;
  };

  const steps: Step[] = useMemo(() => {
    if (order.status === 'cancelled') {
      return [
        {
          label: 'Order placed',
          timestamp: order.created_at,
          completed: true,
        },
        {
          label: 'Cancelled',
          timestamp: order.cancelled_at,
          completed: true,
          detail: order.cancel_reason,
          colour: '#991B1B',
        },
      ];
    }

    const base: Step[] = [
      { label: 'Order placed', timestamp: order.created_at, completed: true },
      {
        label: 'Payment confirmed',
        timestamp: order.paid_at,
        completed: !!order.paid_at,
      },
      {
        label: 'Shipped',
        timestamp: order.shipped_at,
        completed: !!order.shipped_at,
        detail:
          order.tracking_number && order.carrier
            ? `${order.carrier} \u2014 ${order.tracking_number}`
            : order.tracking_number || null,
      },
      {
        label: 'Delivered',
        timestamp: order.delivered_at,
        completed: !!order.delivered_at,
      },
      {
        label: order.is_seller
          ? 'Payout released'
          : 'Completed \u2014 escrow released',
        timestamp: order.completed_at || order.escrow_release_at,
        completed: !!order.completed_at,
        detail:
          !order.completed_at && order.escrow_release_at
            ? `Est. ${formatDateShort(order.escrow_release_at)}`
            : null,
      },
    ];

    if (order.status === 'disputed') {
      const disputeStep: Step = {
        label: 'Disputed',
        timestamp: order.dispute?.created_at || null,
        completed: true,
        detail:
          order.dispute?.reason_type?.replace(/_/g, ' ') || order.dispute_reason,
        colour: '#92400E',
      };
      const lastCompletedIdx = base.reduce(
        (last, s, i) => (s.completed ? i : last),
        0
      );
      base.splice(lastCompletedIdx + 1, 0, disputeStep);
    }

    return base;
  }, [order]);

  return (
    <div style={{ position: 'relative' }}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const dotColour = step.colour
          ? step.colour
          : step.completed
          ? BRAND_GREEN
          : '#E5E7EB';
        const lineColour = step.completed ? BRAND_GREEN : '#E5E7EB';
        const lineStyle = step.completed ? 'solid' : 'dashed';

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: 14,
              position: 'relative',
              paddingBottom: isLast ? 0 : 20,
            }}
          >
            {!isLast && (
              <div
                style={{
                  position: 'absolute',
                  left: 9,
                  top: 22,
                  bottom: 0,
                  width: 2,
                  borderLeft: `2px ${lineStyle} ${lineColour}`,
                }}
              />
            )}
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: dotColour,
                flexShrink: 0,
                marginTop: 1,
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {step.completed && !step.colour && (
                <CheckCircle2 size={12} color="#fff" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: step.completed ? TEXT_DARK : '#9CA3AF',
                }}
              >
                {step.label}
              </div>
              {step.timestamp && (
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    color: '#9CA3AF',
                    marginTop: 2,
                  }}
                >
                  {formatDate(step.timestamp)}
                </div>
              )}
              {step.detail && (
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    color: TEXT_MUTED,
                    marginTop: 3,
                  }}
                >
                  {step.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionBar({
  isBuyer,
  isSeller,
  status,
  labelUrl,
  canCancel,
  canReview,
  canReportIssue,
  showConfirmReceipt,
  showAwaitingDelivery,
  canReportLost,
  isDisputed,
  showBuyerReturnLabel,
  showSellerReturnLabel,
  returnRequestId,
  orderId,
  disputeStatus,
  actionLoading,
  onCancel,
  onConfirmReceipt,
  onReportLost,
}: {
  isBuyer: boolean;
  isSeller: boolean;
  status: string;
  labelUrl: string | null;
  canCancel: boolean;
  canReview: boolean;
  canReportIssue: boolean;
  showConfirmReceipt: boolean;
  showAwaitingDelivery: boolean;
  canReportLost: boolean;
  isDisputed: boolean;
  showBuyerReturnLabel: boolean;
  showSellerReturnLabel: boolean;
  returnRequestId?: string;
  orderId: string;
  disputeStatus: string | null;
  actionLoading: boolean;
  onCancel: () => void;
  onConfirmReceipt: () => void;
  onReportLost: () => void;
}) {
  const buttons: React.ReactNode[] = [];

  /* ─── SELLER ─── */
  if (isSeller && status === 'to_ship') {
    if (!labelUrl) {
      buttons.push(
        <PrimaryLinkButton
          key="create-label"
          href={`/orders/${orderId}/ship`}
          icon={<Package size={18} />}
          label="Create Label"
        />
      );
    } else {
      buttons.push(
        <PrimaryLinkButton
          key="print-label"
          href={labelUrl}
          target="_blank"
          secondary
          icon={<Printer size={18} />}
          label="Print Label"
        />
      );
      buttons.push(
        <PrimaryLinkButton
          key="ship-wizard"
          href={`/orders/${orderId}/ship`}
          icon={<CheckCircle2 size={18} />}
          label="Mark Shipped"
        />
      );
    }
  }

  if (isSeller && status === 'in_transit') {
    /* Mobile seller in_transit action bar is Message Buyer — handled by
       counterparty card's message button; no extra action button needed. */
  }

  if (isSeller && isDisputed) {
    buttons.push(
      <PrimaryLinkButton
        key="dispute-respond"
        href={`/orders/${orderId}/dispute`}
        icon={<AlertCircle size={18} />}
        label={disputeStatus === 'open' ? 'Respond to Dispute' : 'View Dispute'}
        colour={disputeStatus === 'open' ? '#DC2626' : '#F59E0B'}
      />
    );
    if (showSellerReturnLabel && returnRequestId) {
      buttons.push(
        <PrimaryLinkButton
          key="return-label-seller"
          href={`/orders/return/${returnRequestId}`}
          icon={<Undo2 size={18} />}
          label="Pay for Return Label"
          colour="#DC2626"
        />
      );
    }
  }

  /* ─── BUYER ─── */
  if (isBuyer && showAwaitingDelivery) {
    buttons.push(
      <DisabledButton
        key="awaiting"
        icon={<Clock size={18} />}
        label="Awaiting Delivery"
      />
    );
  }

  if (isBuyer && showConfirmReceipt) {
    buttons.push(
      <PrimaryButton
        key="confirm"
        icon={<CheckCircle2 size={18} />}
        label="Confirm Receipt"
        onClick={onConfirmReceipt}
        loading={actionLoading}
      />
    );
  }

  if (isBuyer && canReportLost) {
    buttons.push(
      <WarningButton
        key="lost"
        icon={<Flag size={18} />}
        label="Report Lost"
        onClick={onReportLost}
        loading={actionLoading}
      />
    );
  }

  if (isBuyer && canReportIssue && !canReportLost) {
    buttons.push(
      <PrimaryLinkButton
        key="report-issue"
        href={`/orders/${orderId}/report`}
        secondary
        icon={<AlertCircle size={18} />}
        label="Report Issue"
      />
    );
  }

  if (isBuyer && isDisputed) {
    buttons.push(
      <PrimaryLinkButton
        key="view-dispute"
        href={`/orders/${orderId}/dispute`}
        icon={<AlertCircle size={18} />}
        label="View Dispute"
        colour="#F59E0B"
      />
    );
  }

  if (isBuyer && canReview) {
    buttons.push(
      <PrimaryLinkButton
        key="review"
        href={`/orders/${orderId}/review`}
        icon={<Star size={18} />}
        label="Leave Review"
      />
    );
  }

  if (isBuyer && showBuyerReturnLabel && returnRequestId) {
    buttons.push(
      <PrimaryLinkButton
        key="return-label-buyer"
        href={`/orders/return/${returnRequestId}`}
        icon={<Undo2 size={18} />}
        label="Purchase Return Label"
      />
    );
  }

  /* ─── BOTH: Cancel ─── */
  if (canCancel) {
    buttons.push(
      <CancelButton
        key="cancel"
        onClick={onCancel}
        loading={actionLoading}
      />
    );
  }

  if (buttons.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      {buttons}
    </div>
  );
}

function PrimaryButton({
  icon,
  label,
  onClick,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        flex: '1 1 200px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '14px 16px',
        backgroundColor: BRAND_GREEN,
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function WarningButton({
  icon,
  label,
  onClick,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        flex: '1 1 200px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '14px 16px',
        backgroundColor: '#FEE2E2',
        color: '#DC2626',
        border: 'none',
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function CancelButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        flex: '1 1 200px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '14px 16px',
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
        border: 'none',
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <Ban size={18} />
      Cancel Order
    </button>
  );
}

function DisabledButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 200px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '14px 16px',
        backgroundColor: '#E5E7EB',
        color: '#9CA3AF',
        border: 'none',
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        opacity: 0.8,
      }}
    >
      {icon}
      {label}
    </div>
  );
}

function PrimaryLinkButton({
  href,
  target,
  icon,
  label,
  secondary,
  colour,
}: {
  href: string;
  target?: string;
  icon: React.ReactNode;
  label: string;
  secondary?: boolean;
  colour?: string;
}) {
  const bg = secondary ? '#F3F4F6' : colour || BRAND_GREEN;
  const fg = secondary ? '#374151' : '#fff';
  return (
    <Link
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      style={{
        flex: '1 1 200px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '14px 16px',
        backgroundColor: bg,
        color: fg,
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        textDecoration: 'none',
      }}
    >
      {icon}
      {label}
    </Link>
  );
}

/* ══ MODALS ════════════════════════════════════════════ */

function CancelModal({
  open,
  onClose,
  onConfirm,
  loading,
  isBuyer,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, reasonText: string) => void;
  loading: boolean;
  isBuyer: boolean;
}) {
  const [reason, setReason] = useState('changed_mind');
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    if (open) {
      setReason('changed_mind');
      setReasonText('');
    }
  }, [open]);

  return (
    <SimpleModal open={open} onClose={onClose} title="Cancel order">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: TEXT_MUTED,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {isBuyer
            ? "Tell us why you're cancelling. A refund will be issued to your original payment method."
            : "Let the buyer know why you're cancelling. They'll be refunded automatically."}
        </p>
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: TEXT_DARK,
              marginBottom: 6,
            }}
          >
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${CARD_BORDER}`,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              backgroundColor: '#fff',
              boxSizing: 'border-box',
            }}
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: TEXT_DARK,
              marginBottom: 6,
            }}
          >
            Details (optional)
          </label>
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Add any extra context..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${CARD_BORDER}`,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Keep order
          </button>
          <button
            onClick={() => onConfirm(reason, reasonText)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#DC2626',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Cancelling...' : 'Cancel order'}
          </button>
        </div>
      </div>
    </SimpleModal>
  );
}

function ConfirmReceiptModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <SimpleModal open={open} onClose={onClose} title="Confirm receipt">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: '#374151',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Have you received your item and are you happy with it? This will release
          payment to the seller immediately.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Not yet
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: BRAND_GREEN,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Confirming...' : 'Yes, confirm'}
          </button>
        </div>
      </div>
    </SimpleModal>
  );
}

function ReportLostModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <SimpleModal open={open} onClose={onClose} title="Report item lost">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: '#374151',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          If your item has been in transit for over 14 days and hasn't arrived, you
          can report it as lost. We'll investigate and process a refund if necessary.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Not yet
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#DC2626',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Reporting...' : 'Report lost'}
          </button>
        </div>
      </div>
    </SimpleModal>
  );
}
