'use client';

import React from 'react';

interface ExpandableInfoRowProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function ExpandableInfoRow({ icon, label, isOpen, onToggle, children }: ExpandableInfoRowProps) {
  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-lg py-2 px-1 transition-colors hover:bg-[#F4F4F0]"
        style={{ minHeight: '44px' }}
        aria-expanded={isOpen}
      >
        {icon}
        <span className="flex-1 text-left text-sm" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: '#0D0D0D' }}>
          {label}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ADADAD"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: isOpen ? '300px' : '0px', opacity: isOpen ? 1 : 0 }}
      >
        <div className="rounded-lg p-3 mt-1" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E0E0D8', borderRadius: '8px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
