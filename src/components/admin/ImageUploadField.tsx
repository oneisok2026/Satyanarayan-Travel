'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { UPLOAD_LIMITS } from '@/constants';

/**
 * Image picker for the catalogue editors.
 *
 * The stored value is still a URL, so this is a superset of the plain URL
 * field it replaces: an admin can upload from their device, or paste a link
 * from a stock library, and existing records keep working untouched. The
 * hidden input named `name` is what CatalogueForm reads on submit, which
 * keeps the surrounding FormData-based form unchanged.
 *
 * Client-side size and type checks here are courtesy only — they give instant
 * feedback and save a pointless round trip. The server re-validates every
 * upload from the file's magic bytes and is the only thing that decides.
 */

interface ImageUploadFieldProps {
  /** Form field name; the resolved URL is submitted under this. */
  name: string;
  label: string;
  folder: string;
  defaultValue?: string;
  required?: boolean;
  description?: string;
  error?: string;
  className?: string;
}

const MAX_MB = Math.round(UPLOAD_LIMITS.maxImageBytes / 1024 / 1024);
const ACCEPT = UPLOAD_LIMITS.allowedImageTypes.join(',');

export function ImageUploadField({
  name,
  label,
  folder,
  defaultValue = '',
  required,
  description,
  error,
  className,
}: ImageUploadFieldProps) {
  const generatedId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Guards against a slow upload resolving after a newer one started. */
  const requestRef = useRef(0);

  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const urlFieldId = `${generatedId}-url`;
  const errorId = error || uploadError ? `${generatedId}-error` : undefined;
  const descriptionId = description ? `${generatedId}-description` : undefined;

  useEffect(() => {
    setPreviewFailed(false);
  }, [url]);

  const upload = useCallback(
    async (file: File) => {
      setUploadError(null);

      if (!UPLOAD_LIMITS.allowedImageTypes.includes(file.type as never)) {
        setUploadError('Choose a JPEG, PNG, WebP or AVIF image.');
        return;
      }
      if (file.size > UPLOAD_LIMITS.maxImageBytes) {
        setUploadError(`That image is larger than ${MAX_MB} MB. Please compress it first.`);
        return;
      }

      const ticket = requestRef.current + 1;
      requestRef.current = ticket;
      setUploading(true);

      const body = new FormData();
      body.append('file', file);
      body.append('folder', folder);

      try {
        const response = await fetch('/api/admin/uploads', {
          method: 'POST',
          credentials: 'same-origin',
          body,
        });
        const payload = await response.json().catch(() => null);

        // A newer upload started while this one was in flight — discard it.
        if (requestRef.current !== ticket) return;

        if (!response.ok || !payload?.success) {
          setUploadError(payload?.error?.message ?? 'The upload failed. Please try again.');
          return;
        }

        setUrl(payload.data.url as string);
      } catch {
        if (requestRef.current !== ticket) return;
        setUploadError('Network problem. Please check your connection and try again.');
      } finally {
        if (requestRef.current === ticket) setUploading(false);
      }
    },
    [folder],
  );

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  const shownError = uploadError ?? error;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-sm font-medium text-sand-800">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </span>

      {description && (
        <p id={descriptionId} className="text-xs text-sand-500">
          {description}
        </p>
      )}

      {/* The value CatalogueForm actually submits. */}
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden',
            'rounded-xl border border-dashed transition-colors sm:w-56',
            dragging ? 'border-brand-500 bg-brand-50' : 'border-sand-300 bg-sand-50',
          )}
        >
          {url && !previewFailed ? (
            <Image
              src={url}
              alt=""
              fill
              sizes="224px"
              className="object-cover"
              // Remote hosts outside next.config remotePatterns would throw;
              // falling back to a message keeps the editor usable either way.
              onError={() => setPreviewFailed(true)}
              // Same-origin GridFS images are already served with immutable
              // caching, so let the optimizer handle them; unknown remote
              // hosts bypass it rather than throwing.
              unoptimized={!url.startsWith('/api/images/') && !url.startsWith('https://')}
            />
          ) : (
            <p className="px-3 text-center text-xs text-sand-500">
              {uploading
                ? 'Uploading…'
                : previewFailed
                  ? 'Preview unavailable'
                  : 'Drag an image here, or choose a file'}
            </p>
          )}

          {uploading && url && (
            <div className="absolute inset-0 grid place-items-center bg-white/70 text-xs font-medium text-sand-700">
              Uploading…
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              // Reset first so choosing the same file twice still fires change.
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void upload(file);
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-full border border-brand-700 px-4',
                'text-sm font-medium text-brand-800 transition-colors',
                'hover:bg-brand-700 hover:text-white',
                'disabled:pointer-events-none disabled:opacity-55',
              )}
            >
              {uploading ? 'Uploading…' : url ? 'Replace image' : 'Upload image'}
            </button>

            {url && !uploading && (
              <button
                type="button"
                onClick={() => {
                  setUrl('');
                  setUploadError(null);
                }}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          <label htmlFor={urlFieldId} className="text-xs text-sand-500">
            Or paste an image URL
          </label>
          <input
            id={urlFieldId}
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setUploadError(null);
            }}
            placeholder="https://…"
            aria-invalid={shownError ? true : undefined}
            aria-describedby={cn(descriptionId, errorId) || undefined}
            className={cn(
              'h-11 w-full rounded-xl border bg-white px-4 text-[0.9375rem] text-sand-900',
              'placeholder:text-sand-400 transition-[border-color,box-shadow] duration-200',
              'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
              shownError
                ? 'border-danger focus:border-danger'
                : 'border-sand-300 hover:border-sand-400',
            )}
          />

          <p className="text-xs text-sand-500">
            JPEG, PNG, WebP or AVIF, up to {MAX_MB} MB.
          </p>
        </div>
      </div>

      {shownError && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {shownError}
        </p>
      )}
    </div>
  );
}
