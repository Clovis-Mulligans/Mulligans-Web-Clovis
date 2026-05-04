import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const SELL_LINKS = [
  { label: 'How it works', href: '/sell/how-it-works' },
  { label: 'Seller guide', href: '/sell/guide' },
  { label: 'Pro shops', href: '/sell/pro-shops' },
];

const SUPPORT_LINKS = [
  { label: 'Help centre', href: '/support/help' },
  { label: 'Contact', href: '/support/contact' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Privacy', href: '/legal/privacy' },
];

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/mulligansgolfmarket/',
    active: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61586040098321',
    active: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: '#',
    active: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="mt-16" style={{ backgroundColor: '#EAEAE0', borderTop: '1px solid #D0D0C8' }}>
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          
          {/* Brand */}
          <div>
            <span 
              className="text-2xl font-bold tracking-wider" 
              style={{ color: '#1DC690', fontFamily: 'var(--font-sans)' }}
            >
              MULLIGANS
            </span>
            <p 
              className="mt-4 text-base font-medium" 
              style={{ color: '#06070A', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}
            >
              Buy Smart. Sell Easy. Play Better.
            </p>
            <p 
              className="mt-4 flex items-center gap-2 text-sm" 
              style={{ color: '#1DC690', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#1DC690" strokeWidth="1.5"/>
                <path d="M5 8l2 2 4-4" stroke="#1DC690" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Buyer Protection on every purchase
            </p>
          </div>

          {/* Sell */}
          <div>
            <h3 
              className="text-sm font-semibold uppercase tracking-wide" 
              style={{ color: '#06070A', fontFamily: 'var(--font-sans)' }}
            >
              Sell
            </h3>
            <ul className="mt-4 space-y-3">
              {SELL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-sm transition-colors hover:text-[#1DC690]" 
                    style={{ color: '#555555', fontFamily: 'var(--font-sans)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 
              className="text-sm font-semibold uppercase tracking-wide" 
              style={{ color: '#06070A', fontFamily: 'var(--font-sans)' }}
            >
              Support
            </h3>
            <ul className="mt-4 space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-sm transition-colors hover:text-[#1DC690]" 
                    style={{ color: '#555555', fontFamily: 'var(--font-sans)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get the app */}
          <div>
            <h3 
              className="text-sm font-semibold uppercase tracking-wide" 
              style={{ color: '#06070A', fontFamily: 'var(--font-sans)' }}
            >
              Get the app
            </h3>
            <div className="mt-4 flex gap-5">
              {/* QR Code */}
              <a 
                href="https://linktr.ee/MulligansGolf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-shrink-0 transition-transform hover:scale-105"
              >
                <div 
                  className="rounded-xl p-3" 
                  style={{ 
                    backgroundColor: '#FFFFFF', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <Image
                    src="/images/qr-code-linktree.png"
                    alt="Scan to download Mulligans app"
                    width={88}
                    height={88}
                    className="rounded-lg"
                    style={{ filter: 'invert(1)' }}
                  />
                </div>
              </a>
              
              {/* Store badges */}
              <div className="flex flex-col justify-center gap-3">
                <p 
                  className="text-xs font-medium" 
                  style={{ color: '#666666', fontFamily: 'var(--font-sans)' }}
                >
                  Scan to download
                </p>
                <a
                  href="https://apps.apple.com/app/mulligans-golf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#06070A', color: '#FFFFFF', fontFamily: 'var(--font-sans)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.mulligans.golf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#06070A', color: '#FFFFFF', fontFamily: 'var(--font-sans)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  Google Play
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div 
          className="mt-14 flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row" 
          style={{ borderTop: '1px solid #C8C8C0' }}
        >
          <p 
            className="text-sm" 
            style={{ color: '#777777', fontFamily: 'var(--font-sans)' }}
          >
            &copy; {new Date().getFullYear()} Mulligans Golf Limited. All rights reserved.
          </p>
          
          {/* Social links */}
          <div className="flex items-center gap-6">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.active ? social.label : `${social.label} (coming soon)`}
                className="transition-all hover:text-[#1DC690] hover:scale-110"
                style={{ 
                  color: '#555555', 
                  opacity: social.active ? 1 : 0.4,
                  pointerEvents: social.active ? 'auto' : 'none'
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}