'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getCart, removeFromCart } from '@mulligans/api-client';

// ─── Design tokens (v2.0) ──────────────────────────────────
const PREVIEW_SHADOW = '0 12px 40px rgba(6,7,10,0.15), 0 4px 8px rgba(6,7,10,0.06)';
const CARD_BORDER = '#E5E7EB';
const TEXT_PRIMARY = '#06070A';
const TEXT_BODY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const BRAND_GREEN = '#1DC690';
const SURFACE = '#FAFAF8';

// ─── Types (matches cart page's actual response shape) ────
interface CartLineItem {
  id: string;
  listing_id: string;
  title: string;
  image_url: string | null;
  price: number | string;
  offer_price?: number | string | null;
  brand?: string | null;
  model?: string | null;
  selected_size?: string | null;
  quantity: number;
  is_available?: boolean;
}

interface CartSellerGroup {
  seller_id: string;
  seller_name?: string | null;
  pro_store_name?: string | null;
  is_pro_store?: boolean;
  shipping_cost?: number;
  items: CartLineItem[];
}

interface CartResponseShape {
  sellers?: CartSellerGroup[];
}

interface CartPreviewProps {
  open: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onCountChange?: (count: number) => void;
}

// ─── Helpers ───────────────────────────────────────────────
function fp(n: number) {
  return `£${n.toFixed(2)}`;
}

function buyerPriceFor(item: CartLineItem): number {
  const raw = Number(item.offer_price ?? item.price);
  return raw * 1.075 + 0.99;
}

function sellerDisplayName(seller: CartSellerGroup): string {
  if (seller.is_pro_store && seller.pro_store_name) return seller.pro_store_name;
  return seller.seller_name || 'Seller';
}

// ─── Component ─────────────────────────────────────────────
export function CartPreview({ open, onClose, onMouseEnter, onMouseLeave, onCountChange }: CartPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<CartSellerGroup[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await getCart()) as CartResponseShape;
      const fetchedSellers = res?.sellers || [];
      setSellers(fetchedSellers);
      // Sync badge count with fresh data
      if (onCountChange) {
        const count = fetchedSellers.reduce(
          (sum, s) => sum + s.items.reduce((n, i) => n + (i.quantity || 1), 0),
          0
        );
        onCountChange(count);
      }
    } catch {
      setError('Could not load your bag');
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  // Fetch fresh cart every time the preview opens
  useEffect(() => {
    if (open) fetchCart();
  }, [open, fetchCart]);

  // ESC key closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleRemove = async (item: CartLineItem) => {
    if (removing) return;
    setRemoving(item.id);
    // Optimistic update — also notify parent so badge ticks down immediately
    setSellers((prev) => {
      const next = prev
        .map((s) => ({ ...s, items: s.items.filter((i) => i.id !== item.id) }))
        .filter((s) => s.items.length > 0);
      if (onCountChange) {
        const count = next.reduce(
          (sum, s) => sum + s.items.reduce((n, i) => n + (i.quantity || 1), 0),
          0
        );
        onCountChange(count);
      }
      return next;
    });
    try {
      await removeFromCart(item.listing_id);
    } catch {
      // On error, refetch to restore correct state (also re-syncs badge)
      await fetchCart();
    } finally {
      setRemoving(null);
    }
  };

  if (!open) return null;

  // ─── Compute totals ──────────────────────────────────────
  const allItems = sellers.flatMap((s) => s.items);
  const itemCount = allItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const subtotal = allItems.reduce((sum, item) => {
    const raw = Number(item.offer_price ?? item.price);
    return sum + raw * (item.quantity || 1);
  }, 0);
  const fees = allItems.reduce((sum, item) => {
    const raw = Number(item.offer_price ?? item.price);
    return sum + (raw * 0.075 + 0.99) * (item.quantity || 1);
  }, 0);
  const shipping = sellers.reduce((sum, s) => sum + (s.shipping_cost || 0), 0);
  const total = subtotal + fees + shipping;

  const isEmpty = !loading && sellers.length === 0;

  return (
    <div
      ref={containerRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute right-0 mt-2 rounded-2xl bg-white"
      style={{
        width: '380px',
        maxHeight: '600px',
        boxShadow: PREVIEW_SHADOW,
        border: `1px solid ${CARD_BORDER}`,
        zIndex: 60,
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="dialog"
      aria-label="Cart preview"
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 22px 14px',
          borderBottom: `1px solid ${CARD_BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: TEXT_PRIMARY, letterSpacing: '-0.005em' }}>
            Bag
          </span>
          {!loading && (
            <span style={{ fontWeight: 500, fontSize: 14, color: TEXT_BODY }}>
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ color: TEXT_MUTED, cursor: 'pointer', padding: 4 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = TEXT_PRIMARY; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = TEXT_MUTED; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: loading || isEmpty ? '24px 22px' : '0' }}>
        {loading && (
          <>
            <div style={{ height: 14, background: SURFACE, borderRadius: 4, marginBottom: 10, width: '60%' }} />
            <div style={{ height: 60, background: SURFACE, borderRadius: 8, marginBottom: 10 }} />
            <div style={{ height: 60, background: SURFACE, borderRadius: 8 }} />
          </>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: TEXT_BODY, marginBottom: 10 }}>{error}</p>
            <button
              onClick={fetchCart}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: BRAND_GREEN,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && isEmpty && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>Your bag is empty</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: TEXT_BODY, marginBottom: 14 }}>Find your next club, towel, or fit.</p>
            <Link
              href="/"
              onClick={onClose}
              style={{
                display: 'inline-block',
                fontSize: 13,
                fontWeight: 700,
                color: 'white',
                backgroundColor: BRAND_GREEN,
                padding: '10px 18px',
                borderRadius: 10,
                letterSpacing: '0.01em',
              }}
            >
              Continue shopping
            </Link>
          </div>
        )}

        {!loading && !error && !isEmpty && (
          <>
            {sellers.map((seller, sellerIdx) => (
              <div
                key={seller.seller_id}
                style={{
                  padding: '14px 22px',
                  borderTop: sellerIdx > 0 ? `1px solid ${CARD_BORDER}` : 'none',
                }}
              >
                {/* Seller header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: SURFACE,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: TEXT_BODY,
                      flexShrink: 0,
                    }}
                  >
                    {sellerDisplayName(seller).charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
                    {sellerDisplayName(seller)}
                  </span>
                </div>

                {/* Items */}
                {seller.items.map((item) => {
                  const buyerPrice = buyerPriceFor(item);
                  const hasOffer =
                    item.offer_price !== null && item.offer_price !== undefined && Number(item.offer_price) !== Number(item.price);
                  const isUnavailable = item.is_available === false;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginBottom: 10,
                        opacity: isUnavailable ? 0.5 : 1,
                      }}
                    >
                      {/* Image */}
                      <Link
                        href={`/listings/${item.listing_id}`}
                        onClick={onClose}
                        style={{ flexShrink: 0 }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 8,
                            overflow: 'hidden',
                            backgroundColor: SURFACE,
                          }}
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : null}
                        </div>
                      </Link>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          href={`/listings/${item.listing_id}`}
                          onClick={onClose}
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: TEXT_PRIMARY,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textDecoration: 'none',
                            lineHeight: 1.3,
                          }}
                        >
                          {item.title}
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: BRAND_GREEN }}>
                            {fp(buyerPrice)}
                          </span>
                          {hasOffer && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#7C5CBF', backgroundColor: 'rgba(124,92,191,0.10)', padding: '2px 6px', borderRadius: 4 }}>
                              Offer price
                            </span>
                          )}
                          {item.selected_size && (
                            <span style={{ fontSize: 11, fontWeight: 500, color: TEXT_BODY }}>
                              · {item.selected_size}
                            </span>
                          )}
                        </div>
                        {isUnavailable && (
                          <p style={{ fontSize: 11, fontWeight: 500, color: '#DC2626', marginTop: 2 }}>
                            No longer available
                          </p>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemove(item)}
                        disabled={removing === item.id}
                        aria-label="Remove"
                        style={{
                          flexShrink: 0,
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          color: TEXT_MUTED,
                          cursor: removing === item.id ? 'not-allowed' : 'pointer',
                          opacity: removing === item.id ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => { if (!removing) { (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE; } }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = TEXT_MUTED; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer with total + actions */}
      {!loading && !error && !isEmpty && (
        <div style={{ padding: '14px 22px 16px', borderTop: `1px solid ${CARD_BORDER}`, backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: BRAND_GREEN, letterSpacing: '-0.01em' }}>
              {fp(total)}
            </span>
          </div>
          <p style={{ fontSize: 11, fontWeight: 500, color: TEXT_MUTED, textAlign: 'right', marginBottom: 12 }}>
            incl. fees & shipping
          </p>

          <Link
            href="/checkout"
            onClick={onClose}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: 'white',
              backgroundColor: BRAND_GREEN,
              padding: '12px 16px',
              borderRadius: 10,
              letterSpacing: '0.01em',
              marginBottom: 8,
              textDecoration: 'none',
            }}
          >
            Checkout
          </Link>
          <Link
            href="/cart"
            onClick={onClose}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: '#1C4670',
              padding: '8px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            View bag
          </Link>
        </div>
      )}
    </div>
  );
}