import { cn } from '@/lib/utils';
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from '@/constants';

/**
 * Social profile icons for the top bar.
 *
 * The platform key selects an icon from this fixed map rather than the record
 * carrying markup, so nothing an admin types can become SVG on the page.
 * Outbound links get `rel="noopener noreferrer"`, which stops the target page
 * from reaching back through `window.opener`.
 */

export interface SocialLinkItem {
  id: string;
  platform: SocialPlatform;
  url: string;
  label?: string;
}

export function SocialIcons({
  links,
  className,
}: {
  links: SocialLinkItem[];
  className?: string;
}) {
  if (links.length === 0) return null;

  return (
    <ul className={cn('flex items-center gap-1.5', className)}>
      {links.map((link) => {
        const Icon = ICONS[link.platform];
        const name = link.label?.trim() || SOCIAL_PLATFORM_LABELS[link.platform];

        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              title={name}
              className={cn(
                'grid size-7 place-items-center rounded-full',
                'bg-white/10 text-sand-200 transition-colors',
                'hover:bg-white/20 hover:text-accent-500',
                'focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none',
              )}
            >
              <Icon />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  className: 'size-3.5',
  'aria-hidden': true,
} as const;

const ICONS: Record<SocialPlatform, () => React.ReactElement> = {
  facebook: () => (
    <svg {...iconProps}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  ),
  instagram: () => (
    <svg {...iconProps}>
      <path d="M12 2c-2.72 0-3.06.01-4.12.06-1.07.05-1.8.22-2.43.47a4.9 4.9 0 0 0-1.77 1.15A4.9 4.9 0 0 0 2.53 5.45c-.25.63-.42 1.36-.47 2.43C2.01 8.94 2 9.28 2 12s.01 3.06.06 4.12c.05 1.07.22 1.8.47 2.43a4.9 4.9 0 0 0 1.15 1.77 4.9 4.9 0 0 0 1.77 1.15c.63.25 1.36.42 2.43.47 1.06.05 1.4.06 4.12.06s3.06-.01 4.12-.06c1.07-.05 1.8-.22 2.43-.47a5.1 5.1 0 0 0 2.92-2.92c.25-.63.42-1.36.47-2.43.05-1.06.06-1.4.06-4.12s-.01-3.06-.06-4.12c-.05-1.07-.22-1.8-.47-2.43a4.9 4.9 0 0 0-1.15-1.77 4.9 4.9 0 0 0-1.77-1.15c-.63-.25-1.36-.42-2.43-.47C15.06 2.01 14.72 2 12 2Zm0 1.8c2.67 0 2.99.01 4.04.06.97.05 1.5.21 1.86.35.47.18.8.4 1.15.75.35.35.57.68.75 1.15.14.36.3.89.35 1.86.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.05.97-.21 1.5-.35 1.86-.18.47-.4.8-.75 1.15-.35.35-.68.57-1.15.75-.36.14-.89.3-1.86.35-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-.97-.05-1.5-.21-1.86-.35-.47-.18-.8-.4-1.15-.75-.35-.35-.57-.68-.75-1.15-.14-.36-.3-.89-.35-1.86-.05-1.05-.06-1.37-.06-4.04s.01-2.99.06-4.04c.05-.97.21-1.5.35-1.86.18-.47.4-.8.75-1.15.35-.35.68-.57 1.15-.75.36-.14.89-.3 1.86-.35 1.05-.05 1.37-.06 4.04-.06Zm0 3.07a5.13 5.13 0 1 0 0 10.26 5.13 5.13 0 0 0 0-10.26Zm0 8.46a3.33 3.33 0 1 1 0-6.66 3.33 3.33 0 0 1 0 6.66Zm6.54-8.66a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" />
    </svg>
  ),
  x: () => (
    <svg {...iconProps}>
      <path d="M17.5 3h2.9l-6.3 7.2L21.5 21h-5.8l-4.5-5.9L5.9 21H3l6.7-7.7L2.8 3h5.9l4.1 5.4L17.5 3Zm-1 16.2h1.6L8.1 4.7H6.4l10.1 14.5Z" />
    </svg>
  ),
  youtube: () => (
    <svg {...iconProps}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
    </svg>
  ),
  linkedin: () => (
    <svg {...iconProps}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  ),
  google: () => (
    <svg {...iconProps}>
      <path d="M21.4 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.3a4.5 4.5 0 0 1-2 3v2.4h3.2c1.9-1.7 2.9-4.3 2.9-7.2ZM12 22c2.7 0 4.9-.9 6.5-2.4l-3.2-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.4-4H3.3v2.5A10 10 0 0 0 12 22ZM6.6 14a6 6 0 0 1 0-3.8V7.7H3.3a10 10 0 0 0 0 8.8L6.6 14ZM12 5.8c1.4 0 2.7.5 3.7 1.5l2.8-2.8A10 10 0 0 0 3.3 7.7l3.3 2.5c.7-2.3 2.9-4 5.4-4Z" />
    </svg>
  ),
};
