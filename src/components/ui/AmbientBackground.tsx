import { cn } from '@/lib/utils';

/**
 * Ambient motion layer.
 *
 * Two slow-drifting gradient orbs and a fine grid, in the existing brand and
 * accent tokens — this adds depth without introducing a colour of its own.
 *
 * Deliberately CSS-only. A canvas particle field would cost a render loop and
 * a wake-up every frame on a page whose LCP is a full-bleed image; transforms
 * on two elements stay on the compositor and cost effectively nothing. Both
 * orbs are switched off under prefers-reduced-motion in globals.css.
 */
export function AmbientBackground({
  className,
  /** Renders lighter, for use over a dark photographic backdrop. */
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <span
        className={cn(
          'animate-orb-a absolute -top-24 -left-16 size-[28rem] rounded-full blur-3xl',
          onDark ? 'bg-brand-400/20' : 'bg-brand-300/25',
        )}
      />
      <span
        className={cn(
          'animate-orb-b absolute -right-20 -bottom-28 size-[32rem] rounded-full blur-3xl',
          onDark ? 'bg-accent-400/16' : 'bg-accent-300/20',
        )}
      />

      {/* Fine grid, masked to fade out at the edges so it never reads as a box. */}
      <span
        className={cn(
          'absolute inset-0 opacity-[0.18]',
          '[background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]',
          '[background-size:3.5rem_3.5rem]',
          '[mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]',
          onDark ? 'text-white/10' : 'text-sand-400/25',
        )}
      />
    </div>
  );
}
