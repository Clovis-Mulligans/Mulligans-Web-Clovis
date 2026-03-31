import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors font-[var(--font-sans)]',
  {
    variants: {
      variant: {
        default: 'bg-[#1DC690] text-white',
        secondary: 'bg-[#278AB0] text-white',
        dark: 'bg-[#1C4670] text-white',
        outline: 'border border-[#1DC690] text-[#1DC690]',
        destructive: 'bg-[#EF4444] text-white',
        warning: 'bg-[#F59E0B] text-white',
        muted: 'bg-gray-100 text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
