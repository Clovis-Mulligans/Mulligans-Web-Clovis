'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Tag,
  Star,
  ShieldCheck,
  PackageCheck,
  BadgeCheck,
  Clock,
  Lock,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
} from 'lucide-react';
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

/* ── Extended types ─────────────────────────────────────
   The cart API does not currently return brand, model,
   condition_overall, is_pro_store, or pro_store_name.
   We type them as optional so the backend can start
   returning them without breaking this file.
   See questions.md for details.                         */

type ExtendedCartItem = CartItem & {
  brand?: string | null;
  model?: string | null;
  condition_overall?: number | null;
};

type ExtendedCartSeller = CartSeller & {
  is_pro_store?: boolean | null;
  pro_store_name?: string | null;
};

/* ── Design constants ─────────────────────────────────── */

const AVATAR_COLOURS = ['#1DC690', '#278AB0', '#1C4670', '#7C5CBF'];

const CONDITION_CONFIG: Record<number, { bg: string; label: string }> = {
  1: { bg: '#EF4444', label: 'Poor' },
  2: { bg: '#F59E0B', label: 'Good' },
  3: { bg: '#3B82F6', label: 'Very Good' },
  4: { bg: '#8B5CF6', label: 'Excellent' },
  5: { bg: '#10B981', label: 'New' },
};

/* ── Helpers ──────────────────────────────────────────── */

const fp = (n: number) => `£${n.toFixed(2)}`;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ══ PAGE ══════════════════════════════════════════════ */

export default function CartPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [protectionOpen, setProtectionOpen] = useState(false);

  /* ── Auth gate ── */
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '96px 0',
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
    );
  }

  /* ── Derived state ── */
  const allItems = cart?.sellers.flatMap((s) => s.items) ?? [];
  const availableItems = allItems.filter((i) => i.is_available);
  const totalItemCount = allItems.reduce((sum, i) => sum + i.quantity, 0);
  const hasUnavailableItems = allItems.some((i) => !i.is_available);
  const isEmpty = !cart || cart.sellers.length === 0;

  /* ── Order summary totals (available items only) ── */
  const itemsSubtotal = availableItems.reduce((sum, item) => {
    const raw = Number(item.offer_price ?? item.price);
    return sum + raw * item.quantity;
  }, 0);

  const buyerProtectionFee = availableItems.reduce((sum, item) => {
    const raw = Number(item.offer_price ?? item.price);
    return sum + (raw * 0.075 + 0.99) * item.quantity;
  }, 0);

  const shippingTotal = (cart?.sellers ?? []).reduce(
    (sum, seller) => sum + (seller.shipping_cost || 0),
    0
  );

  const estimatedTotal = itemsSubtotal + buyerProtectionFee + shippingTotal;

  return (
    <div style={{ backgroundColor: '#EAEAE0' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .trash-btn { color: #c8c8c8; transition: color 0.15s; }
        .trash-btn:hover { color: #e24b4a; }
        .cart-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 767px) {
          .cart-grid { grid-template-columns: 1fr; }
          .cart-summary-col { order: -1; position: static !important; }
        }
      `}</style>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '36px 20px 48px' }}>
        {loading ? (
          <CardSkeletonGrid count={4} />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Page heading ── */}
            <h1
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 28,
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: 32,
                color: '#06070A',
                margin: '0 0 32px',
              }}
            >
              Bag ({totalItemCount} item{totalItemCount !== 1 ? 's' : ''})
            </h1>

            {/* ── Two-column grid ── */}
            <div className="cart-grid">
              {/* LEFT: Seller cards */}
              <div
                className="cart-items-col"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  minWidth: 0,
                }}
              >
                {cart!.sellers.map((seller, idx) => (
                  <SellerCard
                    key={seller.seller_id}
                    seller={seller as ExtendedCartSeller}
                    colourIndex={idx}
                    removing={removing}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>

              {/* RIGHT: Order summary (sticky on desktop, above cards on mobile) */}
              <div
                className="cart-summary-col"
                style={{ position: 'sticky', top: 24 }}
              >
                <OrderSummary
                  totalItemCount={totalItemCount}
                  itemsSubtotal={itemsSubtotal}
                  buyerProtectionFee={buyerProtectionFee}
                  shippingTotal={shippingTotal}
                  estimatedTotal={estimatedTotal}
                  checkingOut={checkingOut}
                  hasUnavailableItems={hasUnavailableItems}
                  onCheckout={handleCheckout}
                  protectionOpen={protectionOpen}
                  setProtectionOpen={setProtectionOpen}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══ EMPTY STATE ═══════════════════════════════════════ */

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: '#e0e0d8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <ShoppingBag size={36} color="#9a9a92" strokeWidth={1.75} />
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 22,
          fontWeight: 700,
          color: '#06070A',
          margin: '0 0 6px',
        }}
      >
        Your bag is empty
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: '#6B6B6B',
          margin: '0 0 24px',
        }}
      >
        Browse listings to find your next club
      </p>
      <Link
        href="/search"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 28px',
          backgroundColor: '#1DC690',
          color: '#fff',
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          fontWeight: 700,
          borderRadius: 10,
          textDecoration: 'none',
        }}
      >
        Browse listings
      </Link>
    </div>
  );
}

/* ══ SELLER CARD ═══════════════════════════════════════ */

function SellerCard({
  seller,
  colourIndex,
  removing,
  onRemove,
}: {
  seller: ExtendedCartSeller;
  colourIndex: number;
  removing: string | null;
  onRemove: (item: CartItem) => void;
}) {
  const isPro = seller.is_pro_store ?? seller.seller_is_verified_seller_seller;
  const displayName =
    isPro && seller.pro_store_name
      ? seller.pro_store_name
      : seller.seller_name || 'Seller';
  const initials = getInitials(displayName);
  const avatarBg = AVATAR_COLOURS[colourIndex % AVATAR_COLOURS.length];
  const rating = Number(seller.seller_rating);

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        border: '1px solid #e8e8e4',
        overflow: 'hidden',
      }}
    >
      {/* ── Seller header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          backgroundColor: '#f8f8f6',
          borderBottom: '1px solid #ebebe6',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: avatarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            flexShrink: 0,
            overflow: 'hidden',
            ...(isPro
              ? { outline: '2.5px solid #C9A84C', outlineOffset: 2 }
              : {}),
          }}
        >
          {seller.seller_avatar ? (
            <img
              src={seller.seller_avatar}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            initials
          )}
        </div>

        {/* Name + rating */}
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
            {displayName}
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

        {/* PRO badge */}
        {isPro && (
          <span
            style={{
              backgroundColor: '#C9A84C',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 5,
              fontFamily: 'var(--font-sans)',
              flexShrink: 0,
              letterSpacing: 0.5,
            }}
          >
            PRO
          </span>
        )}
      </div>

      {/* ── Items ── */}
      {seller.items.map((item, idx) => (
        <ItemRow
          key={item.id}
          item={item as ExtendedCartItem}
          isLast={idx === seller.items.length - 1}
          removing={removing}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

/* ══ ITEM ROW ══════════════════════════════════════════ */

function ItemRow({
  item,
  isLast,
  removing,
  onRemove,
}: {
  item: ExtendedCartItem;
  isLast: boolean;
  removing: string | null;
  onRemove: (item: CartItem) => void;
}) {
  const raw = Number(item.offer_price ?? item.price);
  const buyerPrice = raw * 1.075 + 0.99;
  const hasOffer =
    item.offer_price !== null && item.offer_price !== undefined;
  const originalBuyerPrice = hasOffer ? Number(item.price) * 1.075 + 0.99 : 0;
  const isUnavailable = !item.is_available;

  const brandModel = [item.brand, item.model].filter(Boolean).join(' · ');
  const conditionCfg = item.condition_overall
    ? CONDITION_CONFIG[item.condition_overall]
    : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 20,
        borderBottom: isLast ? 'none' : '1px solid #f2f2f0',
        opacity: isUnavailable ? 0.45 : 1,
      }}
    >
      {/* ── IMAGE ── */}
      <Link
        href={`/listings/${item.listing_id}`}
        style={{ flexShrink: 0, textDecoration: 'none' }}
      >
        <div
          style={{
            width: 130,
            height: 160,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: '#f0f0ec',
          }}
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
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
              <svg
                width="40"
                height="40"
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

      {/* ── CENTRE ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Title */}
        <Link
          href={`/listings/${item.listing_id}`}
          style={{ textDecoration: 'none' }}
        >
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
            {item.title}
          </div>
        </Link>

        {/* Brand · Model */}
        {brandModel && (
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: '#999',
              fontWeight: 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {brandModel}
          </div>
        )}

        {/* Condition badge */}
        {conditionCfg && (
          <span
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              backgroundColor: conditionCfg.bg,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 20,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {conditionCfg.label}
          </span>
        )}

        {/* Size */}
        {item.selected_size && (
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: '#666',
            }}
          >
            Size: {item.selected_size}
          </div>
        )}

        {/* Offer badge */}
        {hasOffer && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 4,
              backgroundColor: '#F0EAFA',
              color: '#7C5CBF',
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 20,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Tag size={11} />
            Offer accepted
          </span>
        )}

        {/* Unavailable badge */}
        {isUnavailable && (
          <span
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 20,
              fontFamily: 'var(--font-sans)',
            }}
          >
            No longer available
          </span>
        )}
      </div>

      {/* ── RIGHT ── */}
      <div
        style={{
          flexShrink: 0,
          minWidth: 110,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {/* Buyer price */}
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 22,
            fontWeight: 700,
            color: '#1DC690',
            lineHeight: 1.1,
          }}
        >
          {fp(buyerPrice)}
        </div>

        {/* Original price (if offer) */}
        {hasOffer && (
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: '#bbb',
              textDecoration: 'line-through',
            }}
          >
            {fp(originalBuyerPrice)}
          </div>
        )}

        {/* Shipping */}
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: '#888',
            fontWeight: 500,
          }}
        >
          + {(item.shipping_cost ?? 0) > 0 ? fp(Number(item.shipping_cost)) : 'Free'} shipping
        </div>

        {/* Trash button */}
        <button
          onClick={() => onRemove(item)}
          disabled={removing === item.id}
          className="trash-btn"
          aria-label="Remove item"
          style={{
            background: 'none',
            border: 'none',
            padding: 4,
            marginTop: 4,
            cursor: removing === item.id ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ══ ORDER SUMMARY ═════════════════════════════════════ */

function OrderSummary({
  totalItemCount,
  itemsSubtotal,
  buyerProtectionFee,
  shippingTotal,
  estimatedTotal,
  checkingOut,
  hasUnavailableItems,
  onCheckout,
  protectionOpen,
  setProtectionOpen,
}: {
  totalItemCount: number;
  itemsSubtotal: number;
  buyerProtectionFee: number;
  shippingTotal: number;
  estimatedTotal: number;
  checkingOut: boolean;
  hasUnavailableItems: boolean;
  onCheckout: () => void;
  protectionOpen: boolean;
  setProtectionOpen: (v: boolean) => void;
}) {
  const disabled = checkingOut || hasUnavailableItems;

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e8e8e4',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 16,
          fontWeight: 700,
          color: '#06070A',
          margin: '0 0 16px',
        }}
      >
        Order summary
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SummaryRow
          label={`Items (${totalItemCount})`}
          value={fp(itemsSubtotal)}
        />
        <SummaryRow label="Buyer protection fee" value={fp(buyerProtectionFee)} />
        <SummaryRow label="Shipping (est.)" value={fp(shippingTotal)} />
      </div>

      <div style={{ borderTop: '1px solid #e8e8e4', margin: '16px 0' }} />

      {/* Total */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 600,
            color: '#06070A',
          }}
        >
          Estimated total
        </span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 26,
            fontWeight: 700,
            color: '#06070A',
            lineHeight: 1.1,
          }}
        >
          {fp(estimatedTotal)}
        </span>
      </div>

      {/* Checkout button */}
      <button
        onClick={onCheckout}
        disabled={disabled}
        style={{
          width: '100%',
          marginTop: 16,
          padding: '14px 16px',
          backgroundColor: hasUnavailableItems ? '#ccc' : '#1DC690',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'opacity 0.15s',
          opacity: checkingOut ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {checkingOut ? (
          <>
            <span
              style={{
                width: 16,
                height: 16,
                border: '2px solid #fff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                display: 'inline-block',
              }}
            />
            Processing...
          </>
        ) : (
          'Proceed to checkout'
        )}
      </button>

      {/* Buyer Protection Panel */}
      <BuyerProtectionPanel
        open={protectionOpen}
        setOpen={setProtectionOpen}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: '#666',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          fontWeight: 600,
          color: '#06070A',
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ══ BUYER PROTECTION PANEL ════════════════════════════ */

function BuyerProtectionPanel({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const points: {
  Icon: React.ElementType;
    label: string;
    desc: string;
  }[] = [
    {
      Icon: PackageCheck,
      label: 'Item not arrived?',
      desc: "Full refund guaranteed if your order doesn't turn up.",
    },
    {
      Icon: BadgeCheck,
      label: 'Not as described?',
      desc: "Full refund if the item doesn't match the listing.",
    },
    {
      Icon: Clock,
      label: '3-day inspection window',
      desc: 'Check your item thoroughly before funds are released.',
    },
    {
      Icon: Lock,
      label: 'Escrow protection',
      desc: 'Your money is held securely until you confirm receipt.',
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      {/* Closed state header (button) */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: '#f0fbf6',
          border: '1px solid #b8ecd8',
          borderRadius: open ? '12px 12px 0 0' : 12,
          borderBottom: open ? 'none' : '1px solid #b8ecd8',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={18} color="#1DC690" />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#06070A',
            }}
          >
            Mulligans Buyer Protection
          </span>
        </div>
        {open ? (
          <ChevronUp size={16} color="#1DC690" />
        ) : (
          <ChevronDown size={16} color="#1DC690" />
        )}
      </button>

      {/* Open state — protection points */}
      {open && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #d8f3e8',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {points.map(({ Icon, label, desc }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: '#f0fbf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color="#1DC690" />
              </div>

              {/* Label + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#06070A',
                    margin: 0,
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    color: '#666',
                    margin: '3px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  {desc}
                </p>
              </div>
            </div>
          ))}

          {/* Footer divider + note */}
          <div
            style={{
              borderTop: '1px solid #e8f8f0',
              paddingTop: 10,
              marginTop: 4,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: '#999',
                textAlign: 'center',
                margin: 0,
              }}
            >
              Protected by Mulligans · All transactions secured
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
