'use client';

import React from 'react';

/**
 * Hardcoded status config — matches mobile app design system.
 * Do NOT import from @/lib/constants or any external file.
 */
export const ORDER_STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending:         { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  paid:            { bg: '#DCFCE7', color: '#166534', label: 'Paid' },
  to_ship:         { bg: '#FEF3C7', color: '#92400E', label: 'To Ship' },
  in_transit:      { bg: '#DBEAFE', color: '#1E40AF', label: 'Shipped' },
  shipped:         { bg: '#DBEAFE', color: '#1E40AF', label: 'Shipped' },
  delivered:       { bg: '#EDE9FE', color: '#5B21B6', label: 'Delivered' },
  completed:       { bg: '#DCFCE7', color: '#166534', label: 'Completed' },
  cancelled:       { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
  disputed:        { bg: '#FEE2E2', color: '#991B1B', label: 'Disputed' },
  refunded:        { bg: '#F3F4F6', color: '#374151', label: 'Refunded' },
  returned:        { bg: '#F3F4F6', color: '#374151', label: 'Returned' },
  delivery_failed: { bg: '#FEE2E2', color: '#991B1B', label: 'Delivery Failed' },
};

function getStatusConfig(status: string) {
  return ORDER_STATUS_CONFIG[status] ?? {
    bg: '#F3F4F6',
    color: '#374151',
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
  };
}

export default function OrderStatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 20,
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}
