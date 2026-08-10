'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { CategoryDTO, DestinationDTO } from '@/types';

interface PackageFiltersProps {
  destinations: Pick<DestinationDTO, 'id' | 'name' | 'slug'>[];
  categories: Pick<CategoryDTO, 'id' | 'name' | 'slug'>[];
}

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'duration_asc', label: 'Shortest first' },
  { value: 'rating', label: 'Highest rated' },
] as const;

/**
 * Filter bar driven entirely by the URL.
 *
 * State lives in the query string rather than component state, so a filtered
 * view is shareable, survives refresh and back-navigation, and the Server
 * Component re-renders with real data on each change.
 */
export function PackageFilters({ destinations, categories }: PackageFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      // Any filter change resets to the first page.
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const activeCount = ['destination', 'category', 'maxPrice', 'maxNights'].filter((key) =>
    searchParams.get(key),
  ).length;

  const selectClass = cn(
    'h-10 rounded-lg border border-sand-300 bg-white px-3 pr-9 text-sm text-sand-800',
    'transition-colors hover:border-sand-400',
    'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
    "appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23807d78' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:0.9rem] bg-[position:right_0.7rem_center] bg-no-repeat",
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="sr-only" htmlFor="filter-destination">
        Filter by destination
      </label>
      <select
        id="filter-destination"
        className={selectClass}
        value={searchParams.get('destination') ?? ''}
        onChange={(event) => setParam('destination', event.target.value)}
      >
        <option value="">All destinations</option>
        {destinations.map((destination) => (
          <option key={destination.id} value={destination.slug}>
            {destination.name}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="filter-category">
        Filter by trip type
      </label>
      <select
        id="filter-category"
        className={selectClass}
        value={searchParams.get('category') ?? ''}
        onChange={(event) => setParam('category', event.target.value)}
      >
        <option value="">All trip types</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="filter-budget">
        Filter by budget
      </label>
      <select
        id="filter-budget"
        className={selectClass}
        value={searchParams.get('maxPrice') ?? ''}
        onChange={(event) => setParam('maxPrice', event.target.value)}
      >
        <option value="">Any budget</option>
        <option value="20000">Under ₹20,000</option>
        <option value="40000">Under ₹40,000</option>
        <option value="60000">Under ₹60,000</option>
        <option value="100000">Under ₹1,00,000</option>
      </select>

      <label className="sr-only" htmlFor="filter-duration">
        Filter by duration
      </label>
      <select
        id="filter-duration"
        className={selectClass}
        value={searchParams.get('maxNights') ?? ''}
        onChange={(event) => setParam('maxNights', event.target.value)}
      >
        <option value="">Any duration</option>
        <option value="3">Up to 3 nights</option>
        <option value="5">Up to 5 nights</option>
        <option value="7">Up to 7 nights</option>
        <option value="14">Up to 14 nights</option>
      </select>

      <div className="ml-auto flex items-center gap-3">
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => router.push(pathname, { scroll: false })}
            className="text-sm font-medium text-accent-700 underline-offset-4 hover:underline"
          >
            Clear filters ({activeCount})
          </button>
        )}

        <label className="sr-only" htmlFor="filter-sort">
          Sort packages
        </label>
        <select
          id="filter-sort"
          className={selectClass}
          value={searchParams.get('sort') ?? 'newest'}
          onChange={(event) => setParam('sort', event.target.value)}
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
