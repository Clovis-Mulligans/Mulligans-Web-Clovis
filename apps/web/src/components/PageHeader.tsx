'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 24,
    }}>
      <div>
        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 6px',
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        <div style={{
          width: 40,
          height: 3,
          backgroundColor: '#1DC690',
          borderRadius: 2,
        }} />
        {subtitle && (
          <p style={{
            fontSize: 13,
            color: '#6B7280',
            margin: '8px 0 0',
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0, paddingTop: 4 }}>{action}</div>}
    </div>
  );
}
