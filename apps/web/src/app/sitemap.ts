import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.mulligans.uk.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

const CATEGORIES = [
  'clubs',
  'clothing',
  'shoes',
  'accessories',
  'balls',
  'training-aids',
  'shafts-grips',
  'everything-else',
];

async function fetchActiveListingIds(): Promise<string[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/search/?sortBy=created_at&sortOrder=desc&limit=500`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const listings: { id: string }[] = data.listings || [];
    return listings.map((l) => l.id);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/legal`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/buyer-protection`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/prohibited-items`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/acceptable-use`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((slug) => ({
    url: `${SITE_URL}/category/${slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const listingIds = await fetchActiveListingIds();
  const listingRoutes: MetadataRoute.Sitemap = listingIds.map((id) => ({
    url: `${SITE_URL}/listings/${id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...listingRoutes];
}
