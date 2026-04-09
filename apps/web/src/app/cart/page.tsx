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

const AVATAR_COLOURS = ['#1DC690', '#278AB0', '#1C4670', '#7C5CBF'];

function fp(n: number) {
  return `£${n.toFixed(2)}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
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
    <div style={{ backgroundColor: '#EAEAE0' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .trash-btn { background: none; border: none; cursor: pointer; padding: 0; display: inline-flex; color: #c0c0c0; }
        .trash-btn:hover { color: #e24b4a; }
        .checkout-btn-green { width: 100%; padding: 14px 0; border: none; border-radius: 10px; background: #1DC690; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
        .checkout-btn-green:hover { opacity: 0.9; }
        .checkout-btn-green:disabled { opacity: 0.6; }
        .browse-btn { display: inline-block; padding: 12px 28px; background: #1DC690; color: #fff; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>

        {loading ? (
          <CardSkeletonGrid count={4} />
        ) : isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <p style={{ marginTop: 20, fontSize: 20, fontWeight: 600, color: '#06070A' }}>Your bag is empty</p>
            <p style={{ marginTop: 6, fontSize: 14, color: '#888' }}>Browse listings to find your next club</p>
            <Link href="/search" className="browse-btn" style={{ marginTop: 24 }}>Browse listings</Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#06070A', marginBottom: 24 }}>
              Bag ({totalItemCount} item{totalItemCount !== 1 ? 's' : ''})
            </h1>

            {/* Two column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'start' }}>

              {/* LEFT — Seller cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

              {/* RIGHT — Order summary */}
              <div style={{ position: 'sticky', top: 20 }}>
                <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #d4d4cc', padding: '22px 20px' }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#06070A', marginBottom: 18 }}>Order summary</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#555' }}>
                      <span>Items ({totalItemCount})</span>
                      <span style={{ color: '#06070A', fontWeight: 500 }}>{fp(itemsSubtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#555' }}>
                      <span>Buyer protection fee</span>
                      <span style={{ color: '#06070A', fontWeight: 500 }}>{fp(buyerProtectionFee)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#555' }}>
                      <span>Shipping (est.)</span>
                      <span style={{ color: '#06070A', fontWeight: 500 }}>{fp(shippingTotal)}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #e8e8e4', margin: '16px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#06070A' }}>Total</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#06070A' }}>{fp(estimatedTotal)}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="checkout-btn-green"
                    style={{ marginTop: 18 }}
                  >
                    {checkingOut ? 'Processing...' : 'Proceed to checkout'}
                  </button>

                  <p style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
                    ✦ All purchases covered by Mulligans Buyer Protection
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
  const displayName = isPro && seller.pro_store_name ? seller.pro_store_name : (seller.seller_name || 'Seller');

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #d4d4cc', overflow: 'hidden' }}>

      {/* Seller header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '0.5px solid #ebebeb', background: '#fafaf8' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', backgroundColor: avatarBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0,
          ...(isPro ? { outline: '2px solid #C9A84C', outlineOffset: 2 } : {})
        }}>
          {seller.seller_avatar
            ? <img src={seller.seller_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : getInitials(displayName)
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#06070A', margin: 0 }}>{displayName}</p>
        </div>
        {isPro && (
          <span style={{ background: '#C9A84C', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>
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

        return (
          <div
            key={item.id}
            style={{
              display: 'flex', gap: 14, padding: '16px 16px',
              borderBottom: idx < seller.items.length - 1 ? '0.5px solid #f0f0ee' : 'none',
            }}
          >
            {/* Image — portrait rectangle like Depop */}
            <Link href={`/listings/${item.listing_id}`} style={{ flexShrink: 0 }}>
              <div style={{ width: 110, height: 130, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f0f0ec' }}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  </div>
                )}
              </div>
            </Link>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link href={`/listings/${item.listing_id}`} style={{ textDecoration: 'none' }}>
                <p style={{ fontSize: 16, fontWeight: 500, color: '#06070A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </p>
              </Link>

              {item.selected_size && (
                <p style={{ fontSize: 14, color: '#aaa', margin: 0 }}>{item.selected_size}</p>
              )}

              {/* Price row — bold and prominent */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#06070A' }}>
                  {fp(buyerPrice)}
                </span>
                {hasOffer && (
                  <>
                    <span style={{ fontSize: 13, color: '#ccc', textDecoration: 'line-through' }}>
                      {fp(Number(item.price) * 1.075 + 0.99)}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 500, background: '#F0EAFA', color: '#7C5CBF', padding: '2px 6px', borderRadius: 4 }}>
                      Offer price
                    </span>
                  </>
                )}
              </div>

              {/* Shipping — shown per item so buyer sees true cost */}
              <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
                + {shippingCost > 0 ? fp(shippingCost) : 'Free'} shipping
              </p>

              {/* Trash — below details, small */}
              <button
                className="trash-btn"
                onClick={() => onRemove(item)}
                disabled={removing === item.id}
                aria-label="Remove item"
                style={{ marginTop: 6, opacity: removing === item.id ? 0.4 : 1 }}
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