import type { HTMLAttributes } from 'react';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number | null;
}

export function Progress({ className = '', value = 0, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value ?? 0) ? Number(value) : 0));

  return (
    <div className={`cp-progress ${className}`} {...props}>
      <div className="cp-progress__bar" style={{ width: `${clamped}%` }} />
    </div>
  );
}

