'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getCartCount } from '@mulligans/api-client';

export function Navbar() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Cart badge polling
  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated) { setCartCount(0); return; }
    try {
      const res = await getCartCount();
      setCartCount(res.count || 0);
    } catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCartCount();
    const interval = setInterval(fetchCartCount, 60000);
    return () => clearInterval(interval);
  }, [fetchCartCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSignOut = () => {
    setShowDropdown(false);
    setCartCount(0);
    signOut();
  };

  const initial = user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
  const cartBadge = cartCount > 9 ? '9+' : cartCount > 0 ? String(cartCount) : null;

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-white transition-shadow duration-150"
        style={{ borderBottom: '1px solid #E0E0D8', boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.1)' : 'none' }}
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* FIX 1: Logo image replacing text span */}
          <Link href="/" className="flex-shrink-0" aria-label="Mulligans Home">
            <img src="https://mulligans-golf-images-mvp.s3.eu-west-2.amazonaws.com/email-assets/Asset+41x+transparent.png" alt="Mulligans" style={{ height: '36px', width: 'auto' }} />
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-[560px] mx-8">
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search golf equipment..." className="w-full rounded-[10px] border py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2" style={{ fontFamily: 'var(--font-sans)', background: '#F4F4F0', borderColor: '#E0E0D8', color: '#0D0D0D', height: '40px' }} onFocus={(e) => { e.target.style.borderColor = '#1DC690'; e.target.style.boxShadow = '0 0 0 3px rgba(29,198,144,0.12)'; }} onBlur={(e) => { e.target.style.borderColor = '#E0E0D8'; e.target.style.boxShadow = 'none'; }} />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Link href="/sell" className="hidden sm:flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-sm font-bold text-white transition-colors hover:opacity-90" style={{ backgroundColor: '#1DC690', fontFamily: 'var(--font-sans)' }}>
  + Sell
</Link>
            <Link href="/favourites" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#F4F4F0] transition-colors" aria-label="Favourites">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </Link>

            {/* Cart with badge */}
            <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#F4F4F0] transition-colors" aria-label="Cart">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              {cartBadge && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white" style={{ backgroundColor: '#E53E3E', minWidth: '16px', height: '16px', fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 700, padding: '0 3px' }}>
                  {cartBadge}
                </span>
              )}
            </Link>

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-[#F4F4F0] animate-pulse" />
            ) : isAuthenticated && user ? (
              <>
                <Link href="/notifications" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#F4F4F0] transition-colors" aria-label="Notifications">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden" style={{ backgroundColor: user.avatar_url ? undefined : '#1DC690' }} aria-label="Account menu">
                    {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{initial}</span>}
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white py-2" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)', border: '1px solid #E0E0D8' }}>
                      <div className="px-4 py-2 border-b" style={{ borderColor: '#E0E0D8' }}>
                        <p className="text-sm font-semibold text-[#0D0D0D]" style={{ fontFamily: 'var(--font-sans)' }}>{user.display_name || 'User'}</p>
                        <p className="text-xs text-[#6B6B6B]">{user.email}</p>
                      </div>
                      {[
                        { label: 'My Profile', href: '/profile' },
                        { label: 'My Orders', href: '/orders' },
                        { label: 'My Offers', href: '/offers' },
                        { label: 'Messages', href: '/messages' },
                        { label: 'Settings', href: '/settings' },
                        { label: 'Sell an Item', href: '/sell' },
                      ].map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-[#0D0D0D] hover:bg-[#F4F4F0] transition-colors" style={{ fontFamily: 'var(--font-sans)' }}>{item.label}</Link>
                      ))}
                      <div className="border-t my-1" style={{ borderColor: '#E0E0D8' }} />
                      <button onClick={handleSignOut} className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#F4F4F0]" style={{ color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>Sign Out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block rounded-[10px] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[#F4F4F0]" style={{ color: '#1C4670', fontFamily: 'var(--font-sans)' }}>Sign In</Link>
                <Link href="/signup" className="hidden sm:block rounded-[10px] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: '#1DC690', fontFamily: 'var(--font-sans)' }}>Sign Up</Link>
              </>
            )}

            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg hover:bg-[#F4F4F0]" aria-label="Menu">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1DC690" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search golf equipment..." className="w-full rounded-[10px] border py-2 pl-9 pr-3 text-sm" style={{ fontFamily: 'var(--font-sans)', background: '#F4F4F0', borderColor: '#E0E0D8', color: '#0D0D0D', height: '40px' }} />
            </div>
          </form>
        </div>
      </header>

      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-72 bg-white p-6 overflow-y-auto" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <button onClick={() => setShowMobileMenu(false)} className="absolute top-4 right-4" aria-label="Close menu">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div className="mt-8 space-y-1">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: user.avatar_url ? undefined : '#1DC690' }}>
                      {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full text-white text-sm font-bold">{initial}</div>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0D0D0D]">{user.display_name || 'User'}</p>
                      <p className="text-xs text-[#6B6B6B]">{user.email}</p>
                    </div>
                  </div>
                  {[
                    { label: 'My Profile', href: '/profile' },
                    { label: 'My Orders', href: '/orders' },
                    { label: 'My Offers', href: '/offers' },
                    { label: 'Messages', href: '/messages' },
                    { label: 'Favourites', href: '/favourites' },
                    { label: 'Notifications', href: '/notifications' },
                    { label: 'Settings', href: '/settings' },
                    { label: 'Sell an Item', href: '/sell' },
                  ].map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)} className="block py-3 text-sm font-medium text-[#0D0D0D] hover:text-[#1DC690] transition-colors" style={{ fontFamily: 'var(--font-sans)', borderBottom: '1px solid #E0E0D8' }}>{item.label}</Link>
                  ))}
                  <button onClick={() => { setShowMobileMenu(false); handleSignOut(); }} className="block w-full py-3 text-left text-sm font-medium transition-colors" style={{ color: '#E53E3E', fontFamily: 'var(--font-sans)' }}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setShowMobileMenu(false)} className="block w-full rounded-[10px] py-3 text-center text-sm font-semibold transition-colors hover:opacity-90" style={{ backgroundColor: '#1DC690', color: '#FFFFFF', fontFamily: 'var(--font-sans)' }}>Sign In</Link>
                  <Link href="/signup" onClick={() => setShowMobileMenu(false)} className="block w-full rounded-[10px] py-3 text-center text-sm font-semibold mt-2 transition-colors" style={{ border: '1.5px solid #1C4670', color: '#1C4670', fontFamily: 'var(--font-sans)' }}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
