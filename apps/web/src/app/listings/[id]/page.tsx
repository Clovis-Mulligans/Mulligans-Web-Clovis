import React from 'react';

export default function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1C4670]">Listing Detail</h1>
      <p className="mt-4 text-gray-600">
        Listing ID: {params.id}. Full listing detail page with SSR coming in
        Brief 7.
      </p>
    </div>
  );
}
