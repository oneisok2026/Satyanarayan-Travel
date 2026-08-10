import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  id?: string;
  tone?: 'default' | 'muted' | 'brand' | 'dark';
  className?: string;
  containerClassName?: string;
  'aria-labelledby'?: string;
  children: ReactNode;
}

const tones = {
  default: 'bg-sand-50',
  muted: 'bg-white',
  brand: 'bg-brand-50',
  dark: 'bg-brand-900 text-sand-100',
} as const;

export function Section({
  id,
  tone = 'default',
  className,
  containerClassName,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn('py-16 sm:py-20 lg:py-24', tones[tone], className)}
      {...rest}
    >
      <div className={cn('container-page', containerClassName)}>{children}</div>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  /** Heading level — keeps the document outline correct per page. */
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
  invert?: boolean;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  as: Tag = 'h2',
  id,
  invert,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            'inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase',
            invert ? 'text-accent-300' : 'text-accent-600',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-px w-6',
              invert ? 'bg-accent-300/60' : 'bg-accent-500/50',
            )}
          />
          {eyebrow}
        </span>
      )}

      <Tag
        id={id}
        className={cn(
          'text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]',
          invert ? 'text-white' : 'text-sand-900',
        )}
      >
        {title}
      </Tag>

      {description && (
        <p
          className={cn(
            'max-w-2xl text-[0.9375rem] leading-relaxed sm:text-base',
            invert ? 'text-sand-300' : 'text-sand-600',
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
