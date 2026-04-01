'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getReceivedOffers,
  getMyOffers,
  acceptOffer as acceptOfferApi,
  declineOffer as declineOfferApi,
  counterOffer as counterOfferApi,
  acceptCounter as acceptCounterApi,
  declineCounter as declineCounterApi,
} from '@mulligans/api-client';
import type { ReceivedOffer, MadeOffer, OfferStatus } from '@mulligans/api-client';

// --- Offer status colours ---
const OFFER_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'rgba(124,92,191,0.15)', text: '#7C5CBF' },
  ACCEPTED: { bg: 'rgba(29,198,144,0.15)', text: '#1DC690' },
  DECLINED: { bg: 'rgba(239,68,68,0.12)', text: '#E53E3E' },
  COUNTERED: { bg: 'rgba(39,138,176,0.15)', text: '#278AB0' },
  COUNTER_ACCEPTED: { bg: 'rgba(29,198,144,0.15)', text: '#1DC690' },
  COUNTER_DECLINED: { bg: 'rgba(239,68,68,0.12)', text: '#E53E3E' },
  EXPIRED: { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' },
  VOID: { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' },
  WITHDRAWN: { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' },
  PURCHASED: { bg: 'rgba(29,198,144,0.15)', text: '#1DC690' },
};

const OFFER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  COUNTERED: 'Countered',
  COUNTER_ACCEPTED: 'Counter Accepted',
  COUNTER_DECLINED: 'Counter Declined',
  EXPIRED: 'Expired',
  VOID: 'Void',
  WITHDRAWN: 'Withdrawn',
  PURCHASED: 'Purchased',
};

const RECEIVED_FILTERS: OfferStatus[] = ['PENDING', 'COUNTERED', 'ACCEPTED', 'DECLINED', 'EXPIRED'];
const MADE_FILTERS: OfferStatus[] = ['PENDING', 'COUNTERED', 'ACCEPTED', 'DECLINED', 'EXPIRED'];

function formatPrice(amount: number) {
  return `£${amount.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// --- Status Badge ---
function OfferStatusBadge({ status }: { status: string }) {
  const style = OFFER_STATUS_STYLES[status] || { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontSize: '0.72rem',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 600,
      }}
    >
      {OFFER_STATUS_LABELS[status] || status}
    </span>
  );
}

// --- Filter Pill ---
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
      style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 600,
        backgroundColor: active ? '#1DC690' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#6B6B6B',
        border: active ? 'none' : '1px solid #E0E0D8',
      }}
    >
      {label}
    </button>
  );
}

// --- Skeleton Card ---
function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white p-4 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div className="flex gap-4">
        <div className="h-[72px] w-[72px] rounded-lg bg-[#F4F4F0] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-[#F4F4F0] animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-[#F4F4F0] animate-pulse" />
          <div className="h-4 w-1/4 rounded bg-[#F4F4F0] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// --- Counter Offer Modal ---
function CounterOfferModal({
  offer,
  onClose,
  onSuccess,
}: {
  offer: ReceivedOffer;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amount);
  const isValid = !isNaN(numAmount) && numAmount > offer.offer_amount && numAmount <= offer.list_price;

  const handleSubmit = async () => {
    if (!isValid) {
      setError(`Counter must be between ${formatPrice(offer.offer_amount)} and ${formatPrice(offer.list_price)}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await counterOfferApi(offer.id, { counter_amount: numAmount });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send counter');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 font-bold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>
          Send Counter Offer
        </h3>

        <div className="mb-4 space-y-1 text-sm">
          <p className="text-[#6B6B6B]">Their offer: <span className="font-semibold text-[#0D0D0D]">{formatPrice(offer.offer_amount)}</span></p>
          <p className="text-[#6B6B6B]">Listed price: <span className="font-semibold text-[#0D0D0D]">{formatPrice(offer.list_price)}</span></p>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>
        )}

        <div className="mb-2">
          <label className="mb-1 block text-sm font-semibold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.85rem' }}>
            Counter amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B6B6B]">£</span>
            <input
              type="number"
              step="0.01"
              min={offer.offer_amount}
              max={offer.list_price}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-[#E0E0D8] bg-white py-2.5 pl-7 pr-3 text-sm text-[#0D0D0D] placeholder-[#ADADAD] focus:border-[#7C5CBF] focus:outline-none focus:ring-2 focus:ring-[#7C5CBF]/20"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
        </div>
        <p className="mb-4 text-xs text-[#6B6B6B]">Counter expires in 24 hours</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-[10px] border-[1.5px] border-[#1C4670] py-2.5 text-sm font-bold text-[#1C4670] transition-colors hover:bg-[#F4F4F0]"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !isValid}
            className="flex-1 rounded-[10px] py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#7C5CBF', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
          >
            {submitting ? 'Sending...' : 'Send Counter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Send Offer to Watchers Modal ---
function SendToWatchersModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 font-bold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>
          Send Offer to Watchers
        </h3>
        <div className="rounded-lg bg-[#F4F4F0] p-4 text-center">
          <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            This feature requires a backend endpoint that hasn&apos;t been built yet.
          </p>
          <p className="mt-2 text-xs text-[#ADADAD]">
            It will allow you to send special offers to buyers who have favourited your listings.
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-[10px] border-[1.5px] border-[#1C4670] py-2.5 text-sm font-bold text-[#1C4670] transition-colors hover:bg-[#F4F4F0]"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// --- Received Offer Card ---
function ReceivedOfferCard({
  offer,
  onAction,
}: {
  offer: ReceivedOffer;
  onAction: () => void;
}) {
  const [acting, setActing] = useState<string | null>(null);
  const [showCounter, setShowCounter] = useState(false);

  const handleAction = async (action: 'accept' | 'decline') => {
    setActing(action);
    try {
      if (action === 'accept') await acceptOfferApi(offer.id);
      else await declineOfferApi(offer.id);
      onAction();
    } catch {
      // Silently handle — refresh will show current state
    } finally {
      setActing(null);
    }
  };

  const showExpiry = ['PENDING', 'COUNTERED'].includes(offer.status) && offer.expires_at;

  return (
    <>
      <div className="rounded-xl bg-white mb-3 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div className="p-4">
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="h-[72px] w-[72px] flex-shrink-0 rounded-lg bg-[#F4F4F0] overflow-hidden">
              {offer.listing?.image ? (
                <img src={offer.listing.image} alt={offer.listing.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              {/* Row 1: Title + Time */}
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-bold text-[#0D0D0D]" style={{ fontSize: '0.95rem', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                  {offer.listing?.title || 'Listing'}
                </p>
                <span className="flex-shrink-0 text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>
                  {formatDate(offer.created_at)}
                </span>
              </div>

              {/* Row 2: Listed price + Status */}
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[#6B6B6B]" style={{ fontSize: '0.85rem' }}>
                  Listed: {formatPrice(offer.list_price)}
                </span>
                <OfferStatusBadge status={offer.status} />
              </div>

              {/* Row 3: Offer amount */}
              <div className="mt-1.5">
                {offer.status === 'COUNTERED' && offer.counter_amount ? (
                  <p style={{ fontSize: '0.9rem', fontFamily: 'Montserrat, sans-serif' }}>
                    <span className="text-[#6B6B6B]">Offer: {formatPrice(offer.offer_amount)}</span>
                    <span className="mx-1 text-[#ADADAD]">→</span>
                    <span className="font-bold text-[#0D0D0D]">Counter: {formatPrice(offer.counter_amount)}</span>
                  </p>
                ) : (
                  <p style={{ fontSize: '0.9rem', fontFamily: 'Montserrat, sans-serif' }}>
                    <span className="text-[#6B6B6B]">Their offer: </span>
                    <span className="font-bold text-[#0D0D0D]">{formatPrice(offer.offer_amount)}</span>
                  </p>
                )}
              </div>

              {/* Expiry countdown */}
              {showExpiry && (
                <p className="mt-1 flex items-center gap-1 text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Expires in {timeUntil(offer.expires_at!)}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons for PENDING offers */}
          {offer.status === 'PENDING' && (
            <div className="mt-3 flex gap-2 border-t border-[#E0E0D8] pt-3">
              <button
                onClick={() => handleAction('decline')}
                disabled={acting !== null}
                className="flex-1 rounded-[10px] border-[1.5px] border-[#E53E3E] py-2 text-sm font-bold text-[#E53E3E] transition-colors hover:bg-red-50 disabled:opacity-50"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
              >
                {acting === 'decline' ? 'Declining...' : 'Decline'}
              </button>
              <button
                onClick={() => setShowCounter(true)}
                className="flex-1 rounded-[10px] border-[1.5px] border-[#7C5CBF] py-2 text-sm font-bold text-[#7C5CBF] transition-colors hover:bg-purple-50 disabled:opacity-50"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
              >
                Counter
              </button>
              <button
                onClick={() => handleAction('accept')}
                disabled={acting !== null}
                className="flex-1 rounded-[10px] py-2 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
              >
                {acting === 'accept' ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          )}

          {/* COUNTERED — awaiting buyer */}
          {offer.status === 'COUNTERED' && (
            <div className="mt-3 border-t border-[#E0E0D8] pt-3">
              <p className="text-sm italic text-[#6B6B6B]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Counter sent — awaiting buyer response
              </p>
            </div>
          )}
        </div>
      </div>

      {showCounter && (
        <CounterOfferModal
          offer={offer}
          onClose={() => setShowCounter(false)}
          onSuccess={() => {
            setShowCounter(false);
            onAction();
          }}
        />
      )}
    </>
  );
}

// --- Made Offer Card ---
function MadeOfferCard({
  offer,
  onAction,
}: {
  offer: MadeOffer;
  onAction: () => void;
}) {
  const [acting, setActing] = useState<string | null>(null);

  const handleCounterAction = async (action: 'accept' | 'decline') => {
    setActing(action);
    try {
      if (action === 'accept') await acceptCounterApi(offer.id);
      else await declineCounterApi(offer.id);
      onAction();
    } catch {
      // Silently handle
    } finally {
      setActing(null);
    }
  };

  const showExpiry = ['PENDING', 'COUNTERED'].includes(offer.status) && offer.expires_at;

  return (
    <div className="rounded-xl bg-white mb-3 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="h-[72px] w-[72px] flex-shrink-0 rounded-lg bg-[#F4F4F0] overflow-hidden">
            {offer.listing?.image ? (
              <img src={offer.listing.image} alt={offer.listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-bold text-[#0D0D0D]" style={{ fontSize: '0.95rem', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                {offer.listing?.title || 'Listing'}
              </p>
              <span className="flex-shrink-0 text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>
                {formatDate(offer.created_at)}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between">
              <span className="text-[#6B6B6B]" style={{ fontSize: '0.85rem' }}>
                Listed: {formatPrice(offer.list_price)}
              </span>
              <OfferStatusBadge status={offer.status} />
            </div>

            <div className="mt-1.5">
              {offer.status === 'COUNTERED' && offer.counter_amount ? (
                <p style={{ fontSize: '0.9rem', fontFamily: 'Montserrat, sans-serif' }}>
                  <span className="text-[#6B6B6B]">Your offer: {formatPrice(offer.offer_amount)}</span>
                  <span className="mx-1 text-[#ADADAD]">→</span>
                  <span className="font-bold text-[#0D0D0D]">Counter: {formatPrice(offer.counter_amount)}</span>
                </p>
              ) : (
                <p style={{ fontSize: '0.9rem', fontFamily: 'Montserrat, sans-serif' }}>
                  <span className="text-[#6B6B6B]">Your offer: </span>
                  <span className="font-bold text-[#0D0D0D]">{formatPrice(offer.offer_amount)}</span>
                </p>
              )}
            </div>

            {showExpiry && (
              <p className="mt-1 flex items-center gap-1 text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Expires in {timeUntil(offer.expires_at!)}
              </p>
            )}
          </div>
        </div>

        {/* COUNTERED — buyer can accept/decline counter */}
        {offer.status === 'COUNTERED' && (
          <div className="mt-3 flex gap-2 border-t border-[#E0E0D8] pt-3">
            <button
              onClick={() => handleCounterAction('decline')}
              disabled={acting !== null}
              className="flex-1 rounded-[10px] border-[1.5px] border-[#E53E3E] py-2 text-sm font-bold text-[#E53E3E] transition-colors hover:bg-red-50 disabled:opacity-50"
              style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
            >
              {acting === 'decline' ? 'Declining...' : 'Decline Counter'}
            </button>
            <button
              onClick={() => handleCounterAction('accept')}
              disabled={acting !== null}
              className="flex-1 rounded-[10px] py-2 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
            >
              {acting === 'accept' ? 'Accepting...' : 'Accept Counter'}
            </button>
          </div>
        )}

        {/* ACCEPTED or COUNTER_ACCEPTED — purchase window */}
        {(offer.status === 'ACCEPTED' || offer.status === 'COUNTER_ACCEPTED') && (
          <div className="mt-3 border-t border-[#E0E0D8] pt-3">
            <p className="text-sm font-medium" style={{ color: '#1DC690', fontFamily: 'Montserrat, sans-serif' }}>
              Accepted! Purchase within{' '}
              {offer.acceptance_expires_at ? timeUntil(offer.acceptance_expires_at) : '24h'}
            </p>
            <a
              href={`/listings/${offer.listing_id}`}
              className="mt-2 inline-block rounded-[10px] px-6 py-2 text-sm font-bold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
            >
              Go to Listing
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Empty State ---
function EmptyState({ type }: { type: 'received' | 'made' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-[#F4F4F0] p-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <p className="text-[#6B6B6B] font-medium" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        No {type === 'received' ? 'received' : 'made'} offers yet
      </p>
      <p className="mt-1 text-sm text-[#ADADAD]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {type === 'received'
          ? 'Offers from buyers on your listings will appear here.'
          : 'Offers you make on other listings will appear here.'}
      </p>
    </div>
  );
}

// --- Main Page ---
export default function OffersPage() {
  const [activeTab, setActiveTab] = useState<'received' | 'made'>('received');
  const [filter, setFilter] = useState<string>('all');
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOffer[]>([]);
  const [madeOffers, setMadeOffers] = useState<MadeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWatchersModal, setShowWatchersModal] = useState(false);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'received') {
        const res = await getReceivedOffers();
        setReceivedOffers(res.offers || []);
      } else {
        const res = await getMyOffers();
        setMadeOffers(res.offers || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Reset filter when tab changes
  useEffect(() => {
    setFilter('all');
  }, [activeTab]);

  // Client-side filtering
  const filteredReceived = filter === 'all'
    ? receivedOffers
    : receivedOffers.filter((o) => o.status === filter);

  const filteredMade = filter === 'all'
    ? madeOffers
    : madeOffers.filter((o) => o.status === filter);

  const currentFilters = activeTab === 'received' ? RECEIVED_FILTERS : MADE_FILTERS;

  return (
    <div className="min-h-screen" style={{ background: '#EAEAE0' }}>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Header with title + Send to Watchers button */}
        <div className="mb-6 flex items-center justify-between">
          <h1
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600,
              fontSize: '0.75rem',
              color: '#7C5CBF',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Offers
          </h1>
          <button
            onClick={() => setShowWatchersModal(true)}
            className="rounded-[10px] border-[1.5px] border-[#7C5CBF] px-4 py-2 text-sm font-bold text-[#7C5CBF] transition-colors hover:bg-purple-50"
            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
          >
            Send Offer to Watchers
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-6 border-b border-[#E0E0D8]">
          {(['received', 'made'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative pb-3 text-sm font-semibold transition-colors"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 600,
                color: activeTab === tab ? '#7C5CBF' : '#6B6B6B',
              }}
            >
              {tab === 'received' ? 'Received' : 'Made'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#7C5CBF' }} />
              )}
            </button>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <FilterPill
            label="All"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          {currentFilters.map((f) => (
            <FilterPill
              key={f}
              label={OFFER_STATUS_LABELS[f]}
              active={filter === f}
              onClick={() => setFilter(f)}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Offers List */}
        {!loading && activeTab === 'received' && (
          filteredReceived.length > 0 ? (
            filteredReceived.map((offer) => (
              <ReceivedOfferCard key={offer.id} offer={offer} onAction={fetchOffers} />
            ))
          ) : (
            <EmptyState type="received" />
          )
        )}

        {!loading && activeTab === 'made' && (
          filteredMade.length > 0 ? (
            filteredMade.map((offer) => (
              <MadeOfferCard key={offer.id} offer={offer} onAction={fetchOffers} />
            ))
          ) : (
            <EmptyState type="made" />
          )
        )}
      </div>

      {/* Send to Watchers Modal */}
      {showWatchersModal && (
        <SendToWatchersModal onClose={() => setShowWatchersModal(false)} />
      )}
    </div>
  );
}
