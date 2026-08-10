import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'whatsapp';
type Size = 'sm' | 'md' | 'lg';

const base = cn(
  'inline-flex items-center justify-center gap-2 rounded-full font-medium',
  'transition-[background-color,color,box-shadow,transform] duration-200',
  'ease-[cubic-bezier(0.22,1,0.36,1)]',
  'disabled:pointer-events-none disabled:opacity-55',
  // Micro-interaction: a small lift on hover, pressed state on click.
  'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  'motion-reduce:transform-none motion-reduce:transition-none',
);

const variants: Record<Variant, string> = {
  primary: 'bg-accent-600 text-white shadow-sm hover:bg-accent-700 hover:shadow-md',
  secondary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 hover:shadow-md',
  outline:
    'border border-brand-700 text-brand-800 bg-transparent hover:bg-brand-700 hover:text-white',
  ghost: 'text-brand-800 hover:bg-brand-50',
  danger: 'bg-[--color-danger] text-white hover:opacity-90',
  whatsapp: 'bg-[#25D366] text-white shadow-sm hover:bg-[#1eb955] hover:shadow-md',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-[0.9375rem]',
  lg: 'h-13 px-8 text-base',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

export interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth,
    loading,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export interface ButtonLinkProps extends CommonProps {
  href: string;
  external?: boolean;
  'aria-label'?: string;
}

/** Anchor styled as a button. Use for navigation; use Button for actions. */
export function ButtonLink({
  href,
  external,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = cn(
    base,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className,
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
