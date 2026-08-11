import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  as?: 'div' | 'article' | 'li';
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}

/** Surface container. `interactive` adds the hover lift used by content cards. */
export function Card({
  as: Tag = 'div',
  interactive,
  className,
  children,
}: CardProps) {
  return (
    <Tag
      className={cn(
        'overflow-hidden rounded-2xl bg-white shadow-[--shadow-card]',
        'ring-1 ring-accent-600/25',
        interactive && [
          'transition-[box-shadow,transform] duration-300',
          'ease-[cubic-bezier(0.22,1,0.36,1)]',
          'hover:-translate-y-1 hover:shadow-[--shadow-card-hover] hover:ring-accent-600/60',
          'motion-reduce:transform-none motion-reduce:transition-none',
        ],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('border-t border-sand-200/70 px-5 py-4', className)}>
      {children}
    </div>
  );
}
