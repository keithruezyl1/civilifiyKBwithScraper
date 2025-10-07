import React from 'react';
import { cn } from '../../lib/utils';

type Props = { value: number; className?: string };

export function Progress({ value, className }: Props) {
  const clamped = Math.max(0, Math.min(100, value || 0));
  return (
    <div className={cn('w-full bg-muted rounded-full h-2 overflow-hidden', className)}>
      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}

























































