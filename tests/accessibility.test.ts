import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Accessibility audit (PART 26).
 *
 * Static checks over the source tree. These catch the regressions that are
 * easy to introduce and invisible in review — an icon button without a label,
 * an animation that ignores reduced motion — rather than replacing a manual
 * screen-reader pass.
 */

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.tsx$/.test(entry)) files.push(path);
  }
  return files;
}

const componentFiles = walk(SRC);
const read = (file: string) => readFileSync(file, 'utf8');
const relative = (file: string) => file.replace(ROOT, '').replace(/\\/g, '/');

describe('reduced motion', () => {
  it('globals.css disables animation and transition wholesale', () => {
    const css = readFileSync(join(SRC, 'app/globals.css'), 'utf8');

    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it('scroll-revealed content stays visible when motion is reduced', () => {
    const css = readFileSync(join(SRC, 'app/globals.css'), 'utf8');

    // Without this the reveal never fires and content is invisible forever.
    const block = css.slice(css.indexOf('prefers-reduced-motion: reduce'));
    expect(block).toContain('[data-reveal]');
    expect(block).toMatch(/opacity:\s*1\s*!important/);
  });

  it('ScrollReveal checks the media query before observing', () => {
    const source = read(join(SRC, 'components/ui/ScrollReveal.tsx'));
    expect(source).toContain('prefers-reduced-motion');
  });

  it('BackToTop scrolls instantly when motion is reduced', () => {
    const source = read(join(SRC, 'components/layout/BackToTop.tsx'));
    expect(source).toContain('prefers-reduced-motion');
    expect(source).toContain("'auto'");
  });
});

describe('focus states', () => {
  it('globals.css defines a visible focus ring', () => {
    const css = readFileSync(join(SRC, 'app/globals.css'), 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toMatch(/outline:\s*2px solid/);
  });

  it('never removes an outline without providing a replacement', () => {
    const offenders: string[] = [];

    for (const file of componentFiles) {
      const source = read(file);
      // outline-none is only safe alongside a focus ring or focus-visible rule.
      if (!source.includes('outline-none')) continue;

      const hasReplacement =
        source.includes('focus:ring') ||
        source.includes('focus-visible:ring') ||
        source.includes('focus:border');

      if (!hasReplacement) offenders.push(relative(file));
    }

    expect(offenders).toEqual([]);
  });
});

describe('skip link and landmarks', () => {
  it('the root layout provides a skip link', () => {
    const layout = read(join(SRC, 'app/layout.tsx'));
    expect(layout).toContain('skip-link');
    expect(layout).toContain('#main-content');
  });

  it.each([
    'app/(public)/layout.tsx',
    'app/account/layout.tsx',
    'app/admin/(dashboard)/layout.tsx',
  ])('%s targets the skip link with a main landmark', (relativePath) => {
    const source = read(join(SRC, relativePath));
    expect(source).toContain('id="main-content"');
    expect(source).toMatch(/<main\b/);
  });
});

describe('icon-only controls carry an accessible name', () => {
  it('every icon-only button is labelled', () => {
    const offenders: string[] = [];

    for (const file of componentFiles) {
      const source = read(file);

      // Buttons whose entire content is an <svg> need an explicit name.
      const iconButtons = source.matchAll(
        /<button\b[^>]*>\s*(?:\{[^}]*\}\s*)?<svg[\s\S]*?<\/button>/g,
      );

      for (const match of iconButtons) {
        const markup = match[0];
        const labelled =
          markup.includes('aria-label') ||
          markup.includes('sr-only') ||
          markup.includes('aria-labelledby');

        if (!labelled) {
          offenders.push(`${relative(file)}: ${markup.slice(0, 60)}…`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('decorative SVGs are hidden from assistive technology', () => {
    const offenders: string[] = [];

    for (const file of componentFiles) {
      const source = read(file);

      // A shared props object carrying aria-hidden covers every element it is
      // spread onto, so those files are handled at the definition instead.
      const spreadIsHidden = /const \w*[iI]conProps\s*=\s*\{[\s\S]*?'aria-hidden':\s*true/.test(
        source,
      );

      for (const match of source.matchAll(/<svg\b[^>]*>/g)) {
        const tag = match[0];

        if (tag.includes('{...') && spreadIsHidden) continue;

        // A meaningful SVG uses role="img" with a label; everything else is
        // decorative and must be hidden so it is not announced.
        const handled =
          tag.includes('aria-hidden') ||
          tag.includes('role="img"') ||
          tag.includes('aria-label');

        if (!handled) offenders.push(`${relative(file)}: ${tag.slice(0, 70)}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('forms', () => {
  it('the Field primitives wire label, description and error together', () => {
    const source = read(join(SRC, 'components/ui/Field.tsx'));

    expect(source).toContain('aria-describedby');
    expect(source).toContain('aria-invalid');
    expect(source).toContain('htmlFor');
    // Errors must be announced, not only shown.
    expect(source).toContain('role="alert"');
  });

  it('the honeypot is hidden from assistive technology', () => {
    const source = read(join(SRC, 'components/ui/Field.tsx'));
    const honeypot = source.slice(source.indexOf('HoneypotField'));

    expect(honeypot).toContain('aria-hidden');
    expect(honeypot).toContain('tabIndex={-1}');
  });

  it('required fields are announced as required', () => {
    const source = read(join(SRC, 'components/ui/Field.tsx'));
    expect(source).toContain('(required)');
  });
});

describe('dialogs', () => {
  const modal = read(join(SRC, 'components/ui/Modal.tsx'));

  it('uses dialog semantics', () => {
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain('aria-labelledby');
  });

  it('traps Tab and closes on Escape', () => {
    expect(modal).toContain("event.key === 'Escape'");
    expect(modal).toContain("event.key !== 'Tab'");
  });

  it('restores focus to the trigger on close', () => {
    expect(modal).toContain('previouslyFocused');
    expect(modal).toContain('previouslyFocused.current?.focus');
  });

  it('locks background scroll while open', () => {
    expect(modal).toContain("document.body.style.overflow = 'hidden'");
  });
});

describe('menus', () => {
  it('the mobile menu is inert while closed and announces its state', () => {
    const source = read(join(SRC, 'components/layout/MobileMenu.tsx'));

    expect(source).toContain('inert={!open}');
    expect(source).toContain('aria-modal');
    expect(source).toContain("event.key === 'Escape'");
  });

  it('the header menu trigger reports expansion', () => {
    const source = read(join(SRC, 'components/layout/Header.tsx'));
    expect(source).toContain('aria-expanded');
    expect(source).toContain('aria-label="Open menu"');
  });

  it('navigation landmarks are labelled', () => {
    const header = read(join(SRC, 'components/layout/Header.tsx'));
    const admin = read(join(SRC, 'components/admin/AdminNav.tsx'));

    expect(header).toContain('aria-label="Main"');
    expect(admin).toContain('aria-label="Admin"');
  });

  it('the accordion links its trigger and panel', () => {
    const source = read(join(SRC, 'components/ui/Accordion.tsx'));

    expect(source).toContain('aria-expanded');
    expect(source).toContain('aria-controls');
    expect(source).toContain('role="region"');
  });
});

describe('live regions', () => {
  it('toasts are announced politely', () => {
    const source = read(join(SRC, 'components/ui/Toast.tsx'));
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('role="status"');
  });

  it('alerts interrupt only for errors', () => {
    const source = read(join(SRC, 'components/ui/Alert.tsx'));
    expect(source).toContain('assertive');
    expect(source).toContain('polite');
  });
});

describe('current page is exposed to assistive technology', () => {
  it.each([
    'components/layout/Header.tsx',
    'components/layout/MobileMenu.tsx',
    'components/admin/AdminNav.tsx',
    'components/account/AccountNav.tsx',
    'components/ui/Pagination.tsx',
  ])('%s marks the active item with aria-current', (relativePath) => {
    expect(read(join(SRC, relativePath))).toContain('aria-current');
  });
});

describe('images', () => {
  it('every next/image has an alt attribute', () => {
    const offenders: string[] = [];

    for (const file of componentFiles) {
      const source = read(file);
      if (!source.includes('next/image')) continue;

      for (const match of source.matchAll(/<Image\b[\s\S]*?\/>/g)) {
        if (!match[0].includes('alt=')) {
          offenders.push(`${relative(file)}: ${match[0].slice(0, 60)}…`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('the image sub-schema requires alt text', () => {
    const source = readFileSync(join(SRC, 'models/shared.ts'), 'utf8');
    const imageBlock = source.slice(source.indexOf('imageSchema'));
    expect(imageBlock).toContain('required: true');
  });
});
