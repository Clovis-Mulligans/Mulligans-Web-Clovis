'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getCart,
  removeFromCart,
  createCartCheckout,
  type CartResponse,
  type CartSeller,
  type CartItem,
} from '@/lib/cart-api';
import { CardSkeletonGrid } from '@/components/LoadingSkeleton';

/* ── Constants ─────────────────────────────────────────── */

const AVATAR_COLOURS = ['#1DC690', '#278AB0', '#1C4670', '#7C5CBF'];

/* ── Helpers ───────────────────────────────────────────── */

function formatPrice(n: number) {
  return `£${n.toFixed(2)}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ── Page ──────────────────────────────────────────────── */

export default function CartPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/cart');
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      setCart(await getCart());
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  /* ── Remove item (optimistic) ── */
  const handleRemoveItem = async (item: CartItem) => {
    setRemoving(item.id);
    setCart((prev) => {
      if (!prev) return prev;
      const sellers = prev.sellers
        .map((s) => ({ ...s, items: s.items.filter((i) => i.id !== item.id) }))
        .filter((s) => s.items.length > 0);
      return { ...prev, sellers };
    });
    try {
      await removeFromCart(item.listing_id, item.selected_size);
      await fetchCart();
    } catch {
      await fetchCart();
    } finally {
      setRemoving(null);
    }
  };

  /* ── Checkout ── */
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/cart');
      return;
    }
    setCheckingOut(true);
    try {
      const session = await createCartCheckout();
      window.location.href = session.url;
    } catch (err) {
      console.error('Checkout failed:', err);
      setCheckingOut(false);
    }
  };

  /* ── Auth loading gate ── */
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1DC690] border-t-transparent" />
      </div>
    );
  }

  const allItems = cart?.sellers.flatMap((s) => s.items) ?? [];
  const totalItemCount = allItems.reduce((sum, i) => sum + i.quantity, 0);
  const isEmpty = !cart || cart.sellers.length === 0;

  /* ── Order summary calculations (brief-specified formulas) ── */
  const itemsSubtotal = allItems.reduce((sum, item) => {
    const raw = Number(item.offer_price ?? item.price);
    return sum + raw * item.quantity;
  }, 0);

  const buyerProtectionFee = allItems.reduce((sum, item) => {
    const raw = Number(item.offer_price ?? item.price);
    return sum + (raw * 0.075 + 0.99) * item.quantity;
  }, 0);

  const shippingTotal = (cart?.sellers ?? []).reduce(
    (sum, seller) => sum + (seller.shipping_cost || 0),
    0
  );

  const estimatedTotal = itemsSubtotal + buyerProtectionFee + shippingTotal;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EAEAE0' }}>
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <CardSkeletonGrid count={4} />
        ) : isEmpty ? (
          /* ── Empty state ───────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ADADAD"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <p
              className="mt-4"
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '1.1rem',
                color: '#06070A',
              }}
            >
              Your bag is empty
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                color: '#6B6B6B',
              }}
            >
              Browse listings to find your next club
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex items-center rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#1DC690' }}
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <>
            {/* ── Page heading ────────────────────── */}
            <h1
              className="mb-6"
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                fontSize: '1.5rem',
                color: '#06070A',
              }}
            >
              Your bag ({totalItemCount} item{totalItemCount !== 1 ? 's' : ''})
            </h1>

            {/* ── Two-column grid (single col on mobile) ── */}
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_252px] gap-4 items-start">
              {/* ── LEFT: Seller cards ── */}
              <div className="space-y-4 min-w-0">
                {cart!.sellers.map((seller, idx) => (
                  <SellerCardBlock
                    key={seller.seller_id}
                    seller={seller}
                    colourIndex={idx}
                    removing={removing}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>

              {/* ── RIGHT: Order summary (sticky on desktop) ── */}
              <div className="md:sticky md:top-5">
                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: '#fff',
                    border: '0.5px solid #d4d4cc',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 500,
                      fontSize: '14px',
                      color: '#06070A',
                      marginBottom: '12px',
                    }}
                  >
                    Order summary
                  </p>

                  {/* Rows */}
                  <div className="space-y-2" style={{ fontSize: '13px' }}>
                    <div className="flex justify-between">
                      <span style={{ color: '#6B6B6B' }}>
                        Items ({totalItemCount})
                      </span>
                      <span style={{ color: '#06070A' }}>
                        {formatPrice(itemsSubtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#6B6B6B' }}>
                        Buyer protection fee
                      </span>
                      <span style={{ color: '#06070A' }}>
                        {formatPrice(buyerProtectionFee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#6B6B6B' }}>Shipping (est.)</span>
                      <span style={{ color: '#06070A' }}>
                        {formatPrice(shippingTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div
                    className="my-3"
                    style={{ borderTop: '1px solid #d4d4cc' }}
                  />

                  {/* Total */}
                  <div className="flex justify-between items-baseline">
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 500,
                        fontSize: '14px',
                        color: '#06070A',
                      }}
                    >
                      Estimated total
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        fontSize: '16px',
                        color: '#06070A',
                      }}
                    >
                      {formatPrice(estimatedTotal)}
                    </span>
                  </div>

                  {/* Checkout button */}
                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="mt-4 w-full rounded-lg py-3 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#1DC690' }}
                  >
                    {checkingOut ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                      </span>
                    ) : (
                      'Proceed to checkout'
                    )}
                  </button>

                  {/* Buyer protection note */}
                  <p
                    className="mt-3 text-center"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      color: '#6B6B6B',
                    }}
                  >
                    &#10022; All purchases covered by Mulligans Buyer Protection
                  </p>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}

/* ── Seller Card Component ────────────────────────────── */

function SellerCardBlock({
  seller,
  colourIndex,
  removing,
  onRemove,
}: {
  seller: CartSeller;
  colourIndex: number;
  removing: string | null;
  onRemove: (item: CartItem) => void;
}) {
  const avatarBg = AVATAR_COLOURS[colourIndex % AVATAR_COLOURS.length];
  const isPro = seller.seller_is_verified_seller_seller;
  const displayName = seller.seller_name || 'Seller';
  const initials = getInitials(displayName);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#fff', border: '0.5px solid #d4d4cc' }}
    >
      {/* ── Seller header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '0.5px solid #d4d4cc' }}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full text-white"
          style={{
            width: 32,
            height: 32,
            backgroundColor: avatarBg,
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            ...(isPro
              ? { outline: '2px solid #C9A84C', outlineOffset: '1px' }
              : {}),
          }}
        >
          {seller.seller_avatar ? (
            <img
              src={seller.seller_avatar}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Name + handle */}
        <div className="flex-1 min-w-0">
          <p
            className="truncate"
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              fontSize: '13px',
              color: '#06070A',
            }}
          >
            {displayName}
          </p>
        </div>

        {/* PRO badge */}
        {isPro && (
          <span
            className="flex-shrink-0"
            style={{
              backgroundColor: '#C9A84C',
              color: '#fff',
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '4px',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
            }}
          >
            PRO
          </span>
        )}
      </div>

      {/* ── Item rows ── */}
      {seller.items.map((item, itemIdx) => {
        const raw = Number(item.offer_price ?? item.price);
        const buyerPrice = raw * 1.075 + 0.99;
        const hasOffer =
          item.offer_price !== null && item.offer_price !== undefined;

        // Build meta parts
        const metaParts: string[] = [];
        if (item.selected_size) metaParts.push(item.selected_size);

        return (
          <div
            key={item.id}
            className="flex items-start gap-3 px-4 py-3"
            style={{
              borderBottom:
                itemIdx < seller.items.length - 1
                  ? '0.5px solid #d4d4cc'
                  : 'none',
            }}
          >
            {/* Thumbnail */}
            <Link href={`/listings/${item.listing_id}`} className="flex-shrink-0">
              <div
                className="overflow-hidden"
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 8,
                  backgroundColor: '#F4F4F0',
                }}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-2xl text-gray-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ccc"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>
            </Link>

            {/* Item details */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <Link href={`/listings/${item.listing_id}`}>
                <p
                  className="truncate"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    fontSize: '13px',
                    color: '#06070A',
                  }}
                >
                  {item.title}
                </p>
              </Link>

              {/* Meta line */}
              {metaParts.length > 0 && (
                <p
                  className="mt-0.5"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    color: '#aaa',
                  }}
                >
                  {metaParts.join(' \u00B7 ')}
                </p>
              )}

              {/* Price */}
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#06070A',
                  }}
                >
                  {formatPrice(buyerPrice)}
                </span>

                {hasOffer && (
                  <>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '11px',
                        color: '#ccc',
                        textDecoration: 'line-through',
                      }}
                    >
                      {formatPrice(Number(item.price) * 1.075 + 0.99)}
                    </span>
                    <span
                      style={{
                        backgroundColor: '#F0EAFA',
                        color: '#7C5CBF',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 500,
                      }}
                    >
                      Offer price
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Remove button */}
            <button
              onClick={() => onRemove(item)}
              disabled={removing === item.id}
              className="flex-shrink-0 p-1 transition-colors group"
              aria-label="Remove item"
            >
              <Trash2
                width={16}
                height={16}
                className="text-[#ccc] group-hover:text-[#e24b4a] transition-colors"
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
