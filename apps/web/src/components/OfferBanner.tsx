'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ─── Design Tokens (web-standards.md v2.0) ──────────────────

const BANNER_INFO_GRADIENT = 'linear-gradient(135deg, #1C4670 0%, #278AB0 100%)';
const BANNER_WARN_GRADIENT = 'linear-gradient(135deg, #78350F 0%, #92400E 100%)';
const BANNER_SUCCESS_GRADIENT = 'linear-gradient(135deg, #065F46 0%, #1DC690 100%)';
const OFFERS_PURPLE = '#7C5CBF';

// ─── Types ──────────────────────────────────────────────────

interface OfferData {
  id: string;
  status: string;
  offer_amount: number;
  counter_amount: number | null;
  final_amount: number | null;
  list_price: number;
  acceptance_expires_at: string | null;
  expires_at: string;
  listing_id: string;
}

interface OfferBannerProps {
  offer: OfferData;
  onWithdraw: (offerId: string) => Promise<void>;
  onAcceptCounter: (offerId: string) => Promise<void>;
  onDeclineCounter: (offerId: string) => Promise<void>;
  onAddToCart: (offerId: string) => void;
  onExpired?: () => void;
}

// ─── Helpers ────────────────────────────────────────────────

function getTimeRemaining(expiresAt: string) {
  const totalMs = new Date(expiresAt).getTime() - Date.now();
  if (totalMs <= 0) return { hours: 0, minutes: 0, totalMs: 0, isExpired: true };
  return {
    hours: Math.floor(totalMs / 3600000),
    minutes: Math.floor((totalMs % 3600000) / 60000),
    totalMs,
    isExpired: false,
  };
}

function toBuyerPrice(sellerAmount: number): number {
  return sellerAmount * 1.075 + 0.99;
}

// ─── Component ──────────────────────────────────────────────

export function OfferBanner({
  offer,
  onWithdraw,
  onAcceptCounter,
  onDeclineCounter,
  onAddToCart,
  onExpired,
}: OfferBannerProps) {
  const [acting, setActing] = useState(false);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const isAccepted = offer.status === 'ACCEPTED' || offer.status === 'COUNTER_ACCEPTED';

  const [timeRemaining, setTimeRemaining] = useState(() =>
    isAccepted && offer.acceptance_expires_at
      ? getTimeRemaining(offer.acceptance_expires_at)
      : null
  );

  useEffect(() => {
    if (!isAccepted || !offer.acceptance_expires_at) return;

    const update = () => {
      const remaining = getTimeRemaining(offer.acceptance_expires_at!);
      setTimeRemaining(remaining);
      if (remaining.isExpired && onExpired) onExpired();
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [offer.acceptance_expires_at, isAccepted, onExpired]);

  const buyerOfferPrice = toBuyerPrice(offer.offer_amount);
  const buyerCounterPrice = offer.counter_amount ? toBuyerPrice(offer.counter_amount) : null;
  const buyerFinalPrice = offer.final_amount ? toBuyerPrice(offer.final_amount) : null;
  const buyerListPrice = toBuyerPrice(offer.list_price);

  const handleWithdraw = useCallback(async () => {
    if (acting) return;
    setActing(true);
    try {
      await onWithdraw(offer.id);
    } finally {
      setActing(false);
      setConfirmingWithdraw(false);
    }
  }, [acting, offer.id, onWithdraw]);

  const handleAcceptCounter = useCallback(async () => {
    if (acting) return;
    setActing(true);
    try {
      await onAcceptCounter(offer.id);
    } finally {
      setActing(false);
    }
  }, [acting, offer.id, onAcceptCounter]);

  const handleDeclineCounter = useCallback(async () => {
    if (acting) return;
    setActing(true);
    try {
      await onDeclineCounter(offer.id);
    } finally {
      setActing(false);
    }
  }, [acting, offer.id, onDeclineCounter]);

  const handleAddToCart = useCallback(() => {
    if (addedToCart) return;
    setAddedToCart(true);
    onAddToCart(offer.id);
  }, [addedToCart, offer.id, onAddToCart]);

  // ─── Determine gradient and content ─────────────────────

  let gradient: string;
  let statusIcon: React.ReactNode;
  let titleText: string;
  let descText: string;
  let actionsBlock: React.ReactNode;

  const iconCircle = (bg: string, children: React.ReactNode): React.ReactNode => (
    <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {children}
    </div>
  );

  const tagIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );

  const checkIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const swapIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3l4 4-4 4" /><path d="M20 7H4" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h16" />
    </svg>
  );

  const clockIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const cartIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );

  // ─── PENDING ────────────────────────────────────────────
  if (offer.status === 'PENDING') {
    gradient = BANNER_INFO_GRADIENT;
    statusIcon = iconCircle('rgba(29,198,144,0.25)', tagIcon);
    titleText = 'Offer Pending';
    descText = `Your offer of £${buyerOfferPrice.toFixed(2)} has been sent to the seller.`;

    actionsBlock = confirmingWithdraw ? (
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          onClick={handleWithdraw}
          disabled={acting}
          style={{ ...actionBtnStyle, flex: 1, backgroundColor: 'white', color: '#DC2626', opacity: acting ? 0.6 : 1 }}
        >
          {acting ? 'Withdrawing...' : 'Yes, withdraw'}
        </button>
        <button
          onClick={() => setConfirmingWithdraw(false)}
          style={{ ...actionBtnStyle, flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          Cancel
        </button>
      </div>
    ) : (
      <button
        onClick={() => setConfirmingWithdraw(true)}
        style={{ ...actionBtnStyle, marginTop: 14, width: '100%', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
      >
        Withdraw Offer
      </button>
    );
  }

  // ─── COUNTERED ──────────────────────────────────────────
  else if (offer.status === 'COUNTERED') {
    gradient = BANNER_WARN_GRADIENT;
    statusIcon = iconCircle('rgba(255,255,255,0.15)', swapIcon);
    titleText = 'Counter Offer Received';
    descText = buyerCounterPrice
      ? `The seller has countered with £${buyerCounterPrice.toFixed(2)} (your offer was £${buyerOfferPrice.toFixed(2)}).`
      : `The seller has countered your offer of £${buyerOfferPrice.toFixed(2)}.`;

    actionsBlock = (
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          onClick={handleAcceptCounter}
          disabled={acting}
          style={{ ...actionBtnStyle, flex: 1, backgroundColor: 'white', color: '#065F46', fontWeight: 700, opacity: acting ? 0.6 : 1 }}
        >
          {acting ? 'Accepting...' : 'Accept Counter'}
        </button>
        <button
          onClick={handleDeclineCounter}
          disabled={acting}
          style={{ ...actionBtnStyle, flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', opacity: acting ? 0.6 : 1 }}
        >
          Decline
        </button>
      </div>
    );
  }

  // ─── ACCEPTED / COUNTER_ACCEPTED ────────────────────────
  else if (isAccepted) {
    gradient = BANNER_SUCCESS_GRADIENT;
    statusIcon = iconCircle('rgba(255,255,255,0.2)', checkIcon);
    titleText = 'Your Offer Was Accepted!';

    const savings = buyerFinalPrice && buyerListPrice
      ? Math.round(((buyerListPrice - buyerFinalPrice) / buyerListPrice) * 100)
      : 0;

    descText = buyerFinalPrice
      ? `Complete your purchase at £${buyerFinalPrice.toFixed(2)}${savings > 0 ? ` (${savings}% off)` : ''} before the timer expires.`
      : 'Complete your purchase before the timer expires.';

    if (timeRemaining?.isExpired) return null;

    const countdownParts: string[] = [];
    if (timeRemaining && timeRemaining.hours > 0) countdownParts.push(`${timeRemaining.hours}h`);
    if (timeRemaining) countdownParts.push(`${timeRemaining.minutes}m`);
    const countdownText = countdownParts.length > 0
      ? `${countdownParts.join(' ')} remaining to purchase`
      : '';

    actionsBlock = (
      <>
        {countdownText && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            {clockIcon}
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{countdownText}</span>
          </div>
        )}
        <button
          onClick={addedToCart ? undefined : handleAddToCart}
          style={{
            ...actionBtnStyle,
            marginTop: 14,
            width: '100%',
            backgroundColor: addedToCart ? 'rgba(255,255,255,0.2)' : 'white',
            color: addedToCart ? 'white' : '#065F46',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: addedToCart ? 'default' : 'pointer',
          }}
        >
          {cartIcon}
          {addedToCart
            ? 'Added to Cart'
            : buyerFinalPrice
              ? `Add to Cart at £${buyerFinalPrice.toFixed(2)}`
              : 'Add to Cart'}
        </button>
      </>
    );
  } else {
    return null;
  }

  return (
    <div style={{
      background: gradient!,
      borderRadius: 16,
      padding: '20px 24px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        {statusIcon}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'white', margin: 0, letterSpacing: '-0.005em' }}>
            {titleText!}
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '4px 0 0', lineHeight: 1.5 }}>
            {descText!}
          </p>
        </div>
      </div>

      {actionsBlock}
    </div>
  );
}

// ─── Shared action button style ─────────────────────────────

const actionBtnStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  fontWeight: 600,
  height: 40,
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease',
  padding: '0 16px',
};
