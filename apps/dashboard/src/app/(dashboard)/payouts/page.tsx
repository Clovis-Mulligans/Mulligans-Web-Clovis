'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getBalance,
  getStripeAccountStatus,
  getStripeDashboardLink,
  createStripeAccount,
  createOnboardingLink,
  getPayoutTransactions,
} from '@mulligans/api-client';
import type { Balance, StripeAccountStatus, SoldOrder } from '@mulligans/api-client';

// ─── Status colours ──────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  completed: { bg: 'rgba(29,198,144,0.15)', text: '#1DC690' },
  delivered: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', text: '#E53E3E' },
  refunded: { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' },
  returned: { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' },
  disputed: { bg: 'rgba(239,68,68,0.12)', text: '#E53E3E' },
  to_ship: { bg: 'rgba(39,138,176,0.15)', text: '#278AB0' },
  in_transit: { bg: 'rgba(28,70,112,0.15)', text: '#1C4670' },
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed', delivered: 'Delivered', cancelled: 'Cancelled',
  refunded: 'Refunded', returned: 'Returned', disputed: 'Disputed',
  to_ship: 'To Ship', in_transit: 'In Transit',
};

function formatPrice(n: number) { return `£${n.toFixed(2)}`; }
function formatDate(s: string) { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' };
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5" style={{ backgroundColor: s.bg, color: s.text, fontSize: '0.72rem', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E0E0D8]">
      <div className="h-12 w-12 rounded-lg bg-[#F4F4F0] animate-pulse" />
      <div className="flex-1 space-y-2"><div className="h-3.5 w-2/3 rounded bg-[#F4F4F0] animate-pulse" /><div className="h-3 w-1/3 rounded bg-[#F4F4F0] animate-pulse" /></div>
      <div className="space-y-2 text-right"><div className="h-4 w-16 rounded bg-[#F4F4F0] animate-pulse ml-auto" /><div className="h-3 w-12 rounded bg-[#F4F4F0] animate-pulse ml-auto" /></div>
    </div>
  );
}

type FilterTab = 'all' | 'completed' | 'escrow' | 'refunded';

function FilterTabs({ active, onChange }: { active: FilterTab; onChange: (t: FilterTab) => void }) {
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'completed', label: 'Completed' },
    { key: 'escrow', label: 'Pending Escrow' }, { key: 'refunded', label: 'Refunded' },
  ];
  return (
    <div className="flex gap-4 border-b border-[#E0E0D8] mb-4">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} className="relative pb-2.5 text-sm font-semibold transition-colors" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: active === t.key ? '#1DC690' : '#6B6B6B' }}>
          {t.label}
          {active === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DC690]" />}
        </button>
      ))}
    </div>
  );
}

// ─── Stripe Connect Card ─────────────────────────────────────
function StripeConnectCard({ accountStatus }: { accountStatus: StripeAccountStatus | null }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await createStripeAccount();
      const link = await createOnboardingLink({
        return_url: `${window.location.origin}/payouts`,
        refresh_url: `${window.location.origin}/payouts`,
      });
      window.location.href = link.url;
    } catch { setLoading(false); }
  };

  const handleContinueSetup = async () => {
    setLoading(true);
    try {
      const link = await createOnboardingLink({
        return_url: `${window.location.origin}/payouts`,
        refresh_url: `${window.location.origin}/payouts`,
      });
      window.location.href = link.url;
    } catch { setLoading(false); }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const link = await getStripeDashboardLink();
      window.open(link.url, '_blank');
    } catch {} finally { setLoading(false); }
  };

  const isActive = accountStatus?.status === 'active' && accountStatus?.payouts_enabled;
  const isPending = accountStatus?.has_account && !isActive;
  const noAccount = !accountStatus?.has_account;

  return (
    <div className="rounded-xl bg-white p-5 border border-[#E0E0D8]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h3 className="mb-3 font-bold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>Payouts &amp; Banking</h3>

      {noAccount && (
        <>
          <div className="flex items-start gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            <p className="text-sm text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Connect your bank account to receive payouts</p>
          </div>
          <p className="text-xs text-[#6B6B6B] mb-3">You need a Stripe account to receive your earnings</p>
          <button onClick={handleConnect} disabled={loading} className="w-full rounded-[10px] py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#278AB0', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
            {loading ? 'Connecting...' : 'Connect with Stripe'}
          </button>
        </>
      )}

      {isPending && (
        <>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Setup Incomplete</span>
          <p className="text-sm text-[#0D0D0D] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>Complete your Stripe setup to receive payouts</p>
          <button onClick={handleContinueSetup} disabled={loading} className="w-full rounded-[10px] py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#F59E0B', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
            {loading ? 'Loading...' : 'Continue Setup →'}
          </button>
        </>
      )}

      {isActive && (
        <>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2" style={{ backgroundColor: 'rgba(29,198,144,0.15)', color: '#1DC690' }}>✓ Payouts Active</span>
          <p className="text-xs text-[#6B6B6B] mb-3">Your bank account is connected and payouts are active</p>
          <button onClick={handleManage} disabled={loading} className="w-full rounded-[10px] border-[1.5px] border-[#278AB0] py-2.5 text-sm font-bold text-[#278AB0] transition-colors hover:bg-blue-50 disabled:opacity-50" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
            {loading ? 'Loading...' : 'Manage Payouts & Bank Account →'}
          </button>
          <p className="mt-2 text-[#6B6B6B] italic" style={{ fontSize: '0.72rem' }}>Payout schedules are managed in your Stripe dashboard. Mulligans never stores your banking information.</p>
        </>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function PayoutsPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [transactions, setTransactions] = useState<SoldOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, statusRes, txRes] = await Promise.allSettled([
        getBalance(),
        getStripeAccountStatus(),
        getPayoutTransactions(),
      ]);
      if (balRes.status === 'fulfilled') setBalance(balRes.value);
      if (statusRes.status === 'fulfilled') setAccountStatus(statusRes.value);
      if (txRes.status === 'fulfilled') setTransactions(txRes.value.orders || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = transactions.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return o.status === 'completed';
    if (filter === 'escrow') return o.status === 'delivered';
    if (filter === 'refunded') return o.status === 'refunded' || o.status === 'returned';
    return true;
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTx = transactions.filter((o) => o.status === 'completed' && o.completed_at && new Date(o.completed_at) >= monthStart);
  const monthRevenue = thisMonthTx.reduce((s, o) => s + (o.seller_payout || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: '#EAEAE0' }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <h1 className="mb-6" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Payouts</h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* LEFT — Transaction History */}
          <div>
            <div className="rounded-xl bg-white border border-[#E0E0D8] overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div className="px-4 pt-4 pb-0">
                <h2 className="mb-3 font-bold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem' }}>Transaction History</h2>
                <FilterTabs active={filter} onChange={setFilter} />
              </div>

              {loading ? (
                <div>{[1,2,3,4,5].map((i) => <SkeletonRow key={i} />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="mb-3 rounded-full bg-[#F4F4F0] p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                  </div>
                  <p className="text-[#6B6B6B] font-medium" style={{ fontFamily: 'Montserrat, sans-serif' }}>No transactions yet</p>
                  <p className="mt-1 text-xs text-[#ADADAD]">Completed sales will appear here</p>
                </div>
              ) : (
                <div>
                  {filtered.map((order) => (
                    <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E0E0D8] transition-colors hover:bg-[rgba(29,198,144,0.04)]">
                      <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-[#F4F4F0] overflow-hidden">
                        {order.listing_image ? <img src={order.listing_image} alt="" className="h-full w-full object-cover" /> : (
                          <div className="flex h-full w-full items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.9rem' }}>{order.listing_title}</p>
                        <p className="text-[#6B6B6B]" style={{ fontSize: '0.82rem' }}>{order.buyer_name || 'Buyer'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p style={{ color: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>{formatPrice(order.seller_payout || order.amount)}</p>
                        <p className="text-[#6B6B6B] mt-0.5" style={{ fontSize: '0.75rem' }}>{formatDate(order.completed_at || order.created_at)}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Sticky sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl bg-white p-5 border border-[#E0E0D8] lg:sticky lg:top-24" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 className="mb-4 font-bold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Your Balance</h3>
              {loading ? (
                <div className="space-y-4 animate-pulse"><div className="h-8 w-32 rounded bg-[#F4F4F0]" /><div className="h-px bg-[#E0E0D8]" /><div className="h-6 w-24 rounded bg-[#F4F4F0]" /></div>
              ) : (
                <>
                  <div className="mb-1">
                    <p className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>Available in Stripe</p>
                    <p style={{ color: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '2rem' }}>{formatPrice(balance?.available || 0)}</p>
                    <p className="text-[#6B6B6B] italic" style={{ fontSize: '0.72rem' }}>Auto-paid to your bank on your Stripe schedule</p>
                  </div>
                  <div className="my-3 h-px bg-[#E0E0D8]" />
                  <div className="mb-1">
                    <p className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>Pending Escrow</p>
                    <p style={{ color: '#F59E0B', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.3rem' }}>{formatPrice(balance?.pending_escrow || 0)}</p>
                    <p className="text-[#6B6B6B] italic" style={{ fontSize: '0.72rem' }}>Released 5 days after delivery</p>
                  </div>
                  <div className="my-3 h-px bg-[#E0E0D8]" />
                  <div>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>Total Earned (All Time)</p>
                    <p className="text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>{formatPrice(balance?.total_earned || 0)}</p>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '0.75rem' }}>{balance?.completed_sales_count || 0} completed sales</p>
                  </div>
                </>
              )}
            </div>

            <StripeConnectCard accountStatus={accountStatus} />

            <div className="rounded-xl bg-white p-5 border border-[#E0E0D8]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 className="mb-3 font-bold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>This Month</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B6B6B]">Revenue</span>
                  <span style={{ color: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>{formatPrice(monthRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B6B6B]">Orders</span>
                  <span className="text-sm font-semibold text-[#0D0D0D]">{thisMonthTx.length}</span>
                </div>
              </div>
              <Link href="/analytics" className="mt-3 inline-block text-sm hover:underline" style={{ color: '#1DC690', fontFamily: 'Montserrat, sans-serif' }}>View full analytics →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
