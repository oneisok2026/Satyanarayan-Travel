import { cn } from '@/lib/utils';

interface RatingProps {
  /** 0–5, may be fractional for averages. */
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
}

const sizes = { sm: 'size-3.5', md: 'size-4.5' } as const;

/**
 * Read-only star rating.
 *
 * Partial stars are rendered with a clipped overlay rather than rounding, so a
 * 4.3 average does not display as 4 and overstate/understate the score.
 */
export function Rating({ value, count, size = 'md', className }: RatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const label =
    count != null
      ? `Rated ${clamped.toFixed(1)} out of 5 from ${count} ${count === 1 ? 'review' : 'reviews'}`
      : `Rated ${clamped.toFixed(1)} out of 5`;

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative inline-flex" role="img" aria-label={label}>
        {/* Empty track */}
        <span className="inline-flex gap-0.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={cn(sizes[size], 'text-sand-300')} />
          ))}
        </span>

        {/* Filled overlay, clipped to the exact fraction */}
        <span
          className="absolute inset-0 inline-flex gap-0.5 overflow-hidden"
          style={{ width: `${(clamped / 5) * 100}%` }}
          aria-hidden="true"
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={cn(sizes[size], 'shrink-0 text-amber-400')} />
          ))}
        </span>
      </span>

      {count != null && (
        <span className="text-xs text-sand-500" aria-hidden="true">
          {clamped.toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
