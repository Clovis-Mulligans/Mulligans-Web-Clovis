'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface GalleryImage {
  image_url: string;
  display_order?: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  title: string;
  showFavourite?: boolean;
  isFavourited?: boolean;
  onFavouriteClick?: () => void;
}

export function ImageGallery({ images, title, showFavourite = false, isFavourited = false, onFavouriteClick }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') setLightboxOpen(false);
    if (e.key === 'ArrowLeft') setActiveIndex((i) => (i > 0 ? i - 1 : sorted.length - 1));
    if (e.key === 'ArrowRight') setActiveIndex((i) => (i < sorted.length - 1 ? i + 1 : 0));
  }, [lightboxOpen, sorted.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const favouriteButton = showFavourite && onFavouriteClick ? (
    <button
      onClick={(e) => { e.stopPropagation(); onFavouriteClick(); }}
      className="absolute bottom-3 right-3 z-10 flex items-center justify-center rounded-full"
      style={{ width: '40px', height: '40px', backgroundColor: 'rgba(0,0,0,0.45)' }}
      aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isFavourited ? '#1DC690' : 'none'} stroke={isFavourited ? '#1DC690' : '#FFFFFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    </button>
  ) : null;

  {/* FIX 1: aspect ratio changed from 4/3 to 3/4 */}
  if (sorted.length === 0) {
    return (
      <div className="relative flex items-center justify-center rounded-xl text-5xl" style={{ aspectRatio: '3/4', backgroundColor: '#F4F4F0', color: '#ADADAD' }}>
        🏌️
        {favouriteButton}
      </div>
    );
  }

  return (
    <>
      {/* Desktop: main + thumbnails */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* FIX 1: aspect ratio 3/4 */}
          <button onClick={() => setLightboxOpen(true)} className="w-full rounded-xl overflow-hidden cursor-zoom-in" style={{ aspectRatio: '3/4', backgroundColor: '#F4F4F0' }}>
            <img src={sorted[activeIndex].image_url} alt={title} className="w-full h-full object-cover" />
          </button>
          {favouriteButton}

          {/* FIX 2: Navigation arrows on desktop */}
          {sorted.length > 1 && (
            <>
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full transition-colors"
                style={{ width: '40px', height: '40px', backgroundColor: 'rgba(0,0,0,0.45)' }}
                onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => i > 0 ? i - 1 : sorted.length - 1); }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.65)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.45)'; }}
                aria-label="Previous image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full transition-colors"
                style={{ width: '40px', height: '40px', backgroundColor: 'rgba(0,0,0,0.45)' }}
                onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => i < sorted.length - 1 ? i + 1 : 0); }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.65)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.45)'; }}
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </>
          )}
        </div>
        {sorted.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {sorted.slice(0, 6).map((img, i) => (
              <button key={i} onClick={() => setActiveIndex(i)} className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: '64px', height: '64px', border: i === activeIndex ? '2px solid #1DC690' : '2px solid transparent' }}>
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: horizontal scroll — no arrows (has native scroll) */}
      <div className="lg:hidden">
        <div className="relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {sorted.map((img, i) => (
              /* FIX 1: aspect ratio 3/4 */
              <div key={i} className="w-full flex-shrink-0 snap-center" style={{ aspectRatio: '3/4' }}>
                <img src={img.image_url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {favouriteButton}
        </div>
        {sorted.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {sorted.map((_, i) => (
              <div key={i} className="rounded-full" style={{ width: '8px', height: '8px', backgroundColor: i === activeIndex ? '#1DC690' : '#E0E0D8' }} />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setLightboxOpen(false)} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          {sorted.length > 1 && (
            <>
              <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i > 0 ? i - 1 : sorted.length - 1)); }} aria-label="Previous">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i < sorted.length - 1 ? i + 1 : 0)); }} aria-label="Next">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </>
          )}

          <img src={sorted[activeIndex].image_url} alt={title} className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />

          {sorted.length > 1 && (
            <div className="absolute bottom-6 text-white text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
              {activeIndex + 1} / {sorted.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
