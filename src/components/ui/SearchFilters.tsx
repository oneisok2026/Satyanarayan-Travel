'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface FilterSelect {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

interface SearchFiltersProps {
  placeholder?: string;
  filters?: FilterSelect[];
  className?: string;
}

const DEBOUNCE_MS = 350;

/**
 * URL-driven search and filter bar for admin listings.
 *
 * State lives in the query string so a filtered view is shareable, survives
 * refresh and back-navigation, and lets the Server Component re-query. Search
 * is debounced so typing does not fire a request per keystroke.
 */
export function SearchFilters({
  placeholder = 'Search…',
  filters = [],
  className,
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const debounceRef = useRef<number | null>(null);

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // Any filter change resets to the first page.
      params.delete('page');
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Keep the input in sync when the URL changes from elsewhere (back button).
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
  }, [searchParams]);

  useEffect(() => () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
  }, []);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      pushParams((params) => {
        if (value.trim()) params.set('search', value.trim());
        else params.delete('search');
      });
    }, DEBOUNCE_MS);
  }

  const activeCount = filters.filter((filter) => searchParams.get(filter.name)).length;
  const hasSearch = Boolean(searchParams.get('search'));

  const selectClass = cn(
    'h-10 rounded-lg border border-sand-300 bg-white px-3 text-sm text-sand-800',
    'transition-colors hover:border-sand-400',
    'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
    'select-chevron',
  );

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="relative min-w-56 flex-1">
        <label htmlFor="admin-search" className="sr-only">
          Search
        </label>
        <svg
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sand-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="admin-search"
          type="search"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder={placeholder}
          className={cn(
            'h-10 w-full rounded-lg border border-sand-300 bg-white pl-9 text-sm',
            'text-sand-900 placeholder:text-sand-400 transition-colors hover:border-sand-400',
            'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
          )}
        />
      </div>

      {filters.map((filter) => (
        <div key={filter.name}>
          <label htmlFor={`filter-${filter.name}`} className="sr-only">
            {filter.label}
          </label>
          <select
            id={`filter-${filter.name}`}
            className={selectClass}
            value={searchParams.get(filter.name) ?? ''}
            onChange={(event) =>
              pushParams((params) => {
                if (event.target.value) params.set(filter.name, event.target.value);
                else params.delete(filter.name);
              })
            }
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {(activeCount > 0 || hasSearch) && (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="text-sm font-medium text-accent-700 underline-offset-4 hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
