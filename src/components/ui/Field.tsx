'use client';

import { forwardRef, useId, type ReactNode } from 'react';
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
const controlInvalid = 'border-[--color-danger] focus:border-[--color-danger] focus:ring-[--color-danger]/12';

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
          <span className="ml-0.5 text-[--color-danger]" aria-hidden="true">
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
        <p id={errorId} role="alert" className="text-xs font-medium text-[--color-danger]">
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
          'h-11 cursor-pointer appearance-none pr-10',
          error ? controlInvalid : controlValid,
          // Chevron drawn as a background image to avoid an extra element.
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23807d78' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:1rem] bg-[position:right_1rem_center] bg-no-repeat",
        )}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
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
            'text-accent-600 accent-[--color-accent-600]',
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
        <p id={errorId} role="alert" className="text-xs font-medium text-[--color-danger]">
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
