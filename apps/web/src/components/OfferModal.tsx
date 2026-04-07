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
}

export function OfferModal({ listing, isOpen, onClose }: OfferModalProps) {
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

  const canSubmit = amount && !isNaN(numAmount) && !validationError && !submitting && !success;
  const image = listing.images?.[0]?.image_url;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      await createOffer({ listing_id: listing.id, offer_amount: numAmount });
      setSuccess(true);
      setTimeout(() => { onClose(); setSuccess(false); setAmount(''); }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = (err.data as { error?: string })?.error;
        setError(msg || 'Failed to send offer. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      console.error('Create offer error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div className="relative w-full max-w-[440px] mx-4 rounded-2xl bg-white p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-[#ADADAD] hover:text-[#0D0D0D]" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {/* Listing preview */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#F4F4F0' }}>
            {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xl">🏌️</div>}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0D0D0D]" style={{ fontFamily: 'var(--font-sans)' }}>{listing.title}</p>
            <p className="text-sm" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: '#1DC690' }}>£{askingPrice.toFixed(2)}</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(29,198,144,0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="font-semibold text-[#0D0D0D]" style={{ fontFamily: 'var(--font-sans)' }}>Offer Sent!</p>
          </div>
        ) : (
          <>
            {/* Offer input */}
            <label className="block mb-1.5" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.85rem', color: '#0D0D0D' }}>Your Offer</label>
            <div className="relative mb-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B6B6B]">£</span>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full rounded-lg border pl-7 pr-3 text-sm focus:outline-none" style={{ fontFamily: 'var(--font-sans)', height: '44px', borderColor: validationError ? '#E53E3E' : '#E0E0D8', color: '#0D0D0D' }} onFocus={(e) => { if (!validationError) { e.target.style.borderColor = '#1DC690'; e.target.style.boxShadow = '0 0 0 3px rgba(29,198,144,0.12)'; } }} onBlur={(e) => { e.target.style.borderColor = validationError ? '#E53E3E' : '#E0E0D8'; e.target.style.boxShadow = 'none'; }} />
            </div>

            {validationError && <p className="text-xs mb-2" style={{ color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>{validationError}</p>}
            {error && <p className="text-xs mb-2" style={{ color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>{error}</p>}

            <p className="mb-4 text-xs italic" style={{ color: '#6B6B6B', fontFamily: 'var(--font-sans)' }}>Offer expires after 24 hours</p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-[10px] py-2.5 text-sm font-bold transition-colors hover:bg-[#F4F4F0]" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, border: '1px solid #E0E0D8', color: '#6B6B6B' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!canSubmit} className="flex-1 rounded-[10px] py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, backgroundColor: '#1DC690' }}>
                {submitting ? 'Sending...' : 'Send Offer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
