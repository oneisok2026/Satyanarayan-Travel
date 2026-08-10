'use client';

import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  id: string;
  title: ReactNode;
  /** Small line beside the title, e.g. "Day 1". */
  label?: string;
  content: ReactNode;
}

interface AccordionProps {
  items: readonly AccordionItem[];
  /** Ids open on first render. */
  defaultOpen?: readonly string[];
  /** Only one panel open at a time. */
  single?: boolean;
  className?: string;
}

/**
 * Accessible accordion used for itineraries and FAQs.
 *
 * Panels stay mounted with `hidden` rather than being removed, so in-page
 * search (Ctrl+F) and crawlers still see itinerary text — important because
 * itinerary content is a meaningful SEO surface on package pages.
 */
export function Accordion({ items, defaultOpen = [], single, className }: AccordionProps) {
  const baseId = useId();
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen));

  function toggle(id: string) {
    setOpen((current) => {
      const next = new Set(single ? [] : current);
      if (current.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={cn('divide-y divide-sand-200 overflow-hidden rounded-2xl bg-white ring-1 ring-sand-200/70', className)}>
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const headerId = `${baseId}-${item.id}-header`;
        const panelId = `${baseId}-${item.id}-panel`;

        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={headerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className={cn(
                  'flex w-full items-center gap-4 px-5 py-4 text-left',
                  'transition-colors duration-200 hover:bg-sand-50',
                )}
              >
                {item.label && (
                  <span
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold',
                      'transition-colors duration-200',
                      isOpen
                        ? 'bg-accent-600 text-white'
                        : 'bg-brand-50 text-brand-800',
                    )}
                  >
                    {item.label}
                  </span>
                )}

                <span className="min-w-0 flex-1 font-medium text-sand-900">
                  {item.title}
                </span>

                <svg
                  aria-hidden="true"
                  className={cn(
                    'size-5 shrink-0 text-sand-500 transition-transform duration-300',
                    'ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                    isOpen && 'rotate-180',
                  )}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              className="px-5 pb-5 text-[0.9375rem] leading-relaxed text-sand-600"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
