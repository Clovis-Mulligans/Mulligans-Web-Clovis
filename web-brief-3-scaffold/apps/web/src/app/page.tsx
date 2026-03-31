import React from 'react';
import { Button } from '@mulligans/ui';

export default function HomePage() {
  return (
    <div>
      {/* Hero section */}
      <section className="bg-[#06070A] text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            The Marketplace for{' '}
            <span className="text-[#1DC690]">Golfers</span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
            Buy and sell golf equipment with filters no other marketplace
            offers. Search by shaft flex, loft, lie angle, dexterity, and more.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button variant="primary" size="lg">
              Browse Equipment
            </Button>
            <Button variant="outline" size="lg">
              Start Selling
            </Button>
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1C4670]">
            Web Marketplace Coming Soon
          </h2>
          <p className="mt-4 text-gray-600 max-w-lg mx-auto">
            The full Mulligans browsing experience is on its way. In the
            meantime, download the app to start buying and selling.
          </p>
          <div className="mt-8 flex justify-center gap-6">
            <div className="rounded-lg border border-gray-300 bg-white p-6 text-center w-48">
              <p className="font-semibold text-[#1C4670]">iOS App</p>
              <p className="text-sm text-gray-500 mt-1">Available now</p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-6 text-center w-48">
              <p className="font-semibold text-[#1C4670]">Android App</p>
              <p className="text-sm text-gray-500 mt-1">Coming soon</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
