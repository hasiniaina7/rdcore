import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className = '',
  variant = 'default',
  ...props
}: BadgeProps) {
  const base = 'cp-badge';
  let variantClass = 'cp-badge--info';

  if (variant === 'secondary') {
    variantClass = 'cp-badge--muted';
  } else if (variant === 'outline') {
    variantClass = 'cp-badge--muted';
  }

  return <span className={`${base} ${variantClass} ${className}`} {...props} />;
}

