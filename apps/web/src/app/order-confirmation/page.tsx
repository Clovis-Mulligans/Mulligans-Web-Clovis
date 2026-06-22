'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getMyRecentPurchases, getCart } from '@/lib/cart-api';

function formatPrice(n: number) { return `£${n.toFixed(2)}`; }

export default function OrderConfirmationPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remainingSellerCount, setRemainingSellerCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    (async () => {
      try {
        const [purchaseData, cartData] = await Promise.all([
          getMyRecentPurchases(),
          getCart().catch(() => null),
        ]);
        const recent = (purchaseData.orders || []).slice(0, 5);
        setOrders(recent);
        if (cartData?.sellers?.length) {
          setRemainingSellerCount(cartData.sellers.length);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, isLoading]);

  const firstName = user?.display_name?.split(' ')[0] || 'there';

  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero confirmation */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#1DC690' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '1.6rem', color: '#0D0D0D' }}>Order Confirmed!</h1>
        <p className="mt-2" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: '#6B6B6B' }}>
          Thank you {firstName}. We&apos;ve sent a confirmation to {user?.email || 'your email'}.
        </p>
      </div>

      {/* What happens next — escrow explainer */}
      <div className="rounded-xl bg-white p-6 mb-6" style={{ border: '1px solid #E0E0D8' }}>
        <h2 className="mb-4" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: '#0D0D0D' }}>What Happens Next</h2>
        <div className="space-y-4">
          {[
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
              title: 'Payment Held Safely',
              desc: 'Your payment is held in escrow until you confirm receipt',
              color: '#1DC690',
            },
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#278AB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>,
              title: 'Seller Ships Your Item',
              desc: 'The seller has 5 days to ship. You\'ll get tracking info by email',
              color: '#278AB0',
            },
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C4670" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
              title: 'Confirm & Release',
              desc: 'Once happy, confirm delivery. Funds release to the seller',
              color: '#1C4670',
            },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: `${step.color}10` }}>
                {step.icon}
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9rem', color: '#0D0D0D' }}>{step.title}</p>
                <p className="mt-0.5" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#6B6B6B' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      {loading ? (
        <div className="rounded-xl bg-white p-6 animate-pulse" style={{ border: '1px solid #E0E0D8', height: '200px' }} />
      ) : orders.length > 0 && (
        <div className="rounded-xl bg-white p-6 mb-6" style={{ border: '1px solid #E0E0D8' }}>
          <h2 className="mb-4" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: '#0D0D0D' }}>Your Orders</h2>
          {orders.map((order: any) => (
            <div key={order.id} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #F4F4F0' }}>
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#F4F4F0' }}>
                {order.listing_image ? <img src={order.listing_image} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full text-xl">🏌️</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold" style={{ fontFamily: 'var(--font-sans)', color: '#0D0D0D' }}>{order.listing_title}</p>
                <p className="text-xs" style={{ color: '#6B6B6B' }}>{order.seller_name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9rem', color: '#1DC690' }}>{formatPrice(order.amount)}</p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: '#EFF6FF', color: '#278AB0' }}>To Ship</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buyer protection note */}
      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(29,198,144,0.06)', border: '1px solid rgba(29,198,144,0.2)' }}>
        <p className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6B6B6B', lineHeight: 1.6 }}>
          Your purchase is protected for 5 days after delivery. If the item doesn&apos;t arrive or isn&apos;t as described, you&apos;re covered.{' '}
          <a href="/help" className="font-semibold hover:underline" style={{ color: '#1DC690' }}>Learn more about Buyer Protection</a>
        </p>
      </div>

      {/* Return-to-bag banner (other sellers still in cart) */}
      {remainingSellerCount > 0 && (
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(39,138,176,0.06)', border: '1px solid rgba(39,138,176,0.2)' }}>
          <p className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#1C4670', lineHeight: 1.6 }}>
            You still have items from {remainingSellerCount} other seller{remainingSellerCount !== 1 ? 's' : ''} in your bag.{' '}
            <Link href="/cart" className="font-semibold hover:underline" style={{ color: '#278AB0' }}>Return to bag</Link>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/orders" className="flex-1 flex items-center justify-center rounded-xl font-bold text-white transition-colors hover:opacity-90" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, height: '48px', backgroundColor: '#1DC690' }}>
          View My Orders
        </Link>
        <Link href="/search" className="flex-1 flex items-center justify-center rounded-xl font-bold transition-colors hover:bg-[#F4F4F0]" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, height: '48px', border: '1.5px solid #1C4670', color: '#1C4670' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
