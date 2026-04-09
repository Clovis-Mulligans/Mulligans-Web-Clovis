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
      await fetchCart();
    } catch {
      await fetchCart();
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
  const multiSeller = (cart?.sellers?.length || 0) > 1;

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8 sm:px-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Page title */}
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '1.8rem', color: '#0D0D0D' }}>
          Bag {totalItems > 0 && `(${totalItems})`}
        </h1>
        {!isEmpty && (
          <button onClick={handleClearAll} className="text-sm font-semibold transition-colors hover:underline" style={{ fontFamily: 'var(--font-sans)', color: '#E53E3E' }}>
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-5">{[1, 2].map((i) => <div key={i} className="h-48 rounded-2xl bg-white animate-pulse" style={{ border: '1px solid #E0E0D8' }} />)}</div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <p className="mt-4 font-bold" style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem', color: '#0D0D0D' }}>Your bag is empty</p>
          <p className="mt-1 text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>Browse listings to find your next piece of kit</p>
          <Link href="/search" className="mt-6 inline-flex items-center rounded-[10px] px-6 py-3 text-sm font-bold text-white transition-colors hover:opacity-90" style={{ fontFamily: 'var(--font-sans)', backgroundColor: '#1DC690' }}>
            Browse Listings
          </Link>
        </div>
      ) : (
        <>
          {/* In demand banner */}
          {hasWarnings && (
            <div className="flex items-center gap-2 rounded-2xl mb-5 p-3" style={{ backgroundColor: '#FFF8E7', border: '1px solid #F59E0B' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              <span className="text-sm" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#92400E' }}>Some items are in other shoppers&apos; bags — buy soon!</span>
            </div>
          )}

          {/* Seller cards */}
          {cart!.sellers.map((seller) => {
            const sellerItemsTotal = seller.items.reduce((sum, item) => {
              const dp = item.offer_price ?? item.price;
              return sum + (dp * 1.075 + 0.99) * item.quantity;
            }, 0);
            const sellerShipping = seller.shipping_cost || 0;
            const sellerSubtotal = sellerItemsTotal + sellerShipping;
            const sellerItemCount = seller.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div key={seller.seller_id} className="rounded-2xl bg-white overflow-hidden mb-5" style={{ border: '1px solid #E0E0D8', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>

                {/* ─── Seller header ──────────────────────── */}
                <Link href={`/profile/${seller.seller_id}`} className="flex items-center gap-3 transition-colors hover:bg-[#FAFAF8]" style={{ padding: '16px 20px', borderBottom: '1px solid #E0E0D8' }}>
                  <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: seller.seller_avatar ? undefined : '#1DC690' }}>
                    {seller.seller_avatar ? (
                      <img src={seller.seller_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-white" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9rem' }}>{(seller.seller_name || '?')[0].toUpperCase()}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 ml-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', color: '#0D0D0D' }}>{seller.seller_name || 'Seller'}</span>
                      {seller.seller_is_verified_seller_seller && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1DC690" stroke="#1DC690" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                    </div>
                    {Number(seller.seller_rating) > 0 && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#6B6B6B', marginTop: '2px' }}>⭐ {Number(seller.seller_rating).toFixed(1)}</p>}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>

                {/* ─── Item rows ──────────────────────────── */}
                {seller.items.map((item) => {
                  const displayPrice = item.offer_price ?? item.price;
                  const buyerPrice = displayPrice * 1.075 + 0.99;
                  const lineTotal = buyerPrice * item.quantity;
                  const hasOffer = item.offer_price !== null && item.offer_price !== undefined;
                  const originalBuyerPrice = hasOffer ? item.price * 1.075 + 0.99 : null;

                  return (
                    <div key={item.id} className="flex items-start gap-4" style={{ padding: '16px 20px', borderBottom: '1px solid #E0E0D8' }}>
                      {/* Image */}
                      <Link href={`/listings/${item.listing_id}`} className="flex-shrink-0">
                        <div className="overflow-hidden w-[100px] h-[100px] sm:w-[130px] sm:h-[130px]" style={{ borderRadius: '8px', backgroundColor: '#F4F4F0' }}>
                          {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full text-3xl">🏌️</div>}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/listings/${item.listing_id}`} className="hover:text-[#1DC690] transition-colors">
                          <p className="line-clamp-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', color: '#0D0D0D', lineHeight: 1.3 }}>{item.title}</p>
                        </Link>

                        {/* Price */}
                        <div className="mt-1">
                          {hasOffer && originalBuyerPrice && (
                            <span className="line-through mr-2" style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '0.85rem', color: '#ADADAD' }}>{formatPrice(originalBuyerPrice)}</span>
                          )}
                          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.05rem', color: '#0D0D0D' }}>
                            {formatPrice(item.quantity > 1 ? lineTotal : buyerPrice)}
                          </span>
                          {item.quantity > 1 && <span className="ml-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#6B6B6B' }}>({formatPrice(buyerPrice)} each)</span>}
                        </div>

                        {item.selected_size && <p className="mt-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#6B6B6B' }}>Size: {item.selected_size}</p>}

                        {item.in_other_carts && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#6B6B6B' }}>In demand</span>
                          </div>
                        )}

                        {/* Delete */}
                        <button onClick={() => handleRemoveItem(item)} disabled={removing === item.id} className="mt-2 transition-colors" aria-label="Remove item">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={removing === item.id ? '#ADADAD' : '#6B6B6B'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-[#E53E3E]"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* ─── Bottom section: breakdown right-aligned ── */}
                <div className="flex flex-col sm:flex-row" style={{ borderTop: '1px solid #E0E0D8' }}>
                  {/* Left spacer — hidden on mobile */}
                  <div className="hidden sm:block sm:flex-1" />

                  {/* Right — breakdown + button */}
                  <div className="w-full sm:w-[300px] flex-shrink-0" style={{ padding: '16px 20px' }}>
                    <div className="space-y-1.5" style={{ fontFamily: 'var(--font-sans)' }}>
                      <div className="flex justify-between">
                        <span style={{ fontWeight: 500, fontSize: '0.88rem', color: '#6B6B6B' }}>Item{sellerItemCount > 1 ? 's' : ''}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0D0D0D' }}>{formatPrice(sellerItemsTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ fontWeight: 500, fontSize: '0.88rem', color: '#6B6B6B' }}>Shipping</span>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0D0D0D' }}>{sellerShipping > 0 ? formatPrice(sellerShipping) : 'Free'}</span>
                      </div>

                      <div className="my-2" style={{ borderBottom: '1px solid #E0E0D8' }} />

                      <div className="flex justify-between items-baseline">
                        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.95rem', color: '#0D0D0D' }}>Total</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '1.1rem', color: '#0D0D0D' }}>{formatPrice(sellerSubtotal)}</span>
                      </div>
                    </div>

                    <button onClick={handleCheckout} className="mt-3 w-full text-white font-bold transition-colors hover:opacity-90" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.95rem', height: '48px', backgroundColor: '#1DC690', borderRadius: '10px' }}>
                      Checkout {sellerItemCount} item{sellerItemCount !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Grand total — only if multiple sellers */}
          {multiSeller && summary && (
            <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #E0E0D8', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', padding: '20px 24px' }}>
              <div className="space-y-2" style={{ fontFamily: 'var(--font-sans)' }}>
                <div className="flex justify-between">
                  <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#6B6B6B' }}>Items ({totalItems})</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0D0D0D' }}>{formatPrice(summary.items_total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5" style={{ fontWeight: 500, fontSize: '0.9rem', color: '#6B6B6B' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#278AB0" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                    Insured Shipping
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0D0D0D' }}>{formatPrice(summary.insured_shipping_total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5" style={{ fontWeight: 500, fontSize: '0.9rem', color: '#1DC690' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                    Buyer Protection
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1DC690' }}>{formatPrice(summary.buyer_protection_fee)}</span>
                </div>
              </div>

              <div className="my-4" style={{ borderBottom: '1px solid #E0E0D8' }} />

              <div className="flex justify-between items-baseline">
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '1rem', color: '#0D0D0D' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '1.4rem', color: '#0D0D0D' }}>{formatPrice(summary.grand_total)}</span>
              </div>

              <p className="mt-3 text-center" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#6B6B6B' }}>
                <span className="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                  Protected by Mulligans Buyer Protection
                </span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
