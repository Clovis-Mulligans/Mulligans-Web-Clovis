'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getCart, createCartCheckout, type CartResponse } from '@/lib/cart-api';

function formatPrice(n: number | string) { return `£${Number(n).toFixed(2)}`; }

export default function CheckoutPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load cart
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const data = await getCart();
        if (!data.sellers || data.sellers.length === 0) {
          router.push('/cart');
          return;
        }
        setCart(data);
      } catch {
        router.push('/cart');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, router]);

  const handlePay = async () => {
    setProcessing(true);
    setError(null);
    try {
      const session = await createCartCheckout();
      // Redirect to Stripe hosted checkout
      window.location.href = session.url;
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      console.error('Checkout error:', err);
      setProcessing(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1DC690] border-t-transparent" />
      </div>
    );
  }

  if (!cart) return null;
  const summary = cart.summary;
  const allItems = cart.sellers.flatMap((s) => s.items.map((item) => ({ ...item, sellerName: s.seller_name })));

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.5rem', color: '#0D0D0D' }}>Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left — Order summary */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl bg-white p-6" style={{ border: '1px solid #E0E0D8' }}>
            <h2 className="mb-4" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: '#0D0D0D' }}>Order Summary</h2>

            {allItems.map((item) => {
              const displayPrice = item.offer_price ?? item.price;
              const buyerPrice = displayPrice * 1.075 + 0.99;
              return (
                <div key={item.id} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #F4F4F0' }}>
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#F4F4F0' }}>
                    {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full text-xl">🏌️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ fontFamily: 'var(--font-sans)', color: '#0D0D0D' }}>{item.title}</p>
                    <p className="text-xs" style={{ color: '#6B6B6B' }}>{item.sellerName}{item.selected_size ? ` · Size ${item.selected_size}` : ''}{item.quantity > 1 ? ` · Qty ${item.quantity}` : ''}</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9rem', color: '#1DC690' }}>{formatPrice(buyerPrice * item.quantity)}</span>
                </div>
              );
            })}

            {/* Cost breakdown */}
            <div className="mt-4 space-y-2 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
              <div className="flex justify-between"><span style={{ color: '#6B6B6B' }}>Items</span><span style={{ color: '#0D0D0D', fontWeight: 600 }}>{formatPrice(summary.items_total)}</span></div>
              <div className="flex justify-between"><span className="flex items-center gap-1" style={{ color: '#6B6B6B' }}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#278AB0" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>Insured Shipping</span><span style={{ color: '#0D0D0D', fontWeight: 600 }}>{formatPrice(summary.insured_shipping_total)}</span></div>
              <div className="flex justify-between"><span className="flex items-center gap-1" style={{ color: '#1DC690' }}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>Buyer Protection</span><span style={{ color: '#1DC690', fontWeight: 600 }}>{formatPrice(summary.buyer_protection_fee)}</span></div>
              <div className="my-3" style={{ borderBottom: '1px solid #E0E0D8' }} />
              <div className="flex justify-between items-baseline">
                <span style={{ fontWeight: 700, color: '#0D0D0D' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#1DC690' }}>{formatPrice(summary.grand_total)}</span>
              </div>
            </div>

            {/* Buyer protection note */}
            <div className="mt-4 rounded-[10px] p-3" style={{ backgroundColor: 'rgba(29,198,144,0.06)', border: '1px solid rgba(29,198,144,0.2)' }}>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-sans)', color: '#0D0D0D' }}>Protected by Mulligans Buyer Protection</span>
              </div>
              <p className="mt-1 text-xs" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>Full refund if item doesn&apos;t arrive or isn&apos;t as described.</p>
            </div>

            <div className="mt-4">
              <a href="/cart" className="text-sm transition-colors hover:underline" style={{ fontFamily: 'var(--font-sans)', color: '#1DC690' }}>← Back to cart</a>
            </div>
          </div>
        </div>

        {/* Right — Payment */}
        <div className="lg:w-[440px] flex-shrink-0">
          <div className="lg:sticky lg:top-[80px] rounded-xl bg-white p-6" style={{ border: '1px solid #E0E0D8' }}>
            <h2 className="mb-4" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: '#0D0D0D' }}>Payment</h2>

            <p className="mb-4 text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>
              You&apos;ll be redirected to Stripe&apos;s secure checkout to complete your payment. Delivery address will be collected during payment.
            </p>

            {/* Delivery note */}
            <div className="rounded-[10px] p-3 mb-4" style={{ backgroundColor: '#FAFAF8', border: '1px solid #E0E0D8' }}>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
                <span className="text-sm" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#0D0D0D' }}>UK Delivery Only</span>
              </div>
              <p className="mt-1 text-xs" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B' }}>Estimated delivery: 3-7 business days</p>
            </div>

            {error && (
              <div className="rounded-lg p-3 mb-4 text-sm" style={{ backgroundColor: 'rgba(229,62,62,0.08)', color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>{error}</div>
            )}

            <button onClick={handlePay} disabled={processing} className="w-full rounded-xl text-white font-bold transition-colors hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', height: '52px', backgroundColor: '#1DC690' }}>
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </span>
              ) : `Pay ${formatPrice(summary.grand_total)}`}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: '#ADADAD' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontFamily: 'var(--font-sans)' }}>Payments secured by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
