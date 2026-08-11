import Link from 'next/link';

/**
 * Primary "create" action for an admin listing.
 *
 * Rendered only for super_admin, matching the guard on the create page and
 * the API. Hiding it is presentation: both re-check the role server-side, so
 * a hidden button is not an access control.
 */
export function NewItemButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-accent-600 px-6 text-[0.9375rem] font-medium text-white shadow-sm transition-[background-color,box-shadow] hover:bg-accent-700 hover:shadow-md focus-visible:ring-4 focus-visible:ring-brand-500/12 focus-visible:outline-none"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="size-4"
        aria-hidden="true"
      >
        <path d="M10 4v12M4 10h12" />
      </svg>
      {label}
    </Link>
  );
}
