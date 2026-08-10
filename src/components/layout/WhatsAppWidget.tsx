'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn, buildWhatsAppUrl } from '@/lib/utils';
import { CONTACT } from '@/constants/navigation';
import { clientEnv } from '@/lib/env';

const GREETING = 'Hi, how can I help you?';
const MAX_MESSAGE = 900;

/** Delay before hover-close, so a diagonal cursor path doesn't dismiss it. */
const CLOSE_DELAY_MS = 250;

/**
 * Floating WhatsApp button with a hover-activated chat panel.
 *
 * Hover opens on pointer-capable devices only. Touch devices get click/tap,
 * since hover there either does not exist or is emulated as a first tap that
 * would otherwise swallow the interaction.
 *
 * The panel composes a message and hands off to WhatsApp — nothing is sent
 * from here, so no message ever reaches our servers.
 */
export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [canHover, setCanHover] = useState(false);

  const closeTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelId = useId();

  // Hover is only wired up where a real pointer exists.
  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  // Escape closes; a click outside closes on touch devices.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  function handleSend() {
    const text = message.trim();
    const url = buildWhatsAppUrl(
      CONTACT.whatsapp,
      text ||
        `Hello ${clientEnv.NEXT_PUBLIC_SITE_NAME}! I'd like to know more about your tour packages.`,
    );
    window.open(url, '_blank', 'noopener,noreferrer');
    setMessage('');
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'no-print floating-action fixed right-4 z-30 flex flex-col items-end gap-3',
        // .floating-action owns the vertical offset and the safe-area inset.
        'lg:right-6',
      )}
      onMouseEnter={canHover ? () => { cancelClose(); setOpen(true); } : undefined}
      onMouseLeave={canHover ? scheduleClose : undefined}
    >
      <div
        id={panelId}
        role="dialog"
        aria-label="Chat with us on WhatsApp"
        // Hidden from AT and the tab order while closed, without unmounting,
        // so the panel can animate both ways.
        inert={!open}
        className={cn(
          'w-[min(20rem,calc(100vw-2rem))] origin-bottom-right overflow-hidden rounded-2xl',
          'bg-white shadow-[--shadow-float] ring-1 ring-sand-900/5',
          'transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'motion-reduce:transition-none',
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0',
        )}
      >
        <div className="flex items-center gap-3 bg-[#0f7a68] px-4 py-3.5">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#25D366] text-white"
          >
            <WhatsAppGlyph className="size-4.5" />
          </span>

          <p className="min-w-0 flex-1 truncate font-semibold text-white">
            Welcome to {clientEnv.NEXT_PUBLIC_SITE_NAME}
          </p>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="grid size-7 shrink-0 place-items-center rounded-md text-white/85 transition-colors hover:bg-white/15 hover:text-white"
          >
            <svg
              className="size-4.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <p className="inline-block max-w-full rounded-xl rounded-tl-sm bg-emerald-50 px-3.5 py-2.5 text-sm text-sand-800">
            {GREETING}
          </p>

          <label htmlFor={`${panelId}-message`} className="sr-only">
            Your message
          </label>
          <textarea
            ref={textareaRef}
            id={`${panelId}-message`}
            rows={3}
            value={message}
            maxLength={MAX_MESSAGE}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends; Shift+Enter keeps a newline.
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className={cn(
              'mt-3 w-full resize-none rounded-xl border border-sand-300 bg-white',
              'px-3.5 py-3 text-sm text-sand-900 placeholder:text-sand-400',
              'transition-[border-color,box-shadow] duration-200',
              'focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/15 focus:outline-none',
            )}
          />

          <button
            type="button"
            onClick={handleSend}
            className={cn(
              'mt-3 flex w-full items-center justify-center gap-2 rounded-xl',
              'bg-[#25D366] px-4 py-3 text-sm font-semibold text-white',
              'transition-[background-color,transform] duration-200',
              'hover:bg-[#1eb955] active:scale-[0.98]',
              'motion-reduce:transform-none motion-reduce:transition-none',
            )}
          >
            Send on WhatsApp
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>

          <p className="mt-2.5 text-center text-[0.6875rem] text-sand-500">
            Opens WhatsApp with your message ready to send.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp'}
        className={cn(
          'grid size-13 place-items-center rounded-full text-white',
          'shadow-[--shadow-float] transition-[background-color,transform] duration-200',
          'hover:scale-105 active:scale-95 motion-reduce:transform-none',
          open ? 'bg-[#0f7a68]' : 'bg-[#25D366]',
        )}
      >
        {/* Both icons stay mounted and cross-fade, so the swap cannot flicker. */}
        <span className="relative grid size-6.5 place-items-center">
          <WhatsAppGlyph
            className={cn(
              'absolute size-6.5 transition-[opacity,transform] duration-200',
              'motion-reduce:transition-none',
              open ? 'scale-75 opacity-0' : 'scale-100 opacity-100',
            )}
          />
          <svg
            className={cn(
              'absolute size-6 transition-[opacity,transform] duration-200',
              'motion-reduce:transition-none',
              open ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </span>
      </button>
    </div>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
    </svg>
  );
}
