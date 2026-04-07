'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface GalleryImage {
  image_url: string;
  display_order?: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
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

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl text-5xl" style={{ aspectRatio: '1/1', backgroundColor: '#F4F4F0', color: '#ADADAD' }}>
        🏌️
      </div>
    );
  }

  return (
    <>
      {/* Desktop: main + thumbnails */}
      <div className="hidden lg:block">
        <button onClick={() => setLightboxOpen(true)} className="w-full rounded-xl overflow-hidden cursor-zoom-in" style={{ aspectRatio: '1/1', backgroundColor: '#F4F4F0' }}>
          <img src={sorted[activeIndex].image_url} alt={title} className="w-full h-full object-cover" />
        </button>
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

      {/* Mobile: horizontal scroll */}
      <div className="lg:hidden">
        <div className="flex overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {sorted.map((img, i) => (
            <div key={i} className="w-full flex-shrink-0 snap-center" style={{ aspectRatio: '1/1' }}>
              <img src={img.image_url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
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
