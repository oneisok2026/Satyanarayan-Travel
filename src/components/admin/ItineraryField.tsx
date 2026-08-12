'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input, Textarea } from '@/components/ui/Field';

/**
 * Day-by-day itinerary editor.
 *
 * The rest of CatalogueForm submits flat FormData fields, which cannot carry
 * an array of objects. Rather than teach the generic form about nesting, this
 * keeps the days in React state and serialises them into one hidden JSON
 * field that CatalogueForm forwards untouched.
 *
 * Days are renumbered from their position on every change, so inserting or
 * removing one cannot leave a gap or a duplicate day number.
 */

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: string[];
  accommodation?: string;
  activities: string[];
}

interface ItineraryFieldProps {
  name: string;
  label: string;
  description?: string;
  defaultValue?: ItineraryDay[];
  error?: string;
  className?: string;
}

/** Blank day appended when the admin adds one. */
function emptyDay(position: number): ItineraryDay {
  return {
    day: position,
    title: '',
    description: '',
    meals: [],
    accommodation: '',
    activities: [],
  };
}

export function ItineraryField({
  name,
  label,
  description,
  defaultValue = [],
  error,
  className,
}: ItineraryFieldProps) {
  const [days, setDays] = useState<ItineraryDay[]>(defaultValue);
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultValue.length > 0 ? 0 : null,
  );

  /** Applies an edit and renumbers, so day numbers always match position. */
  function update(next: ItineraryDay[]) {
    setDays(next.map((day, index) => ({ ...day, day: index + 1 })));
  }

  function patch(index: number, changes: Partial<ItineraryDay>) {
    update(days.map((day, i) => (i === index ? { ...day, ...changes } : day)));
  }

  function addDay() {
    update([...days, emptyDay(days.length + 1)]);
    setOpenIndex(days.length);
  }

  function removeDay(index: number) {
    update(days.filter((_, i) => i !== index));
    setOpenIndex(null);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= days.length) return;

    const next = [...days];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved as ItineraryDay);
    update(next);
    setOpenIndex(target);
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-sm font-medium text-sand-800">{label}</span>
      {description && <p className="text-xs text-sand-500">{description}</p>}

      {/* What CatalogueForm actually submits. */}
      <input type="hidden" name={name} value={JSON.stringify(days)} />

      <div className="flex flex-col gap-2">
        {days.map((day, index) => {
          const open = openIndex === index;

          return (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-sand-300 bg-white"
            >
              <div className="flex items-center gap-2 bg-sand-50 px-3 py-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                  {day.day}
                </span>

                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                  className="min-w-0 flex-1 truncate text-left text-sm font-medium text-sand-800"
                >
                  {day.title || <span className="text-sand-400">Untitled day</span>}
                </button>

                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move day ${day.day} up`}
                  className="rounded px-1.5 py-1 text-xs text-sand-600 hover:bg-sand-200 disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === days.length - 1}
                  aria-label={`Move day ${day.day} down`}
                  className="rounded px-1.5 py-1 text-xs text-sand-600 hover:bg-sand-200 disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeDay(index)}
                  aria-label={`Remove day ${day.day}`}
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>

              {open && (
                <div className="flex flex-col gap-3 p-3">
                  <Input
                    label="Title"
                    value={day.title}
                    onChange={(event) => patch(index, { title: event.target.value })}
                    placeholder="Haridwar arrival"
                  />

                  <Textarea
                    label="Description"
                    rows={3}
                    value={day.description}
                    onChange={(event) =>
                      patch(index, { description: event.target.value })
                    }
                    placeholder="Arrive Haridwar and attend the evening Ganga aarti at Har Ki Pauri."
                  />

                  <Input
                    label="Activities"
                    value={day.activities.join(', ')}
                    onChange={(event) =>
                      patch(index, { activities: splitList(event.target.value) })
                    }
                    description="Comma separated. Shown as tags."
                    placeholder="Ganga aarti, Local market"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Meals"
                      value={day.meals.join(', ')}
                      onChange={(event) =>
                        patch(index, { meals: splitList(event.target.value) })
                      }
                      description="Comma separated."
                      placeholder="Breakfast, Dinner"
                    />
                    <Input
                      label="Stay"
                      value={day.accommodation ?? ''}
                      onChange={(event) =>
                        patch(index, { accommodation: event.target.value })
                      }
                      placeholder="Haridwar"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <button
          type="button"
          onClick={addDay}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-full border border-brand-700 px-4',
            'text-sm font-medium text-brand-800 transition-colors',
            'hover:bg-brand-700 hover:text-white',
          )}
        >
          Add day {days.length + 1}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Splits a comma-separated control into trimmed, non-empty values. */
function splitList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}
