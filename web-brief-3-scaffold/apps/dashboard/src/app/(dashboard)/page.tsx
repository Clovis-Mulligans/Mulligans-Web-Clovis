'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@mulligans/ui';

const SECTIONS = [
  {
    title: 'Active Listings',
    description: 'Manage your inventory',
    href: '/inventory',
  },
  {
    title: 'Open Orders',
    description: 'Track and fulfil orders',
    href: '/orders',
  },
  {
    title: 'Pending Offers',
    description: 'Review and respond to offers',
    href: '/offers',
  },
  {
    title: 'Unread Messages',
    description: 'Respond to buyer enquiries',
    href: '/messages',
  },
  {
    title: 'Available Balance',
    description: 'Your earnings and payouts',
    href: '/payouts',
  },
  {
    title: 'Store Views',
    description: 'Performance analytics',
    href: '/analytics',
  },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="text-gray-400 mt-1">
          Here&apos;s an overview of your pro store.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((section) => (
          <a key={section.href} href={section.href}>
            <Card className="bg-gray-900 border-gray-800 hover:border-[#1DC690]/30 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#1DC690]">--</p>
                <p className="text-xs text-gray-500 mt-1">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-400 text-sm space-y-2">
          <p>
            Your pro store dashboard is ready. Full features will be available
            in upcoming updates:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Inventory management with bulk actions</li>
            <li>CSV import for bulk listing creation</li>
            <li>Order management and shipping labels</li>
            <li>Offers inbox with auto-decline thresholds</li>
            <li>Payout tracking and withdrawal scheduling</li>
            <li>Sales analytics and performance metrics</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
