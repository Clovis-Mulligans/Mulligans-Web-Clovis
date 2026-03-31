'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ListingForm from '@/components/ListingForm';
import { getListing } from '@mulligans/api-client';
import type { ListingWithImages } from '@mulligans/api-client';

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchListing() {
      try {
        const data = await getListing(id);
        setListing(data);
      } catch {
        setError('Could not load listing. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        {/* Spinner */}
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1DC690"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span
            className="text-[#6B6B6B] text-[0.9rem]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Loading listing...
          </span>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        {/* Error icon */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E53E3E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
        <p
          className="text-[#0D0D0D] text-[1.1rem]"
          style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
        >
          {error || 'Listing not found.'}
        </p>
        <a
          href="/inventory"
          className="text-[#1DC690] text-[0.9rem] hover:underline"
          style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}
        >
          ← Back to Inventory
        </a>
      </div>
    );
  }

  return <ListingForm initialData={listing} isEditing />;
}
