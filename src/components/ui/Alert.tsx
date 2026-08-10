import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'info' | 'success' | 'warning' | 'error';

const styles: Record<Variant, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: 'bg-sky-50 text-sky-900 ring-sky-200',
    icon: <InfoIcon />,
  },
  success: {
    wrapper: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    icon: <CheckIcon />,
  },
  warning: {
    wrapper: 'bg-amber-50 text-amber-900 ring-amber-200',
    icon: <WarnIcon />,
  },
  error: {
    wrapper: 'bg-red-50 text-red-900 ring-red-200',
    icon: <WarnIcon />,
  },
};

interface AlertProps {
  variant?: Variant;
  title?: string;
  className?: string;
  children: ReactNode;
}

export function Alert({ variant = 'info', title, className, children }: AlertProps) {
  const style = styles[variant];
  // Errors interrupt; everything else is announced politely.
  const live = variant === 'error' ? 'assertive' : 'polite';

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={live}
      className={cn(
        'flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset',
        style.wrapper,
        className,
      )}
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        {style.icon}
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5')}>{children}</div>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        strokeLinejoin="round"
      />
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}
