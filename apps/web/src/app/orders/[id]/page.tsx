'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Star,
  ExternalLink,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getOrder,
  markAsShipped,
  confirmReceipt,
  openDispute,
} from '@mulligans/api-client';
import type { OrderDetail, OrderParty } from '@mulligans/api-client';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import OrderTimeline from '@/components/OrderTimeline';
import SimpleModal from '@/components/SimpleModal';

/* ── Helpers ──────────────────────────────────────────── */

const fp = (n: number) => `£${n.toFixed(2)}`;

const AVATAR_COLOURS = ['#1DC690', '#278AB0', '#1C4670', '#7C5CBF'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getTrackingUrl(carrier: string | null, tracking: string | null): string | null {
  if (!tracking) return null;
  const c = (carrier || '').toLowerCase();
  if (c.includes('royal mail'))
    return `https://www.royalmail.com/track-your-item#/tracking-results/${tracking}`;
  if (c.includes('evri') || c.includes('hermes'))
    return `https://www.evri.com/track/parcel/${tracking}`;
  if (c.includes('dpd'))
    return `https://track.dpd.co.uk/parcels/${tracking}`;
  return `https://www.google.com/search?q=${encodeURIComponent((carrier || 'parcel') + ' tracking ' + tracking)}`;
}

/* ══ PAGE ══════════════════════════════════════════════ */

export default function OrderDetailPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);

  /* Auth gate */
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [isLoading, isAuthenticated, router]);

  /* Fetch order */
  const fetchOrder = useCallback(async () => {
    if (!isAuthenticated || !orderId) return;
    setLoading(true);
    try {
      const data = await getOrder(orderId);
      /* Verify this order belongs to current user */
      if (!data.is_buyer && !data.is_seller) {
        router.push('/orders');
        return;
      }
      setOrder(data);
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError(err?.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /* ── Action handlers ── */
  const handleConfirmReceipt = async () => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    try {
      await confirmReceipt(order.id);
      await fetchOrder();
    } catch (err) {
      console.error('Confirm receipt failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShip = async (trackingNumber: string, carrier: string) => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    try {
      await markAsShipped(order.id, {
        tracking_number: trackingNumber,
        carrier: carrier,
      });
      setShowShipDialog(false);
      await fetchOrder();
    } catch (err) {
      console.error('Mark as shipped failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (
    reasonType: string,
    reasonText: string,
    refundPercent: number
  ) => {
    if (!order || actionLoading) return;
    setActionLoading(true);
    try {
      await openDispute(order.id, {
        reasonType,
        reasonText,
        requestedRefundPercent: refundPercent,
      });
      setShowDisputeDialog(false);
      await fetchOrder();
    } catch (err) {
      console.error('Open dispute failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Render ── */
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

  if (loading) {
    return (
      <div style={{ backgroundColor: '#EAEAE0', minHeight: '60vh' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            maxWidth: 680,
            margin: '0 auto',
            padding: '32px 16px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
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
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ backgroundColor: '#EAEAE0', minHeight: '60vh' }}>
        <div
          style={{
            maxWidth: 680,
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
              color: '#06070A',
              margin: '16px 0 6px',
            }}
          >
            Order not found
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: '#888',
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
              color: '#1DC690',
              textDecoration: 'none',
            }}
          >
            ← Back to orders
          </Link>
        </div>
      </div>
    );
  }

  /* ── Derived values ── */
  const raw = Number(order.amount);
  const qty = order.quantity || 1;
  const itemSubtotal = raw * qty;
  const buyerProtectionFee = (raw * 0.075 + 0.99) * qty;
  const shippingCost = Number(order.shipping_cost || 0);
  const totalPaid = itemSubtotal + buyerProtectionFee + shippingCost;
  const buyerPrice = raw * 1.075 + 0.99;

  const mainImage =
    order.listing.images?.sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    )[0]?.image_url || null;

  const counterparty: OrderParty = order.is_buyer ? order.seller : order.buyer;
  const counterpartyLabel = order.is_buyer ? 'Seller' : 'Buyer';
  const avatarColour =
    AVATAR_COLOURS[
      counterparty.name.charCodeAt(0) % AVATAR_COLOURS.length
    ];
  const rating = Number(counterparty.rating);

  const trackingUrl = getTrackingUrl(order.carrier, order.tracking_number);

  /* Can the buyer open a dispute? Only if delivered and no existing dispute */
  const canDispute =
    order.is_buyer &&
    order.status === 'delivered' &&
    !order.dispute;

  /* Can the seller ship? Only if paid/to_ship */
  const canShip =
    order.is_seller &&
    (order.status === 'paid' || order.status === 'to_ship');

  return (
    <div style={{ backgroundColor: '#EAEAE0' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 48px' }}>
        {/* ── Back nav ── */}
        <Link
          href="/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 600,
            color: '#1DC690',
            textDecoration: 'none',
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={16} />
          Back to orders
        </Link>

        {/* ── Sections ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 1. ORDER HEADER CARD */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              border: '1px solid #e8e8e4',
              padding: 18,
            }}
          >
            {/* Order ID */}
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: '#aaa',
                marginBottom: 12,
              }}
            >
              Order #{order.id.slice(-8).toUpperCase()}
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              {/* Image */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: '#f0f0ec',
                  flexShrink: 0,
                }}
              >
                {mainImage ? (
                  <img
                    src={mainImage}
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
                    <Package size={32} color="#ccc" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#06070A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {order.listing.title}
                </div>
                {order.listing.brand && (
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      color: '#999',
                      marginTop: 2,
                    }}
                  >
                    {order.listing.brand}
                  </div>
                )}
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#1DC690',
                    marginTop: 4,
                  }}
                >
                  {fp(buyerPrice)}
                  {qty > 1 && (
                    <span
                      style={{ fontSize: 12, color: '#888', fontWeight: 500, marginLeft: 6 }}
                    >
                      x{qty}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <OrderStatusBadge status={order.status} />
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                      color: '#888',
                    }}
                  >
                    {formatDate(order.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ORDER TIMELINE */}
          <OrderTimeline order={order} />

          {/* 3. SHIPPING DETAILS */}
          {(order.tracking_number || order.carrier || order.shipped_at) && (
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                border: '1px solid #e8e8e4',
                padding: 16,
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#06070A',
                  margin: '0 0 12px',
                }}
              >
                Shipping details
              </h3>
              {order.carrier && (
                <Row label="Carrier" value={order.carrier} />
              )}
              {order.tracking_number && (
                <Row label="Tracking" value={order.tracking_number} />
              )}
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1DC690',
                    textDecoration: 'none',
                    marginTop: 8,
                  }}
                >
                  <Truck size={14} />
                  Track shipment
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}

          {/* 4. PRICE BREAKDOWN */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              border: '1px solid #e8e8e4',
              padding: 16,
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                fontWeight: 700,
                color: '#06070A',
                margin: '0 0 12px',
              }}
            >
              Price breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <PriceRow
                label={`Item price${qty > 1 ? ` (x${qty})` : ''}`}
                value={fp(itemSubtotal)}
              />
              <PriceRow
                label="Buyer protection fee"
                value={fp(buyerProtectionFee)}
              />
              <PriceRow label="Shipping" value={fp(shippingCost)} />
              <div
                style={{
                  borderTop: '1px solid #e8e8e4',
                  margin: '4px 0',
                }}
              />
              <PriceRow
                label="Total"
                value={fp(totalPaid)}
                bold
                green
              />
            </div>
          </div>

          {/* 5. COUNTERPARTY INFO */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              border: '1px solid #e8e8e4',
              padding: 16,
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                fontWeight: 700,
                color: '#06070A',
                margin: '0 0 12px',
              }}
            >
              {counterpartyLabel}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Avatar */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: avatarColour,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {counterparty.avatar_url || counterparty.avatar ? (
                  <img
                    src={counterparty.avatar_url || counterparty.avatar || ''}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getInitials(counterparty.display_name || counterparty.name)
                )}
              </div>

              {/* Name + rating */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#06070A',
                  }}
                >
                  {counterparty.display_name || counterparty.name}
                </div>
                {rating > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 3,
                    }}
                  >
                    <Star size={13} fill="#F5A623" color="#F5A623" />
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        color: '#666',
                        fontWeight: 600,
                      }}
                    >
                      {rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* View profile */}
              <Link
                href={`/profile/${counterparty.id}`}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1DC690',
                  textDecoration: 'none',
                }}
              >
                View profile
              </Link>
            </div>
          </div>

          {/* 6. ACTION BUTTONS */}
          <ActionButtons
            order={order}
            canShip={canShip}
            canDispute={canDispute}
            actionLoading={actionLoading}
            onConfirmReceipt={handleConfirmReceipt}
            onShowShipDialog={() => setShowShipDialog(true)}
            onShowDisputeDialog={() => setShowDisputeDialog(true)}
          />

          {/* Dispute info (if exists) */}
          {order.dispute && (
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                border: '1px solid #e8e8e4',
                padding: 16,
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#991B1B',
                  margin: '0 0 12px',
                }}
              >
                Dispute
              </h3>
              <Row label="Status" value={order.dispute.status.replace(/_/g, ' ')} />
              <Row
                label="Reason"
                value={order.dispute.reason_type.replace(/_/g, ' ')}
              />
              <Row label="Details" value={order.dispute.reason} />
              {order.dispute.resolution_notes && (
                <Row label="Resolution" value={order.dispute.resolution_notes} />
              )}
            </div>
          )}
        </div>

        {/* ── Dialogs ── */}
        <ShipDialog
          open={showShipDialog}
          loading={actionLoading}
          onClose={() => setShowShipDialog(false)}
          onSubmit={handleShip}
        />
        <DisputeDialog
          open={showDisputeDialog}
          loading={actionLoading}
          onClose={() => setShowDisputeDialog(false)}
          onSubmit={handleDispute}
        />
      </div>
    </div>
  );
}

/* ══ HELPER COMPONENTS ═════════════════════════════════ */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        marginBottom: 6,
      }}
    >
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ color: '#06070A', fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

function PriceRow({
  label,
  value,
  bold,
  green,
}: {
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
      }}
    >
      <span style={{ color: '#666', fontWeight: bold ? 700 : 400 }}>
        {label}
      </span>
      <span
        style={{
          color: green ? '#1DC690' : '#06070A',
          fontWeight: bold ? 700 : 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ActionButtons({
  order,
  canShip,
  canDispute,
  actionLoading,
  onConfirmReceipt,
  onShowShipDialog,
  onShowDisputeDialog,
}: {
  order: OrderDetail;
  canShip: boolean;
  canDispute: boolean;
  actionLoading: boolean;
  onConfirmReceipt: () => void;
  onShowShipDialog: () => void;
  onShowDisputeDialog: () => void;
}) {
  const showConfirm = order.is_buyer && order.can_confirm_receipt;
  if (!showConfirm && !canShip && !canDispute) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Buyer: confirm receipt */}
      {showConfirm && (
        <button
          onClick={onConfirmReceipt}
          disabled={actionLoading}
          style={{
            width: '100%',
            padding: '14px 16px',
            backgroundColor: '#1DC690',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            opacity: actionLoading ? 0.6 : 1,
          }}
        >
          {actionLoading ? 'Processing...' : 'Confirm receipt'}
        </button>
      )}

      {/* Seller: mark as shipped */}
      {canShip && (
        <button
          onClick={onShowShipDialog}
          disabled={actionLoading}
          style={{
            width: '100%',
            padding: '14px 16px',
            backgroundColor: '#1DC690',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            opacity: actionLoading ? 0.6 : 1,
          }}
        >
          Mark as shipped
        </button>
      )}

      {/* Buyer: open dispute */}
      {canDispute && (
        <button
          onClick={onShowDisputeDialog}
          disabled={actionLoading}
          style={{
            width: '100%',
            padding: '14px 16px',
            backgroundColor: '#fff',
            color: '#e24b4a',
            border: '1px solid #e24b4a',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            opacity: actionLoading ? 0.6 : 1,
          }}
        >
          Open dispute
        </button>
      )}
    </div>
  );
}

/* ══ SHIP DIALOG ═══════════════════════════════════════ */

function ShipDialog({
  open,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (tracking: string, carrier: string) => void;
}) {
  const [tracking, setTracking] = useState('');
  const [carrier, setCarrier] = useState('');

  return (
    <SimpleModal open={open} onClose={onClose} title="Mark as shipped">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: '#06070A',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Tracking number (optional)
          </label>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Enter tracking number"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: '#06070A',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Carrier (optional)
          </label>
          <input
            type="text"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="e.g. Royal Mail, Evri, DPD"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          onClick={() => onSubmit(tracking, carrier)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px 16px',
            backgroundColor: '#1DC690',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            marginTop: 4,
          }}
        >
          {loading ? 'Submitting...' : 'Confirm shipped'}
        </button>
      </div>
    </SimpleModal>
  );
}

/* ══ DISPUTE DIALOG ════════════════════════════════════ */

const DISPUTE_REASONS = [
  { value: 'not_arrived', label: 'Item not arrived' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'other', label: 'Other' },
];

function DisputeDialog({
  open,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (reasonType: string, reasonText: string, refundPercent: number) => void;
}) {
  const [reasonType, setReasonType] = useState('not_arrived');
  const [reasonText, setReasonText] = useState('');

  const canSubmit = reasonText.trim().length > 0;

  return (
    <SimpleModal open={open} onClose={onClose} title="Open a dispute">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: '#06070A',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Reason
          </label>
          <select
            value={reasonType}
            onChange={(e) => setReasonType(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              backgroundColor: '#fff',
              boxSizing: 'border-box',
            }}
          >
            {DISPUTE_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: '#06070A',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Describe the issue
          </label>
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Provide details about the problem..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          onClick={() => onSubmit(reasonType, reasonText, 100)}
          disabled={loading || !canSubmit}
          style={{
            width: '100%',
            padding: '13px 16px',
            backgroundColor: canSubmit ? '#e24b4a' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            marginTop: 4,
          }}
        >
          {loading ? 'Submitting...' : 'Submit dispute'}
        </button>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            color: '#999',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Disputes are reviewed by the Mulligans team within 48 hours.
        </p>
      </div>
    </SimpleModal>
  );
}
