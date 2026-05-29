import React from 'react';
import Link from 'next/link';

const LEGAL_PAGES = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Buyer Protection', href: '/buyer-protection' },
  { label: 'Prohibited Items', href: '/prohibited-items' },
  { label: 'Acceptable Use', href: '/acceptable-use' },
];

interface LegalPageLayoutProps {
  title: string;
  effectiveDate: string;
  lastUpdated: string;
  currentPath: string;
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  effectiveDate,
  lastUpdated,
  currentPath,
  children,
}: LegalPageLayoutProps) {
  const otherPages = LEGAL_PAGES.filter((p) => p.href !== currentPath);

  return (
    <article className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
      <header className="mb-8 border-b pb-6" style={{ borderColor: '#E5E7EB' }}>
        <h1
          className="text-2xl font-bold sm:text-3xl"
          style={{ fontFamily: 'var(--font-sans)', color: '#06070A' }}
        >
          {title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: '#6B7280', fontFamily: 'var(--font-sans)' }}>
          <span>Effective date: {effectiveDate}</span>
          <span>Last updated: {lastUpdated}</span>
        </div>
      </header>

      <div
        className="legal-content prose prose-sm max-w-none sm:prose-base"
        style={{ fontFamily: 'var(--font-sans)', color: '#374151' }}
      >
        {children}
      </div>

      <footer className="mt-12 border-t pt-8" style={{ borderColor: '#E5E7EB' }}>
        <div className="mb-6">
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wide"
            style={{ color: '#06070A', fontFamily: 'var(--font-sans)' }}
          >
            Related Policies
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {otherPages.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className="text-sm underline-offset-2 transition-colors hover:underline"
                  style={{ color: '#1DC690', fontFamily: 'var(--font-sans)' }}
                >
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-lg p-4 text-xs leading-relaxed"
          style={{ backgroundColor: '#F9FAFB', color: '#6B7280', fontFamily: 'var(--font-sans)' }}
        >
          <p className="font-semibold" style={{ color: '#374151' }}>
            Mulligans Golf Limited
          </p>
          <p>Company No. 16647100</p>
          <p>Registered office: Flat 1 Sunrise House, 79J Riddlesdown Road, Purley, England, CR8 1DH</p>
          <p className="mt-2">
            Contact:{' '}
            <a
              href="mailto:info@mulligans.uk.com"
              className="underline underline-offset-2 transition-colors hover:text-[#1DC690]"
            >
              info@mulligans.uk.com
            </a>
          </p>
        </div>
      </footer>

      <style>{`
        .legal-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #06070A;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #E5E7EB;
        }
        .legal-content h2:first-child {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }
        .legal-content h3 {
          font-size: 1.05rem;
          font-weight: 600;
          color: #1C4670;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .legal-content p {
          margin-bottom: 0.75rem;
          line-height: 1.7;
        }
        .legal-content ul, .legal-content ol {
          margin-bottom: 0.75rem;
          padding-left: 1.5rem;
        }
        .legal-content li {
          margin-bottom: 0.35rem;
          line-height: 1.6;
        }
        .legal-content a {
          color: #1DC690;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .legal-content a:hover {
          color: #178F68;
        }
        .legal-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .legal-content th, .legal-content td {
          border: 1px solid #E5E7EB;
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .legal-content th {
          background-color: #F9FAFB;
          font-weight: 600;
          color: #06070A;
        }
        .legal-content strong {
          font-weight: 600;
          color: #06070A;
        }
        @media (max-width: 640px) {
          .legal-content h2 {
            font-size: 1.1rem;
          }
          .legal-content h3 {
            font-size: 0.95rem;
          }
          .legal-content table {
            font-size: 0.8rem;
          }
          .legal-content th, .legal-content td {
            padding: 0.375rem 0.5rem;
          }
        }
      `}</style>
    </article>
  );
}
