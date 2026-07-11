'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOrderCounts, getOfferCounts, getMessageCounts, getMyListings, getPlatformStats } from '@mulligans/api-client';
import type { PlatformStats } from '@mulligans/api-client';

interface StatCard {
  title: string;
  description: string;
  href: string;
  value: string | number;
  loading: boolean;
}

export default function OverviewPage() {
 const [stats, setStats] = useState<{
  activeListings: string | number;
  openOrders: string | number;
  pendingOffers: string | number;
  unreadMessages: string | number;
  loading: boolean;
}>({
  activeListings: '--',
  openOrders: '--',
  pendingOffers: '--',
  unreadMessages: '--',
  loading: true,
});

  const [platformStats, setPlatformStats] = useState<PlatformStats & { loading: boolean }>({
    ios: 0, android: 0, web: 0, unknown: 0, loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [listings, orderCounts, offerCounts, messageCounts] = await Promise.allSettled([
          getMyListings({ status: 'active', limit: 1 }),
          getOrderCounts(),
          getOfferCounts(),
          getMessageCounts(),
        ]);

        setStats({
          activeListings: listings.status === 'fulfilled' ? listings.value.total ?? '--' : '--',
          openOrders: orderCounts.status === 'fulfilled' ? orderCounts.value.pending_sales ?? '--' : '--',
          pendingOffers: offerCounts.status === 'fulfilled' ? offerCounts.value.offers_received_pending ?? '--' : '--',
          unreadMessages: messageCounts.status === 'fulfilled' ? messageCounts.value.unread_count ?? '--' : '--',
          loading: false,
        });
      } catch {
        setStats(s => ({ ...s, loading: false }));
      }
    }

    async function fetchPlatformStats() {
      try {
        const data = await getPlatformStats();
        setPlatformStats({ ...data, loading: false });
      } catch {
        setPlatformStats(s => ({ ...s, loading: false }));
      }
    }

    fetchStats();
    fetchPlatformStats();
  }, []);

  const SECTIONS = [
    { title: 'Active Listings', description: 'Manage your inventory', href: '/inventory', value: stats.activeListings },
    { title: 'Open Orders', description: 'Track and fulfil orders', href: '/orders', value: stats.openOrders },
    { title: 'Pending Offers', description: 'Review and respond to offers', href: '/offers', value: stats.pendingOffers },
    { title: 'Unread Messages', description: 'Respond to buyer enquiries', href: '/messages', value: stats.unreadMessages },
    { title: 'Available Balance', description: 'Your earnings and payouts', href: '/payouts', value: '--' },
    { title: 'Store Views', description: 'Performance analytics', href: '/analytics', value: '--' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: '#0D0D0D', fontFamily: 'Montserrat, sans-serif' }}
        >
          Welcome back
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#6B6B6B' }}>
          Here&apos;s an overview of your pro store.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <div
              className="rounded-xl p-5 cursor-pointer transition-shadow hover:shadow-md"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0D8',
                borderRadius: '12px',
              }}
            >
              <p
                className="text-sm font-semibold mb-3"
                style={{ color: '#0D0D0D', fontFamily: 'Montserrat, sans-serif' }}
              >
                {section.title}
              </p>
              <p
                className="text-3xl font-bold mb-1"
                style={{
                  color: '#1DC690',
                  fontFamily: 'Montserrat, sans-serif',
                  minHeight: '2.25rem',
                }}
              >
                {stats.loading ? (
                  <span className="inline-block h-8 w-12 rounded bg-[#F4F4F0] animate-pulse" />
                ) : (
                  section.value
                )}
              </p>
              <p className="text-xs" style={{ color: '#6B6B6B' }}>
                {section.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: '#0D0D0D', fontFamily: 'Montserrat, sans-serif' }}
        >
          Users by Platform
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: 'iOS', key: 'ios' as const },
            { label: 'Android', key: 'android' as const },
            { label: 'Web', key: 'web' as const },
            { label: 'Unknown', key: 'unknown' as const },
          ] as const).map((item) => (
            <div
              key={item.key}
              className="rounded-xl p-5"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0D8',
                borderRadius: '12px',
              }}
            >
              <p
                className="text-sm font-semibold mb-3"
                style={{ color: '#0D0D0D', fontFamily: 'Montserrat, sans-serif' }}
              >
                {item.label}
              </p>
              <p
                className="text-3xl font-bold"
                style={{
                  color: '#1DC690',
                  fontFamily: 'Montserrat, sans-serif',
                  minHeight: '2.25rem',
                }}
              >
                {platformStats.loading ? (
                  <span className="inline-block h-8 w-12 rounded bg-[#F4F4F0] animate-pulse" />
                ) : (
                  platformStats[item.key]
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}