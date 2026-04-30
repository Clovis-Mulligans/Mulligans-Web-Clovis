'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CATEGORIES = [
  { label: 'All', slug: '' },
  { label: 'Clubs', slug: 'clubs' },
  { label: 'Clothing', slug: 'clothing' },
  { label: 'Shoes', slug: 'shoes' },
  { label: 'Accessories', slug: 'accessories' },
  { label: 'Balls', slug: 'balls' },
  { label: 'Training Aids', slug: 'training-aids' },
  { label: 'Shafts & Grips', slug: 'shafts-grips' },
];

export function CategoryNav() {
  const pathname = usePathname();

  const activeSlug = pathname.startsWith('/category/')
    ? pathname.split('/category/')[1]?.split('/')[0] || ''
    : '';

  return (
    <nav
      className="bg-white overflow-x-auto"
      style={{ borderBottom: '1px solid #E0E0D8', scrollbarWidth: 'none' }}
    >
      <div className="mx-auto flex h-12 max-w-[1280px] items-center gap-1 px-4 sm:px-6 lg:px-8">
        {CATEGORIES.map((cat) => {
          const isActive = cat.slug === activeSlug || (cat.slug === '' && pathname === '/');
          const href = cat.slug ? `/category/${cat.slug}` : '/';
          return (
            <Link
              key={cat.slug}
              href={href}
              className="flex-shrink-0 px-3 py-3 transition-colors relative"
              style={{
                fontFamily: 'var(--font-sans)',
                color: isActive ? '#1DC690' : '#06070A',
                fontWeight: isActive ? 700 : 600,
                fontSize: '16px',
                letterSpacing: '-0.005em',
              }}
            >
              {cat.label}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5" style={{ backgroundColor: '#1DC690' }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}