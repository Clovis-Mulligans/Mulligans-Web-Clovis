'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShieldCheck, Star, Tag, ChevronDown, ChevronUp } from 'lucide-react';
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
import { CONDITION_COLOURS } from '@/lib/constants';

const AVATAR_COLOURS = ['#1DC690', '#278AB0', '#1C4670', '#7C5CBF'];

function fp(n: number) {
  return `£${n.toFixed(2)}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getConditionLabel(score: number | null | undefined): string {
  if (!score) return '';
  const labels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };
  return labels[score] ?? '';
}

/* ── Expandable buyer protection panel ── */
function BuyerProtectionPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #e0f5ee', borderRadius: 10, overflow: 'hidden', marginTop: 18 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', background: '#f0fbf6', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={16} color="#1DC690" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#06070A' }}>
            Mulligans Buyer Protection
          </span>
        </div>
        {open
          ? <ChevronUp size={16} color="#888" />
          : <ChevronDown size={16} color="#888" />
        }
      </button>
      {open && (
        <div style={{ padding: '12px 14px', background: '#fff', borderTop: '1px solid #e0f5ee' }}>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: '0 0 8px' }}>
            Every purchase on Mulligans is covered by our Buyer Protection policy:
          </p>
          <ul style={{ fontSize: 13, color: '#555', lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>Full refund if your item doesn't arrive</li>
            <li>Full refund if the item isn't as described</li>
            <li>3-day inspection window after delivery</li>
            <li>Funds held in escrow until you confirm receipt</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

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

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 0' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #1DC690', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  const allItems = cart?.sellers.flatMap((s) => s.items) ?? [];
  const totalItemCount = allItems.reduce((sum, i) => sum + i.quantity, 0);
  const isEmpty = !cart || cart.sellers.length === 0;
  const hasUnavailableItems = allItems.some((i) => i.is_available === false);
  const availableItems = allItems.filter((i) => i.is_available !== false);

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

  const OrderSummary = (
    <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #d4d4cc', padding: '24px 22px' }}>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#06070A', margin: '0 0 20px' }}>Order summary</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#555' }}>
          <span>Items ({totalItemCount})</span>
          <span style={{ color: '#06070A', fontWeight: 600 }}>{fp(itemsSubtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#555' }}>
          <span>Buyer protection fee</span>
          <span style={{ color: '#06070A', fontWeight: 600 }}>{fp(buyerProtectionFee)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#555' }}>
          <span>Shipping (est.)</span>
          <span style={{ color: '#06070A', fontWeight: 600 }}>{fp(shippingTotal)}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e8e8e4', margin: '18px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#06070A' }}>Total</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: '#06070A' }}>{fp(estimatedTotal)}</span>
      </div>

      {hasUnavailableItems && (
        <p style={{ marginTop: 14, fontSize: 13, color: '#c0392b', background: '#fdf0ee', padding: '10px 12px', borderRadius: 8, lineHeight: 1.6 }}>
          Some items are no longer available. Remove them before checking out.
        </p>
      )}

      <button
        onClick={handleCheckout}
        disabled={checkingOut || hasUnavailableItems}
        style={{
          marginTop: 18, width: '100%', padding: '15px 0', border: 'none',
          borderRadius: 10, background: hasUnavailableItems ? '#ccc' : '#1DC690',
          color: '#fff', fontSize: 16, fontWeight: 700,
          cursor: hasUnavailableItems ? 'not-allowed' : 'pointer',
          opacity: checkingOut ? 0.7 : 1, transition: 'opacity 0.15s',
        }}
      >
        {checkingOut ? 'Processing...' : 'Proceed to checkout'}
      </button>

      {/* Expandable buyer protection */}
      <BuyerProtectionPanel />
    </div>
  );

  return (
    <div style={{ backgroundColor: '#EAEAE0' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .trash-btn { background: none; border: none; cursor: pointer; padding: 4px; display: inline-flex; color: #c8c8c8; border-radius: 4px; transition: color 0.15s; }
        .trash-btn:hover { color: #e24b4a; }
        .item-img-link { display: block; transition: opacity 0.15s; }
        .item-img-link:hover { opacity: 0.9; }
        .item-title-link { text-decoration: none; }
        .item-title-link:hover p { text-decoration: underline; text-decoration-color: #ccc; }
        @media (max-width: 767px) {
          .cart-grid { display: flex !important; flex-direction: column !important; }
          .cart-summary-col { order: -1; position: static !important; }
          .cart-items-col { order: 1; }
        }
      `}</style>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '36px 20px 48px' }}>

        {loading ? (
          <CardSkeletonGrid count={4} />
        ) : isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.3">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
              <path d="M3 6h18"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <p style={{ marginTop: 20, fontSize: 22, fontWeight: 700, color: '#06070A' }}>Your bag is empty</p>
            <p style={{ marginTop: 8, fontSize: 15, color: '#666' }}>Browse listings to find your next club</p>
            <Link href="/search" style={{ marginTop: 24, display: 'inline-block', padding: '13px 32px', background: '#1DC690', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Browse listings
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#06070A', textAlign: 'center', marginBottom: 32 }}>
              Bag ({totalItemCount} item{totalItemCount !== 1 ? 's' : ''})
            </h1>

            <div
              className="cart-grid"
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start' }}
            >
              <div className="cart-items-col" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {cart!.sellers.map((seller, idx) => (
                  <SellerCard
                    key={seller.seller_id}
                    seller={seller}
                    colourIndex={idx}
                    removing={removing}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>

              <div className="cart-summary-col" style={{ position: 'sticky', top: 24 }}>
                {OrderSummary}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Seller Card ─────────────────────────────────────── */

function SellerCard({
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
  const isPro = seller.is_pro_store ?? seller.seller_is_verified_seller_seller;
  const displayName = isPro && seller.pro_store_name
    ? seller.pro_store_name
    : (seller.seller_name || 'Seller');
  const rating = seller.seller_rating ? Number(seller.seller_rating) : null;

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #d4d4cc', overflow: 'hidden' }}>

      {/* Seller header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 20px', borderBottom: '1px solid #efefed',
        background: '#f8f8f6',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', backgroundColor: avatarBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
          ...(isPro ? { outline: '2.5px solid #C9A84C', outlineOffset: 2 } : {}),
        }}>
          {seller.seller_avatar
            ? <img src={seller.seller_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : getInitials(displayName)
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#06070A', margin: 0, lineHeight: 1.3 }}>
            {displayName}
          </p>
          {rating !== null && rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Star size={13} fill="#F5A623" color="#F5A623" />
              <span style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {isPro && (
          <span style={{
            background: '#C9A84C', color: '#fff', fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 5, flexShrink: 0, letterSpacing: '0.3px',
          }}>
            PRO
          </span>
        )}
      </div>

      {/* Items */}
      {seller.items.map((item, idx) => {
        const raw = Number(item.offer_price ?? item.price);
        const buyerPrice = raw * 1.075 + 0.99;
        const hasOffer = item.offer_price !== null && item.offer_price !== undefined;
        const shippingCost = item.shipping_cost ? Number(item.shipping_cost) : (seller.shipping_cost || 0);
        const isUnavailable = item.is_available === false;
        const conditionScore = item.condition_overall ?? null;
        const conditionLabel = getConditionLabel(conditionScore);
        const conditionStyle = conditionScore
          ? (CONDITION_COLOURS[conditionScore as keyof typeof CONDITION_COLOURS] ?? null)
          : null;

        return (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '20px 20px',
              borderBottom: idx < seller.items.length - 1 ? '1px solid #f2f2f0' : 'none',
              opacity: isUnavailable ? 0.5 : 1,
            }}
          >
            {/* Image */}
            <Link href={`/listings/${item.listing_id}`} className="item-img-link" style={{ flexShrink: 0 }}>
              <div style={{ width: 130, height: 155, borderRadius: 10, overflow: 'hidden', backgroundColor: '#efefeb' }}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="m21 15-5-5L5 21"/>
                    </svg>
                  </div>
                )}
              </div>
            </Link>

            {/* Centre — title, meta, condition, offer badge */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Link href={`/listings/${item.listing_id}`} className="item-title-link">
                <p style={{ fontSize: 15, fontWeight: 600, color: '#06070A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                  {item.title}
                </p>
              </Link>

              {/* Condition tag — matches mobile app style */}
              {conditionLabel && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  fontSize: 12, fontWeight: 600,
                  padding: '3px 9px', borderRadius: 20,
                  background: conditionStyle?.bg ?? '#f0f0ec',
                  color: conditionStyle?.text ?? '#555',
                  alignSelf: 'flex-start',
                }}>
                  {conditionLabel}
                </span>
              )}

              {/* Size if present */}
              {item.selected_size && (
                <p style={{ fontSize: 14, color: '#666', margin: 0, fontWeight: 500 }}>
                  Size: {item.selected_size}
                </p>
              )}

              {/* Offer badge — purple with tag icon, matching mobile */}
              {hasOffer && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 12, fontWeight: 600,
                    background: '#F0EAFA', color: '#7C5CBF',
                    padding: '3px 9px', borderRadius: 20,
                  }}>
                    <Tag size={11} />
                    Offer accepted
                  </span>
                </div>
              )}

              {isUnavailable && (
                <span style={{ fontSize: 13, fontWeight: 600, color: '#c0392b', background: '#fdf0ee', padding: '3px 10px', borderRadius: 20, display: 'inline-block', alignSelf: 'flex-start' }}>
                  No longer available
                </span>
              )}
            </div>

            {/* Right — price, shipping, trash */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', flexShrink: 0, minWidth: 120, gap: 5 }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#06070A', margin: 0, lineHeight: 1.2 }}>
                {fp(buyerPrice)}
              </p>
              {hasOffer && (
                <span style={{ fontSize: 13, color: '#bbb', textDecoration: 'line-through' }}>
                  {fp(Number(item.price) * 1.075 + 0.99)}
                </span>
              )}
              <p style={{ fontSize: 14, color: '#666', margin: 0, textAlign: 'right', fontWeight: 500 }}>
                + {shippingCost > 0 ? fp(shippingCost) : 'Free'} shipping
              </p>
              <button
                className="trash-btn"
                onClick={() => onRemove(item)}
                disabled={removing === item.id}
                aria-label="Remove item"
                style={{ opacity: removing === item.id ? 0.4 : 1, marginTop: 4 }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}