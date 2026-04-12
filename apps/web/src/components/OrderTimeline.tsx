'use client';

import React from 'react';
import type { OrderDetail } from '@mulligans/api-client';

interface TimelineStep {
  label: string;
  timestamp: string | null;
  completed: boolean;
  detail?: string | null;
  colour?: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildSteps(order: OrderDetail): TimelineStep[] {
  const status = order.status;

  if (status === 'cancelled') {
    return [
      { label: 'Order placed', timestamp: order.created_at, completed: true },
      {
        label: 'Cancelled',
        timestamp: order.cancelled_at,
        completed: true,
        detail: order.cancel_reason,
        colour: '#991B1B',
      },
    ];
  }

  const orderedStep: TimelineStep = {
    label: 'Order placed',
    timestamp: order.created_at,
    completed: true,
  };

  const paidStep: TimelineStep = {
    label: 'Payment confirmed',
    timestamp: order.paid_at,
    completed: !!order.paid_at,
  };

  const shippedStep: TimelineStep = {
    label: 'Shipped',
    timestamp: order.shipped_at,
    completed: !!order.shipped_at,
    detail:
      order.tracking_number && order.carrier
        ? `${order.carrier} — ${order.tracking_number}`
        : order.tracking_number || null,
  };

  const deliveredStep: TimelineStep = {
    label: 'Delivered',
    timestamp: order.delivered_at,
    completed: !!order.delivered_at,
  };

  const completedStep: TimelineStep = {
    label: 'Completed — escrow released',
    timestamp: order.completed_at || order.escrow_release_at,
    completed: !!order.completed_at || !!order.escrow_release_at,
  };

  const steps = [orderedStep, paidStep, shippedStep, deliveredStep, completedStep];

  if (status === 'disputed') {
    const disputeStep: TimelineStep = {
      label: 'Disputed',
      timestamp: order.dispute?.created_at || null,
      completed: true,
      detail: order.dispute?.reason_type?.replace(/_/g, ' ') || order.dispute_reason,
      colour: '#92400E',
    };
    // Insert dispute after last completed step
    const lastCompleted = steps.reduce(
      (last, s, i) => (s.completed ? i : last),
      0
    );
    steps.splice(lastCompleted + 1, 0, disputeStep);
  }

  return steps;
}

export default function OrderTimeline({ order }: { order: OrderDetail }) {
  const steps = buildSteps(order);

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        border: '1px solid #e8e8e4',
        padding: 20,
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          fontWeight: 700,
          color: '#06070A',
          margin: '0 0 18px',
        }}
      >
        Order timeline
      </h3>

      <div style={{ position: 'relative' }}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const dotColour = step.colour
            ? step.colour
            : step.completed
              ? '#1DC690'
              : '#e0e0e0';
          const lineColour = step.completed ? '#1DC690' : '#e0e0e0';
          const lineStyle = step.completed ? 'solid' : 'dashed';

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: 14,
                position: 'relative',
                paddingBottom: isLast ? 0 : 24,
              }}
            >
              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    position: 'absolute',
                    left: 7,
                    top: 18,
                    bottom: 0,
                    width: 2,
                    borderLeft: `2px ${lineStyle} ${lineColour}`,
                  }}
                />
              )}

              {/* Dot */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: dotColour,
                  flexShrink: 0,
                  marginTop: 1,
                  zIndex: 1,
                }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: step.completed ? '#06070A' : '#aaa',
                  }}
                >
                  {step.label}
                </div>
                {step.timestamp && (
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                      color: '#aaa',
                      marginTop: 2,
                    }}
                  >
                    {formatDate(step.timestamp)}
                  </div>
                )}
                {step.detail && (
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                      color: '#666',
                      marginTop: 3,
                    }}
                  >
                    {step.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
