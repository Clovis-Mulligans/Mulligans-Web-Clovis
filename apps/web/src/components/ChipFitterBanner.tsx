'use client';

import React from 'react';
import Link from 'next/link';

/**
 * ChipFitterBanner
 *
 * Sits above search/category results. Mulligans equivalent of Golfbidder's
 * "Need help to choose?" — drives traffic to Chip, our AI fitting advisor.
 *
 * Pure UI, no state. Designed for reuse across results pages.
 *
 * v2.0 design tokens. Two visual variants:
 *   - 'compact' (default): single-row banner, ~80px tall
 *   - 'spacious': larger CTA, ~120px tall — for top of /search when no query
 */

interface ChipFitterBannerProps {
  variant?: 'compact' | 'spacious';
  href?: string;
  className?: string;
}

export function ChipFitterBanner({
  variant = 'compact',
  href = '/chip',
  className = '',
}: ChipFitterBannerProps) {
  const isSpacious = variant === 'spacious';

  return (
    <Link
      href={href}
      className={`block group ${className}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        className="rounded-2xl overflow-hidden transition-all duration-150 group-hover:shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #1C4670 0%, #2C5A85 50%, #1DC690 130%)',
          padding: isSpacious ? '24px 28px' : '18px 24px',
          boxShadow: '0 4px 14px rgba(28,70,112,0.15), 0 2px 4px rgba(28,70,112,0.08)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Sparkle icon */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: isSpacious ? 44 : 36,
                height: isSpacious ? 44 : 36,
                backgroundColor: 'rgba(29,198,144,0.18)',
                border: '1px solid rgba(29,198,144,0.4)',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={isSpacious ? 22 : 18}
                height={isSpacious ? 22 : 18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1DC690"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v18" />
                <path d="m3 12 18 0" />
                <path d="M19.07 4.93 4.93 19.07" />
                <path d="m4.93 4.93 14.14 14.14" />
              </svg>
            </div>

            {/* Copy */}
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: isSpacious ? '1.05rem' : '0.95rem',
                  color: '#FFFFFF',
                  letterSpacing: '-0.005em',
                  lineHeight: 1.3,
                }}
              >
                Not sure which club is right for your game?
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  fontSize: isSpacious ? '0.9rem' : '0.82rem',
                  color: 'rgba(255,255,255,0.85)',
                  marginTop: 2,
                  lineHeight: 1.4,
                }}
              >
                Chip — our free AI fitting advisor — can match you to the right gear in minutes.
              </p>
            </div>
          </div>

          {/* CTA button */}
          <div
            className="flex-shrink-0 flex items-center gap-1.5 rounded-[10px] transition-colors"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1C4670',
              padding: isSpacious ? '12px 20px' : '10px 16px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: isSpacious ? '0.92rem' : '0.85rem',
              letterSpacing: '0.005em',
            }}
          >
            <span>Talk to Chip</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1C4670"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
