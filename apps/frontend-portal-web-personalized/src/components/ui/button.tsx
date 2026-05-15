import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'outline' | 'destructive';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  className = '',
  variant = 'default',
  ...props
}: ButtonProps) {
  const base = 'cp-btn';
  const variantClass =
    variant === 'outline'
      ? 'cp-btn--outline'
      : // Treat destructive like primary for now
        'cp-btn--primary';

  return (
    <button
      type={props.type ?? 'button'}
      className={`${base} ${variantClass} ${className}`}
      {...props}
    />
  );
}

