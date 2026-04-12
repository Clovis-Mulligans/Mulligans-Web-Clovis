'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface SimpleModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SimpleModal({ open, onClose, title, children }: SimpleModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 18,
              fontWeight: 700,
              color: '#06070A',
              margin: 0,
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'inline-flex',
              color: '#999',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
