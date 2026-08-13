import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const menuSource = readFileSync(
  join(process.cwd(), 'src/components/layout/MobileMenu.tsx'),
  'utf8',
);
const headerSource = readFileSync(
  join(process.cwd(), 'src/components/layout/Header.tsx'),
  'utf8',
);
const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

/**
 * On phones the open navigation panel shared the screen with the sticky
 * header and the two fixed floating buttons. The panel's footer CTAs were
 * pushed under the browser chrome and overlapped by the WhatsApp and
 * back-to-top buttons, so the layering is asserted here.
 */
describe('mobile navigation layering', () => {
  it('stacks the panel above the sticky header', () => {
    // Both are fixed/sticky, so paint order is decided by z-index alone.
    const panelZ = /fixed inset-0 z-(\d+)/.exec(menuSource)?.[1];
    const headerZ = /sticky top-0 z-(\d+)/.exec(headerSource)?.[1];

    expect(panelZ).toBeDefined();
    expect(headerZ).toBeDefined();
    expect(Number(panelZ)).toBeGreaterThan(Number(headerZ));
  });

  it('keeps the panel within the visual viewport', () => {
    // max-h-dvh tracks the *visible* viewport, so a phone's collapsing
    // address bar cannot push the footer CTAs out of reach.
    expect(menuSource).toContain('max-h-dvh');
  });

  it('insets the panel from the notch and the home indicator', () => {
    expect(menuSource).toContain('pt-[env(safe-area-inset-top)]');
    expect(menuSource).toContain('pb-[env(safe-area-inset-bottom)]');
  });

  it('scrolls only the nav list, keeping header and footer pinned', () => {
    // Without min-h-0 a long nav list pushes the flex footer off the panel.
    expect(menuSource).toContain('min-h-0 flex-1 overflow-y-auto');
    expect(menuSource).toMatch(/shrink-0 border-t border-sand-200 p-4/);
    expect(menuSource).toMatch(/h-16 shrink-0 items-center/);
  });

  it('hides the floating buttons while the panel is open', () => {
    // They sit at z-30, below the panel but still over the page, and land on
    // the panel's footer CTAs on narrow screens.
    expect(menuSource).toContain("document.documentElement.dataset.menuOpen = 'true'");
    expect(menuSource).toContain('delete document.documentElement.dataset.menuOpen');
    expect(css).toMatch(
      /html\[data-menu-open\] \.floating-action \{\s*visibility: hidden;/,
    );
  });

  it('clears the open marker when the panel closes', () => {
    // The marker is set and removed inside the same effect, so a close, an
    // unmount, or a route change all restore the buttons.
    const effect = menuSource.slice(
      menuSource.indexOf('if (!open) return;'),
      menuSource.indexOf('}, [open, onClose]);'),
    );
    expect(effect).toContain('dataset.menuOpen');
    expect(effect).toContain('delete document.documentElement.dataset.menuOpen');
  });
});
