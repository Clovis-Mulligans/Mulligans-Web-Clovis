import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="py-3" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 flex-wrap" style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '0.82rem' }}>
        <li>
          <Link href="/" className="transition-colors hover:text-[#1DC690]" style={{ color: '#6B6B6B' }}>Home</Link>
        </li>
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <li style={{ color: '#ADADAD' }} aria-hidden>›</li>
            <li>
              {item.href ? (
                <Link href={item.href} className="transition-colors hover:text-[#1DC690]" style={{ color: '#6B6B6B' }}>{item.label}</Link>
              ) : (
                <span style={{ color: '#0D0D0D' }}>{item.label}</span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}
