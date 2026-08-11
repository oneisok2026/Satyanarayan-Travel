'use client';

import { forwardRef, useId, useState, type ReactNode } from 'react';
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * Accessible form controls.
 *
 * Each control wires label/description/error together with generated ids and
 * `aria-describedby`/`aria-invalid`, so a screen reader announces the error
 * with the field rather than leaving it visually adjacent but unlinked.
 */

const controlBase = cn(
  'w-full rounded-xl border bg-white px-4 text-[0.9375rem] text-sand-900',
  'placeholder:text-sand-400',
  'transition-[border-color,box-shadow] duration-200',
  'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
  'disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-sand-500',
);

const controlValid = 'border-sand-300 hover:border-sand-400';
const controlInvalid = 'border-danger focus:border-danger focus:ring-danger/12';

interface WrapperProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  description?: string;
  descriptionId?: string;
  error?: string;
  errorId?: string;
  className?: string;
  children: ReactNode;
}

function FieldWrapper({
  label,
  htmlFor,
  required,
  description,
  descriptionId,
  error,
  errorId,
  className,
  children,
}: WrapperProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-sand-800">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {description && (
        <p id={descriptionId} className="text-xs text-sand-500">
          {description}
        </p>
      )}

      {children}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Input ---

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, description, error, wrapperClassName, inputClassName, required, id, ...rest },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <FieldWrapper
      label={label}
      htmlFor={inputId}
      required={required}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      className={wrapperClassName}
    >
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(descriptionId, errorId) || undefined}
        className={cn(
          controlBase,
          'h-11',
          error ? controlInvalid : controlValid,
          inputClassName,
        )}
        {...rest}
      />
    </FieldWrapper>
  );
});

// ---------------------------------------------------------- PasswordInput ---

export type PasswordInputProps = Omit<InputProps, 'type'>;

/**
 * Password field with a show/hide toggle.
 *
 * The toggle is a real `<button>`, so it is reachable by keyboard and carries
 * its state via `aria-pressed`. The accessible name stays "Show password"
 * rather than swapping to "Hide password", so the control is announced
 * consistently and its pressed state conveys what is currently visible.
 *
 * Revealing switches the input to `type="text"`, so it is never the default:
 * browsers exclude text inputs from password-manager autofill heuristics.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { label, description, error, wrapperClassName, inputClassName, required, id, ...rest },
    ref,
  ) {
    const [revealed, setRevealed] = useState(false);
    const generated = useId();
    const inputId = id ?? generated;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <FieldWrapper
        label={label}
        htmlFor={inputId}
        required={required}
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
        className={wrapperClassName}
      >
        {/*
          Positioned against the control alone. Anchoring to the field wrapper
          instead would tie the button to a box that also holds the description
          and error, whose heights vary, so it would drift off the input as
          soon as a message appeared.
        */}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={revealed ? 'text' : 'password'}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={cn(descriptionId, errorId) || undefined}
            className={cn(
              controlBase,
              'h-11',
              // Room for the toggle, so a long value never runs under it.
              'pr-11',
              error ? controlInvalid : controlValid,
              inputClassName,
            )}
            {...rest}
          />

          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-pressed={revealed}
            aria-label="Show password"
            title={revealed ? 'Hide password' : 'Show password'}
            className={cn(
              'absolute inset-y-0 right-1 my-auto grid size-9 place-items-center rounded-lg',
              'text-sand-500 transition-colors hover:text-sand-800',
              'focus-visible:ring-4 focus-visible:ring-brand-500/12 focus-visible:outline-none',
            )}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </FieldWrapper>
    );
  },
);

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.4 0 10 7 10 7a15.5 15.5 0 0 1-3.2 4M6.3 7.4A15.6 15.6 0 0 0 2 13s3.6 7 10 7a9.7 9.7 0 0 0 4.2-.9" />
      <path d="M9.9 10.1a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

// --------------------------------------------------------------- Textarea ---

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, description, error, wrapperClassName, required, id, rows = 5, ...rest },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <FieldWrapper
      label={label}
      htmlFor={inputId}
      required={required}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(descriptionId, errorId) || undefined}
        className={cn(
          controlBase,
          'resize-y py-3',
          error ? controlInvalid : controlValid,
        )}
        {...rest}
      />
    </FieldWrapper>
  );
});

// ----------------------------------------------------------------- Select ---

export interface SelectOption {
  value: string;
  label: string;
  /** Optional <optgroup> heading. Consecutive options sharing one are grouped. */
  group?: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'children'> {
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
}

/**
 * Collapses a flat option list into runs sharing a `group`, so callers pass
 * one array and still get <optgroup> headings. Ungrouped options render bare.
 */
function groupOptions(
  options: readonly SelectOption[],
): { group?: string; options: SelectOption[] }[] {
  const runs: { group?: string; options: SelectOption[] }[] = [];

  for (const option of options) {
    const last = runs[runs.length - 1];
    if (last && last.group === option.group) {
      last.options.push(option);
    } else {
      runs.push({ group: option.group, options: [option] });
    }
  }

  return runs;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    options,
    placeholder,
    description,
    error,
    wrapperClassName,
    required,
    id,
    ...rest
  },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <FieldWrapper
      label={label}
      htmlFor={inputId}
      required={required}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      className={wrapperClassName}
    >
      <select
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(descriptionId, errorId) || undefined}
        className={cn(
          controlBase,
          'h-11 cursor-pointer',
          error ? controlInvalid : controlValid,
          // Chevron comes from the shared .select-chevron utility, which also
          // reserves the padding-right the arrow sits in.
          'select-chevron',
        )}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {groupOptions(options).map((entry) =>
          entry.group ? (
            <optgroup key={entry.group} label={entry.group}>
              {entry.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ) : (
            entry.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          ),
        )}
      </select>
    </FieldWrapper>
  );
});

// --------------------------------------------------------------- Checkbox ---

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  label: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, required, id, ...rest },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            'mt-0.5 size-4.5 shrink-0 cursor-pointer rounded border-sand-300',
            'text-accent-600 accent-accent-600',
            'focus-visible:ring-4 focus-visible:ring-brand-500/12',
          )}
          {...rest}
        />
        <label htmlFor={inputId} className="cursor-pointer text-sm text-sand-700">
          {label}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

/**
 * Honeypot field for spam bots. Visually and programmatically hidden from
 * humans; a bot that fills every input trips it and the server rejects.
 */
export function HoneypotField({ name = 'website' }: { name?: string }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor={`hp-${name}`}>Leave this field empty</label>
      <input
        id={`hp-${name}`}
        type="text"
        name={name}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
