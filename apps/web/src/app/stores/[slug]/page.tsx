import React from 'react';

export default function StoreProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1C4670]">Pro Store</h1>
      <p className="mt-4 text-gray-600">
        Store: {params.slug}. Public pro store storefront coming in Brief 5.
      </p>
    </div>
  );
}
