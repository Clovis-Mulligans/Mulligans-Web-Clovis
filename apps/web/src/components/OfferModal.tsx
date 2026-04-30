'use client';

import React, { useState } from 'react';
import { createOffer, ApiError } from '@mulligans/api-client';

interface OfferModalProps {
  listing: {
    id: string;
    title: string;
    price: string | number;
    images?: { image_url: string }[];
  };
  isOpen: boolean;
  onClose: () => void;
  offerStatus?: { offers_used: number; offers_remaining: number } | null;
  onOfferSubmitted?: () => void;
}

const MODAL_SHADOW = '0 12px 40px rgba(6,7,10,0.18)';

export function OfferModal({ listing, isOpen, onClose, offerStatus, onOfferSubmitted }: OfferModalProps) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const askingPrice = Number(listing.price);
  const numAmount = parseFloat(amount);
  const minOffer = askingPrice * 0.5; // 50% per business-logic.md

  let validationError: string | null = null;
  if (amount && !isNaN(numAmount)) {
    if (numAmount <= 0) validationError = 'Offer must be a positive amount';
    else if (numAmount >= askingPrice) validationError = 'Offer must be below asking price';
    else if (numAmount < minOffer) validationError = `Minimum offer is £${minOffer.toFixed(2)} (50% of asking price)`;
  }

  const noOffersRemaining = offerStatus != null && offerStatus.offers_remaining <= 0;
  const canSubmit = amount && !isNaN(numAmount) && !validationError && !submitting && !success && !noOffersRemaining;
  const image = listing.images?.[0]?.image_url;

  // Quick offer pill amounts — 10/15/20% off asking price
  const quickOffers = [
    { label: '10% off', value: askingPrice * 0.9 },
    { label: '15% off', value: askingPrice * 0.85 },
    { label: '20% off', value: askingPrice * 0.8 },
  ];

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      await createOffer({ listing_id: listing.id, offer_amount: numAmount });
      setSuccess(true);
      if (onOfferSubmitted) onOfferSubmitted();
      setTimeout(() => { onClose(); setSuccess(false); setAmount(''); }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = (err.data as { error?: string })?.error;
        setError(msg || 'Failed to send offer. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0" style={{ backgroundColor: 'rgba(6,7,10,0.5)' }} />
      <div
        className="relative w-full max-w-[440px] mx-4 rounded-2xl bg-white"
        style={{ padding: '24px', boxShadow: MODAL_SHADOW, border: '1px solid #E5E7EB' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 transition-colors"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#06070A'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; }}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {/* Title */}
        <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '18px', color: '#06070A', marginBottom: '16px', letterSpacing: '-0.005em' }}>
          Make an offer
        </h2>

        {/* Listing preview */}
        <div className="flex items-center gap-3 mb-5 rounded-xl" style={{ backgroundColor: '#FAFAF8', border: '1px solid #E5E7EB', padding: '12px 14px' }}>
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#F7F7F5' }}>
            {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xl">🏌️</div>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: '#06070A' }}>{listing.title}</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: '#1DC690' }}>£{askingPrice.toFixed(2)}</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(29,198,144,0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: '#06070A' }}>Offer sent!</p>
            <p className="mt-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#6B7280' }}>The seller has 24 hours to respond.</p>
          </div>
        ) : (
          <>
            {/* Offer limits info — mirrors mobile */}
            {offerStatus != null && (
              <div className="flex items-center gap-2 mb-4 rounded-lg" style={{ backgroundColor: 'rgba(124,92,191,0.08)', padding: '10px 14px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C5CBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '13px', color: '#6B7280' }}>
                  Offers remaining: {offerStatus.offers_remaining}/3
                </span>
              </div>
            )}

            {noOffersRemaining && (
              <div className="mb-4 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.06)', padding: '10px 14px', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '13px', color: '#991B1B' }}>
                  You have used all 3 offers for this listing.
                </p>
              </div>
            )}

            {/* Quick offer pills */}
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '12px', color: '#278AB0', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '10px' }}>
              Quick offer
            </p>
            <div className="flex gap-2 mb-5">
              {quickOffers.map((q) => {
                const isActive = !!numAmount && Math.abs(numAmount - q.value) < 0.01;
                return (
                  <button
                    key={q.label}
                    onClick={() => setAmount(q.value.toFixed(2))}
                    disabled={noOffersRemaining}
                    className="flex-1 transition-colors"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      fontSize: '13px',
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: `1px solid ${isActive ? '#1DC690' : '#E5E7EB'}`,
                      backgroundColor: isActive ? 'rgba(29,198,144,0.08)' : '#FFFFFF',
                      color: isActive ? '#1DC690' : '#06070A',
                      cursor: noOffersRemaining ? 'not-allowed' : 'pointer',
                      opacity: noOffersRemaining ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (!isActive && !noOffersRemaining) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FAFAF8'; }}
                    onMouseLeave={(e) => { if (!isActive && !noOffersRemaining) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF'; }}
                  >
                    <div>{q.label}</div>
                    <div style={{ fontSize: '12px', color: isActive ? '#1DC690' : '#6B7280', fontWeight: 500, marginTop: '2px' }}>£{q.value.toFixed(2)}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom offer input */}
            <label className="block mb-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: '#06070A' }}>
              Your offer
            </label>
            <div className="relative mb-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ fontSize: '14px', color: '#9CA3AF', fontFamily: 'var(--font-sans)' }}>£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={noOffersRemaining}
                className="w-full focus:outline-none"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 500,
                  height: '42px',
                  padding: '10px 14px 10px 28px',
                  borderRadius: '10px',
                  border: `1px solid ${validationError ? '#FCA5A5' : '#E5E7EB'}`,
                  color: '#06070A',
                  backgroundColor: '#FFFFFF',
                  opacity: noOffersRemaining ? 0.5 : 1,
                }}
                onFocus={(e) => { if (!validationError) { e.target.style.borderColor = '#1DC690'; e.target.style.boxShadow = '0 0 0 3px rgba(29,198,144,0.10)'; } }}
                onBlur={(e) => { e.target.style.borderColor = validationError ? '#FCA5A5' : '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {validationError && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: '#DC2626', marginBottom: '8px' }}>{validationError}</p>}
            {error && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: '#DC2626', marginBottom: '8px' }}>{error}</p>}

            <p className="mb-5" style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: '#9CA3AF' }}>
              Offer expires after 24 hours
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 transition-colors"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: '14px',
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  color: '#1C4670',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FAFAF8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 transition-opacity"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: '14px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#1DC690',
                  color: '#FFFFFF',
                  letterSpacing: '0.01em',
                  opacity: !canSubmit ? 0.5 : 1,
                  cursor: !canSubmit ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#18B07E'; }}
                onMouseLeave={(e) => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1DC690'; }}
              >
                {submitting ? 'Sending...' : noOffersRemaining ? 'No Offers Remaining' : 'Send offer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
