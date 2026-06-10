import React from 'react';
import type { Metadata } from 'next';
import { AppStoreBadges } from '@/components/AppStoreBadges';

export const metadata: Metadata = {
  title: 'Download the Mulligans App',
  description:
    'Get the Mulligans app for iOS and Android. Buy and sell golf clubs, clothing and accessories with golf-specific search filters and buyer protection on every purchase.',
};

export default function DownloadPage() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <h1
          className="text-2xl sm:text-3xl"
          style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: '#0D0D0D' }}
        >
          Get the Mulligans app
        </h1>
        <p
          className="mt-3 max-w-md"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: '#555555', lineHeight: 1.6 }}
        >
          Browse, buy and sell golf equipment on the go. Available free on iOS and Android.
        </p>
        <div className="mt-8">
          <AppStoreBadges />
        </div>
      </div>
    </section>
  );
}
