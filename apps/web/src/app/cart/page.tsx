'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getCart, removeFromCart, clearCart, type CartResponse, type CartSeller, type CartItem } from '@/lib/cart-api';

function formatPrice(n: number) { return `£${n.toFixed(2)}`; }

export default function CartPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

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
      const data = await getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleRemoveItem = async (item: CartItem) => {
    setRemoving(item.id);
    // Optimistic removal
    setCart((prev) => {
      if (!prev) return prev;
      const sellers = prev.sellers.map((s) => ({
        ...s,
        items: s.items.filter((i) => i.id !== item.id),
      })).filter((s) => s.items.length > 0);
      return { ...prev, sellers };
    });
    try {
      await removeFromCart(item.listing_id, item.selected_size);
      await fetchCart(); // Refresh totals
    } catch {
      await fetchCart(); // Revert on error
    } finally {
      setRemoving(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Remove all items from your cart?')) return;
    try {
      await clearCart();
      setCart(null);
    } catch {
      await fetchCart();
    }
  };

  const handleCheckout = async () => {
    router.push('/checkout');
  };

  if (isLoading || (!isAuthenticated && !isLoading)) {
    return <div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1DC690] border-t-transparent" /></div>;
  }

  const isEmpty = !cart || cart.sellers.length === 0;
  const summary = cart?.summary;
  const hasWarnings = (cart?.warnings?.length || 0) > 0;
  const totalItems = summary?.item_count || 0;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.5rem', color: '#0D0D0D' }}>
          Cart {totalItems > 0 && `(${totalItems})`}
        </h1>
        {!isEmpty && (
          <button onClick={handleClearAll} className="text-sm font-semibold transition-colors hover:underline" style={{ fontFamily: 'var(--font-sans)', color: '#E53E3E' }}>
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-24 rounded-xl bg-white animate-pulse" style={{ border: '1px solid #E0E0D8' }} />)}</div>
      ) : isEmpty ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <p className="mt-4 font-bold" style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem', color: '#0D0D0D' }}>Your cart is empty</p>
          <p className="mt-1 text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>Browse listings to find your next piece of kit</p>
          <Link href="/search" className="mt-6 inline-flex items-center rounded-[10px] px-6 py-3 text-sm font-bold text-white transition-colors hover:opacity-90" style={{ fontFamily: 'var(--font-sans)', backgroundColor: '#1DC690' }}>
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Cart items */}
          <div className="flex-1 min-w-0">
            {/* In demand banner */}
            {hasWarnings && (
              <div className="flex items-center gap-2 rounded-xl mb-4 p-3" style={{ backgroundColor: '#FFF8E7', border: '1px solid #F59E0B' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                <span className="text-sm" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#92400E' }}>Some items are in other shoppers&apos; carts — buy soon!</span>
              </div>
            )}

            {/* Seller groups */}
            {cart!.sellers.map((seller) => (
              <div key={seller.seller_id} className="rounded-xl bg-white mb-4 overflow-hidden" style={{ border: '1px solid #E0E0D8' }}>
                {/* Seller header */}
                <Link href={`/profile/${seller.seller_id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-[#FAFAF8]" style={{ borderBottom: '1px solid #E0E0D8' }}>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: seller.seller_avatar ? undefined : '#1DC690' }}>
                    {seller.seller_avatar ? (
                      <img src={seller.seller_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-white font-bold text-sm">{(seller.seller_name || '?')[0].toUpperCase()}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold truncate" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#0D0D0D' }}>{seller.seller_name || 'Seller'}</span>
                      {seller.seller_is_verified_seller_seller && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1DC690" stroke="#1DC690" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                    </div>
                    {seller.seller_rating > 0 && <span className="text-xs" style={{ color: '#6B6B6B' }}>⭐ {Number(seller.seller_rating).toFixed(1)}</span>}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>

                {/* Items */}
                {seller.items.map((item) => {
                  const displayPrice = item.offer_price ?? item.price;
                  const buyerPrice = displayPrice * 1.075 + 0.99;
                  const lineTotal = buyerPrice * item.quantity;
                  const hasOffer = item.offer_price !== null && item.offer_price !== undefined;
                  const originalBuyerPrice = hasOffer ? item.price * 1.075 + 0.99 : null;

                  return (
                    <div key={item.id} className="flex items-start gap-3 p-4" style={{ borderBottom: '1px solid #F4F4F0' }}>
                      <Link href={`/listings/${item.listing_id}`} className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-lg overflow-hidden" style={{ backgroundColor: '#F4F4F0' }}>
                          {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full text-2xl">🏌️</div>}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/listings/${item.listing_id}`}>
                          <p className="font-bold truncate" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#0D0D0D' }}>{item.title}</p>
                        </Link>
                        {item.selected_size && <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>Size: {item.selected_size}</p>}
                        {item.in_other_carts && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="0"><path d="M12 2c-1 0-2 .5-2.5 1.5L3 14c-.5 1-.2 2 .5 2.5l7.5 5c.6.4 1.4.4 2 0l7.5-5c.7-.5 1-1.5.5-2.5L14.5 3.5C14 2.5 13 2 12 2z"/></svg>
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 600, color: '#F59E0B' }}>In demand</span>
                          </div>
                        )}
                        <div className="mt-1.5">
                          {hasOffer && originalBuyerPrice && (
                            <span className="line-through text-xs mr-2" style={{ color: '#ADADAD' }}>{formatPrice(originalBuyerPrice)}</span>
                          )}
                          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.95rem', color: '#1DC690' }}>
                            {formatPrice(item.quantity > 1 ? lineTotal : buyerPrice)}
                          </span>
                          {item.quantity > 1 && <span className="text-xs ml-1" style={{ color: '#6B6B6B' }}>({formatPrice(buyerPrice)} each)</span>}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveItem(item)} disabled={removing === item.id} className="flex-shrink-0 p-2 rounded-lg transition-colors hover:bg-[#FEE2E2]" aria-label="Remove item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Right — Order summary (sticky) */}
          <div className="lg:w-[380px] flex-shrink-0">
            <div className="lg:sticky lg:top-[80px] rounded-xl bg-white p-5" style={{ border: '1px solid #E0E0D8' }}>
              <h2 className="mb-4" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: '#0D0D0D' }}>Order Summary</h2>

              <div className="space-y-2 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
                <div className="flex justify-between">
                  <span style={{ color: '#6B6B6B' }}>Items ({totalItems})</span>
                  <span style={{ color: '#0D0D0D', fontWeight: 600 }}>{formatPrice(summary!.items_total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5" style={{ color: '#6B6B6B' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#278AB0" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                    Insured Shipping
                  </span>
                  <span style={{ color: '#0D0D0D', fontWeight: 600 }}>{formatPrice(summary!.insured_shipping_total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5" style={{ color: '#1DC690' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                    Buyer Protection
                  </span>
                  <span style={{ color: '#1DC690', fontWeight: 600 }}>{formatPrice(summary!.buyer_protection_fee)}</span>
                </div>
              </div>

              <div className="my-4" style={{ borderBottom: '1px solid #E0E0D8' }} />

              <div className="flex justify-between items-baseline">
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', color: '#0D0D0D' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '1.4rem', color: '#1DC690' }}>{formatPrice(summary!.grand_total)}</span>
              </div>

              <button onClick={handleCheckout} className="mt-5 w-full rounded-xl text-white font-bold transition-colors hover:opacity-90" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', height: '52px', backgroundColor: '#1DC690' }}>
                Proceed to Checkout
              </button>

              <p className="mt-3 text-center text-xs" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>
                🛡 Protected by Mulligans Buyer Protection
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
