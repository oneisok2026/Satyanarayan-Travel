import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(
  join(process.cwd(), 'src/components/layout/WhatsAppWidget.tsx'),
  'utf8',
);

/**
 * The widget's container is as wide as the chat panel it reserves space for
 * (~20rem) even while that panel is closed, so an invisible box sat over the
 * bottom-right of every page — swallowing hover and clicks on whatever was
 * beneath it, most visibly the footer's social icons.
 */
describe('WhatsApp widget hit area', () => {
  it('lets pointer events pass through the container', () => {
    const container = source.slice(source.indexOf('ref={containerRef}'));
    expect(container.slice(0, container.indexOf('>'))).toContain('pointer-events-none');
  });

  it('keeps the button itself clickable', () => {
    // Everything under a pointer-events-none parent must opt back in.
    expect(source).toContain(
      "'pointer-events-auto grid size-13 place-items-center rounded-full text-white'",
    );
  });

  it('makes the panel interactive only while it is open', () => {
    expect(source).toContain("'pointer-events-auto translate-y-0 scale-100 opacity-100'");
    expect(source).toContain("'pointer-events-none translate-y-2 scale-95 opacity-0'");
  });

  it('still opens on hovering the button, not the empty container', () => {
    // Regression guard for the earlier fix: opening from the container would
    // trigger on blank screen above the button.
    const container = source.slice(source.indexOf('ref={containerRef}'));
    expect(container.slice(0, container.indexOf('>'))).toContain(
      'onMouseEnter={canHover ? cancelClose : undefined}',
    );
    // The button's own onMouseEnter is what opens it.
    const button = source.slice(
      source.indexOf("onClick={() => setOpen((current) => !current)}"),
    );
    expect(button.slice(0, button.indexOf('aria-expanded'))).toContain('setOpen(true)');
  });
});
