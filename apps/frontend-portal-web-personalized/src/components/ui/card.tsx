import type { HTMLAttributes } from 'react';

type DivProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = '', ...props }: DivProps) {
  return <section className={`cp-card ${className}`} {...props} />;
}

export function CardHeader({ className = '', ...props }: DivProps) {
  return <header className={`cp-card__header ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: DivProps) {
  return <div className={`cp-card__body ${className}`} {...props} />;
}

export function CardTitle({
  className = '',
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`cp-title ${className}`} {...props} />;
}

