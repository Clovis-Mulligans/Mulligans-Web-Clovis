'use client';

import React, { useMemo } from 'react';

/**
 * BrandLogoWall
 *
 * Infinite leftward-scrolling strip of brand placeholders.
 * Pure CSS animation, no JS. Respects prefers-reduced-motion.
 *
 * Logos are currently rendered as styled placeholder boxes containing
 * the brand name. To swap in real logos later:
 *   1. Drop SVG/PNG files in apps/web/public/brand-logos/
 *      (filename matches the slug, e.g. "taylormade.svg")
 *   2. Replace the <span className="brand-placeholder"> below with:
 *      <img src={`/brand-logos/${b.slug}.svg`} alt={b.name} />
 *   3. Adjust width/height as needed
 *
 * No backend dependency. No props (could be parameterised later if needed).
 */

interface Brand {
  name: string;
  slug: string;
}

// Hardcoded brand list. Order randomised at module load time, so each
// build produces a deterministic order (changes only on rebuild, not on
// every page navigation — avoids the "carousel jumps around" feeling).
const BRANDS_RAW: Brand[] = [
  { name: 'Titleist', slug: 'titleist' },
  { name: 'TaylorMade', slug: 'taylormade' },
  { name: 'Manors Golf', slug: 'manors-golf' },
  { name: 'Ping', slug: 'ping' },
  { name: 'Callaway', slug: 'callaway' },
  { name: 'L.A.B Golf', slug: 'lab-golf' },
  { name: 'Golden Soul', slug: 'golden-soul' },
  { name: 'J.Lindeberg', slug: 'jlindeberg' },
  { name: 'Srixon', slug: 'srixon' },
  { name: 'Vessel', slug: 'vessel' },
  { name: 'Scotty Cameron', slug: 'scotty-cameron' },
  { name: 'Galvin Green', slug: 'galvin-green' },
  { name: 'Nike', slug: 'nike' },
  { name: 'Puma', slug: 'puma' },
  { name: 'Adidas', slug: 'adidas' },
  { name: 'Mizuno', slug: 'mizuno' },
  { name: 'FootJoy', slug: 'footjoy' },
];

// Fisher–Yates shuffle, deterministic per-module-load
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const BRANDS = shuffle(BRANDS_RAW);

export function BrandLogoWall() {
  // Double the array so the CSS animation can loop seamlessly.
  // The animation translates by 50% (one copy's worth), then resets
  // to 0% — at the reset point the second copy is exactly where the
  // first started, so the user sees no jump.
  const doubled = useMemo(() => [...BRANDS, ...BRANDS], []);

  return (
    <section
      aria-label="Trusted brands on Mulligans"
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E0E0D8',
        borderBottom: '1px solid #E0E0D8',
        padding: '20px 0',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Edge fade overlays — make logos appear/disappear smoothly at the strip's edges */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 80,
          height: '100%',
          background:
            'linear-gradient(to right, #FFFFFF 0%, rgba(255,255,255,0) 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: '100%',
          background:
            'linear-gradient(to left, #FFFFFF 0%, rgba(255,255,255,0) 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      <div className="brand-track">
        {doubled.map((b, i) => (
          <span
            key={`${b.slug}-${i}`}
            className="brand-placeholder"
            aria-label={b.name}
          >
            {b.name}
          </span>
        ))}
      </div>

      <style jsx>{`
        .brand-track {
          display: flex;
          align-items: center;
          gap: 56px;
          width: max-content;
          animation: brand-scroll 50s linear infinite;
          will-change: transform;
        }

        .brand-placeholder {
          flex-shrink: 0;
          font-family: var(--font-sans);
          font-weight: 700;
          font-size: 1.05rem;
          letter-spacing: -0.01em;
          color: #6B6B6B;
          opacity: 0.55;
          padding: 8px 14px;
          border: 1px dashed #C8C8B8;
          border-radius: 8px;
          background-color: #FAFAF5;
          white-space: nowrap;
          user-select: none;
          transition: opacity 200ms ease, color 200ms ease;
        }

        .brand-placeholder:hover {
          opacity: 0.85;
          color: #1C4670;
        }

        @keyframes brand-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        /* Respect users who prefer reduced motion — pause animation,
           show the strip statically. Brands stay visible, just frozen. */
        @media (prefers-reduced-motion: reduce) {
          .brand-track {
            animation: none;
            justify-content: center;
            flex-wrap: wrap;
            width: 100%;
            gap: 24px;
            padding: 0 24px;
          }
        }

        /* Slightly smaller and faster on mobile */
        @media (max-width: 640px) {
          .brand-track {
            gap: 36px;
            animation-duration: 35s;
          }
          .brand-placeholder {
            font-size: 0.9rem;
            padding: 6px 11px;
          }
        }
      `}</style>
    </section>
  );
}
