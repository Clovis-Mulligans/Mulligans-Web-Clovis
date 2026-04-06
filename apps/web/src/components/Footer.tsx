import React from 'react';
import Link from 'next/link';

const SHOP_LINKS = [
  { label: 'All Listings', href: '/search' },
  { label: 'Clubs', href: '/category/clubs' },
  { label: 'Clothing', href: '/category/clothing' },
  { label: 'Shoes', href: '/category/shoes' },
  { label: 'Accessories', href: '/category/accessories' },
  { label: 'Balls', href: '/category/balls' },
  { label: 'Training Aids', href: '/category/training-aids' },
];

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Press', href: '/press' },
  { label: 'Blog', href: '/blog' },
];

const SUPPORT_LINKS = [
  { label: 'Help Centre', href: '/help' },
  { label: 'Contact', href: '/contact' },
  { label: 'Feedback', href: '/feedback' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
];

export function Footer() {
  return (
    <footer className="bg-white mt-12" style={{ borderTop: '1px solid #E0E0D8' }}>
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <span className="text-xl font-bold" style={{ color: '#1DC690', fontFamily: 'var(--font-sans)', letterSpacing: '2px' }}>
              MULLIGANS
            </span>
            <p className="mt-3 text-sm" style={{ color: '#6B6B6B', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
              The UK&apos;s golf marketplace. Buy and sell golf equipment with filters no other marketplace offers.
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: '#1DC690', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
              Buyer Protection on every purchase.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#0D0D0D', fontFamily: 'var(--font-sans)' }}>Shop</h3>
            <ul className="mt-3 space-y-2">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-[#1DC690]" style={{ color: '#6B6B6B', fontFamily: 'var(--font-sans)' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#0D0D0D', fontFamily: 'var(--font-sans)' }}>Company</h3>
            <ul className="mt-3 space-y-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-[#1DC690]" style={{ color: '#6B6B6B', fontFamily: 'var(--font-sans)' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#0D0D0D', fontFamily: 'var(--font-sans)' }}>Support</h3>
            <ul className="mt-3 space-y-2">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-[#1DC690]" style={{ color: '#6B6B6B', fontFamily: 'var(--font-sans)' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row" style={{ borderTop: '1px solid #E0E0D8' }}>
          <p className="text-xs" style={{ color: '#ADADAD', fontFamily: 'var(--font-sans)' }}>
            &copy; {new Date().getFullYear()} Mulligans Golf Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
