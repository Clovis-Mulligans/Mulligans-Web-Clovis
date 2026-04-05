'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { fetchAnalyticsData } from '@mulligans/api-client';
import type { SoldOrder, ListingWithImages, AnalyticsPeriod } from '@mulligans/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Period helpers ──────────────────────────────────────────

function getPeriodRange(period: AnalyticsPeriod): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const end = new Date();
  const start = new Date();
  const prevEnd = new Date();
  const prevStart = new Date();

  if (period === '7d') {
    start.setDate(end.getDate() - 7);
    prevEnd.setDate(start.getDate());
    prevStart.setDate(prevEnd.getDate() - 7);
  } else if (period === '30d') {
    start.setDate(end.getDate() - 30);
    prevEnd.setDate(start.getDate());
    prevStart.setDate(prevEnd.getDate() - 30);
  } else if (period === '90d') {
    start.setDate(end.getDate() - 90);
    prevEnd.setDate(start.getDate());
    prevStart.setDate(prevEnd.getDate() - 90);
  } else {
    start.setFullYear(end.getFullYear() - 1);
    prevEnd.setFullYear(start.getFullYear());
    prevStart.setFullYear(prevEnd.getFullYear() - 1);
  }

  return { start, end, prevStart, prevEnd };
}

function filterByPeriod(orders: SoldOrder[], start: Date, end: Date): SoldOrder[] {
  return orders.filter((o) => {
    if (o.status !== 'completed') return false;
    const d = new Date(o.completed_at || o.created_at);
    return d >= start && d <= end;
  });
}

function groupByDay(orders: SoldOrder[]): { date: string; revenue: number; orders: number }[] {
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    const key = new Date(o.completed_at || o.created_at).toISOString().slice(0, 10);
    const cur = map.get(key) || { revenue: 0, orders: 0 };
    cur.revenue += o.seller_payout || 0;
    cur.orders += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));
}

function groupByWeek(orders: SoldOrder[]): { date: string; revenue: number; orders: number }[] {
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    const d = new Date(o.completed_at || o.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1);
    const key = weekStart.toISOString().slice(0, 10);
    const cur = map.get(key) || { revenue: 0, orders: 0 };
    cur.revenue += o.seller_payout || 0;
    cur.orders += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));
}

function groupByMonth(orders: SoldOrder[]): { date: string; revenue: number; orders: number }[] {
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    const d = new Date(o.completed_at || o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const cur = map.get(key) || { revenue: 0, orders: 0 };
    cur.revenue += o.seller_payout || 0;
    cur.orders += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));
}

function formatChartDate(date: string, period: AnalyticsPeriod) {
  const d = new Date(date);
  if (period === '12m') return d.toLocaleDateString('en-GB', { month: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatPrice(n: number) { return `£${n.toFixed(2)}`; }

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Status badge colours (for listings) ─────────────────────
const LISTING_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: 'rgba(29,198,144,0.15)', text: '#1DC690' },
  sold: { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' },
  draft: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  paused: { bg: 'rgba(39,138,176,0.15)', text: '#278AB0' },
};

// ─── Change Badge ────────────────────────────────────────────
function ChangeBadge({ value }: { value: number }) {
  if (value === 0) return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(107,107,107,0.15)', color: '#6B6B6B' }}>—</span>;
  const isPositive = value > 0;
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: isPositive ? 'rgba(29,198,144,0.15)' : 'rgba(239,68,68,0.12)', color: isPositive ? '#1DC690' : '#E53E3E' }}>
      {isPositive ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
}

// ─── KPI Card ────────────────────────────────────────────────
function KpiCard({ label, value, change }: { label: string; value: string; change: number }) {
  return (
    <div className="rounded-xl bg-white p-4 border border-[#E0E0D8]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.72rem', color: '#6B6B6B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
      <p className="mt-1 text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.6rem' }}>{value}</p>
      <div className="mt-1"><ChangeBadge value={change} /></div>
    </div>
  );
}

// ─── Period Selector ─────────────────────────────────────────
function PeriodSelector({ active, onChange }: { active: AnalyticsPeriod; onChange: (p: AnalyticsPeriod) => void }) {
  const periods: { key: AnalyticsPeriod; label: string }[] = [
    { key: '7d', label: '7 days' }, { key: '30d', label: '30 days' },
    { key: '90d', label: '90 days' }, { key: '12m', label: '12 months' },
  ];
  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <button key={p.key} onClick={() => onChange(p.key)} className="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, backgroundColor: active === p.key ? '#1DC690' : '#FFFFFF', color: active === p.key ? '#FFFFFF' : '#6B6B6B', border: active === p.key ? 'none' : '1px solid #E0E0D8' }}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white p-3 border border-[#E0E0D8]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
      <p className="text-xs text-[#6B6B6B]">{label}</p>
      <p className="font-bold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Revenue: {formatPrice(payload[0].value)}</p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [allOrders, setAllOrders] = useState<SoldOrder[]>([]);
  const [allListings, setAllListings] = useState<ListingWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAnalyticsData();
      setAllOrders(data.orders);
      setAllListings(data.listings);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const metrics = useMemo(() => {
    const { start, end, prevStart, prevEnd } = getPeriodRange(period);
    const current = filterByPeriod(allOrders, start, end);
    const previous = filterByPeriod(allOrders, prevStart, prevEnd);

    const curRevenue = current.reduce((s, o) => s + (o.seller_payout || 0), 0);
    const prevRevenue = previous.reduce((s, o) => s + (o.seller_payout || 0), 0);
    const curOrders = current.length;
    const prevOrders = previous.length;
    const totalViews = allListings.reduce((s, l) => s + (l.views || 0), 0);
    const curAov = curOrders > 0 ? curRevenue / curOrders : 0;
    const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;
    const curConversion = totalViews > 0 ? (curOrders / totalViews) * 100 : 0;
    const prevConversion = totalViews > 0 ? (prevOrders / totalViews) * 100 : 0;

    let chartData;
    if (period === '7d' || period === '30d') chartData = groupByDay(current);
    else if (period === '90d') chartData = groupByWeek(current);
    else chartData = groupByMonth(current);

    const topListings = [...allListings]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10);

    return {
      curRevenue, prevRevenue, curOrders, prevOrders, totalViews,
      curAov, prevAov, curConversion, prevConversion, chartData, topListings,
      revenueChange: pctChange(curRevenue, prevRevenue),
      ordersChange: pctChange(curOrders, prevOrders),
      viewsChange: 0, // Views are cumulative — no period-specific change
    };
  }, [period, allOrders, allListings]);

  return (
    <div className="min-h-screen" style={{ background: '#EAEAE0' }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Analytics</h1>
          <PeriodSelector active={period} onChange={setPeriod} />
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <div key={i} className="h-28 rounded-xl bg-white animate-pulse border border-[#E0E0D8]" />)}</div>
            <div className="h-72 rounded-xl bg-white animate-pulse border border-[#E0E0D8]" />
          </div>
        ) : (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <KpiCard label="Revenue" value={formatPrice(metrics.curRevenue)} change={metrics.revenueChange} />
              <KpiCard label="Orders" value={String(metrics.curOrders)} change={metrics.ordersChange} />
              <KpiCard label="Listing Views" value={String(metrics.totalViews)} change={metrics.viewsChange} />
              <KpiCard label="Avg Order Value" value={metrics.curOrders > 0 ? formatPrice(metrics.curAov) : '—'} change={metrics.curOrders > 0 ? pctChange(metrics.curAov, metrics.prevAov) : 0} />
            </div>

            {/* Revenue Chart */}
            <div className="rounded-xl bg-white p-5 border border-[#E0E0D8] mb-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h2 className="mb-4 font-bold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Revenue Over Time</h2>
              {metrics.chartData.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-[#ADADAD]" style={{ fontFamily: 'Montserrat, sans-serif' }}>No revenue data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={metrics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(d) => formatChartDate(d, period)} tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" fill="#1DC690" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Period Comparison Table */}
            <div className="rounded-xl bg-white border border-[#E0E0D8] mb-4 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div className="px-5 pt-5 pb-3">
                <h2 className="font-bold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>vs Previous Period</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F9F9F7' }}>
                    <th className="text-left px-5 py-2.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#6B6B6B' }}>Metric</th>
                    <th className="text-right px-5 py-2.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#6B6B6B' }}>This Period</th>
                    <th className="text-right px-5 py-2.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#6B6B6B' }}>Previous Period</th>
                    <th className="text-right px-5 py-2.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#6B6B6B' }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Revenue', cur: formatPrice(metrics.curRevenue), prev: formatPrice(metrics.prevRevenue), change: metrics.revenueChange },
                    { label: 'Orders', cur: String(metrics.curOrders), prev: String(metrics.prevOrders), change: metrics.ordersChange },
                    { label: 'Avg Order Value', cur: metrics.curOrders > 0 ? formatPrice(metrics.curAov) : '—', prev: metrics.prevOrders > 0 ? formatPrice(metrics.prevAov) : '—', change: pctChange(metrics.curAov, metrics.prevAov) },
                    { label: 'Conversion Rate', cur: `${metrics.curConversion.toFixed(1)}%`, prev: `${metrics.prevConversion.toFixed(1)}%`, change: pctChange(metrics.curConversion, metrics.prevConversion) },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-[#E0E0D8]">
                      <td className="px-5 py-3 text-sm text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}>{row.label}</td>
                      <td className="px-5 py-3 text-right text-sm text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>{row.cur}</td>
                      <td className="px-5 py-3 text-right text-sm text-[#6B6B6B]">{row.prev}</td>
                      <td className="px-5 py-3 text-right"><ChangeBadge value={row.change} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Listings Table */}
            <div className="rounded-xl bg-white border border-[#E0E0D8] overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div className="px-5 pt-5 pb-3 flex items-baseline gap-2">
                <h2 className="font-bold text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Top Performing Listings</h2>
                <span className="text-[#6B6B6B]" style={{ fontSize: '0.78rem' }}>(by views)</span>
              </div>

              {metrics.topListings.length === 0 ? (
                <div className="px-5 pb-5 text-sm text-[#ADADAD]" style={{ fontFamily: 'Montserrat, sans-serif' }}>No listings yet. Add listings to see performance data.</div>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: '#F9F9F7' }}>
                        <th className="text-left px-5 py-2.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#6B6B6B' }}>Listing</th>
                        <th className="text-right px-5 py-2.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#6B6B6B' }}>Price</th>
                        <th className="text-right px-5 py-2.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#6B6B6B' }}>Views</th>
                        <th className="text-right px-5 py-2.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#6B6B6B' }}>Favourites</th>
                        <th className="text-right px-5 py-2.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#6B6B6B' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.topListings.map((listing) => {
                        const img = listing.images?.[0]?.image_url;
                        const statusStyle = LISTING_STATUS_STYLES[listing.status] || { bg: 'rgba(107,107,107,0.15)', text: '#6B6B6B' };
                        return (
                          <tr key={listing.id} className="border-b border-[#E0E0D8]">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 flex-shrink-0 rounded-md bg-[#F4F4F0] overflow-hidden">
                                  {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
                                </div>
                                <span className="truncate text-sm text-[#0D0D0D]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, maxWidth: '200px' }}>{listing.title}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right" style={{ color: '#1DC690', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.9rem' }}>£{Number(listing.price).toFixed(2)}</td>
                            <td className="px-5 py-3 text-right text-sm text-[#0D0D0D]">{listing.views || 0}</td>
                            <td className="px-5 py-3 text-right text-sm text-[#0D0D0D]">{listing.favorites_count || 0}</td>
                            <td className="px-5 py-3 text-right">
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>{listing.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-5 py-3">
                    <Link href="/inventory" className="text-sm hover:underline" style={{ color: '#1DC690', fontFamily: 'Montserrat, sans-serif' }}>View All Inventory →</Link>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
