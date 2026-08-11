/**
 * Removes build output, working around Windows file locks.
 *
 *   npm run clean
 *
 * On Windows an editor (usually VS Code's file watcher) can hold an open
 * handle inside `.next`. Next.js then hangs on startup: it prints
 * "Starting..." and never compiles, because it cannot clear the stale output.
 * Neither delete nor rename releases such a handle.
 *
 * When `.next` cannot be reclaimed, this points the build at a fresh
 * directory via NEXT_DIST_DIR so work continues immediately — no editor
 * restart, no reboot. The locked folder is cleaned up automatically on a
 * later run once the handle is released.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, '.env.local');
const DIST_KEY = 'NEXT_DIST_DIR';

/** Directories safe to delete outright. */
const EXTRA_TARGETS = ['.turbo', 'coverage'];

/** Removes directories parked by earlier runs, once their handles are gone. */
function reclaimParked(): number {
  let removed = 0;

  for (const entry of readdirSync(ROOT)) {
    if (!entry.startsWith('.next-stale-') && !entry.startsWith('.next-build-')) continue;
    // Never delete the directory the current build is using.
    if (entry === currentDistDir()) continue;

    try {
      rmSync(join(ROOT, entry), { recursive: true, force: true });
      removed += 1;
    } catch {
      // Still locked; a later run will clear it.
    }
  }

  return removed;
}

/** Reads NEXT_DIST_DIR from .env.local, if a previous run set one. */
function currentDistDir(): string {
  if (!existsSync(ENV_FILE)) return '.next';
  const match = readFileSync(ENV_FILE, 'utf8').match(/^NEXT_DIST_DIR=(.+)$/m);
  return match?.[1]?.trim() ?? '.next';
}

/** Writes or removes NEXT_DIST_DIR in .env.local, leaving other lines intact. */
function setDistDir(value: string | null): void {
  let contents = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';

  contents = contents
    .split('\n')
    .filter(
      (line) =>
        !line.startsWith(`${DIST_KEY}=`) &&
        !line.startsWith('# Set by npm run clean'),
    )
    .join('\n')
    .replace(/\n{3,}$/, '\n');

  if (value) {
    contents =
      contents.replace(/\s*$/, '\n') +
      '\n# Set by npm run clean — the default .next directory was locked.\n' +
      `${DIST_KEY}=${value}\n`;
  }

  writeFileSync(ENV_FILE, contents);
}

/** True when the directory is gone or was successfully emptied and removed. */
function tryRemove(path: string): boolean {
  if (!existsSync(path)) return true;
  try {
    rmSync(path, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

function main(): void {
  const reclaimed = reclaimParked();
  const notes: string[] = [];

  for (const target of EXTRA_TARGETS) {
    tryRemove(join(ROOT, target));
  }

  const defaultDist = join(ROOT, '.next');
  let activeDist = '.next';

  if (tryRemove(defaultDist)) {
    // The normal path: .next is gone, so use it and clear any override.
    setDistDir(null);
    notes.push('.next removed');
  } else {
    // Locked. Try moving it aside first — that keeps the default in play.
    const parked = join(ROOT, `.next-stale-${Date.now()}`);
    let moved = false;
    try {
      renameSync(defaultDist, parked);
      moved = true;
    } catch {
      moved = false;
    }

    if (moved && tryRemove(defaultDist)) {
      setDistDir(null);
      notes.push('.next was locked, moved aside');
    } else {
      // Cannot reclaim it. Build somewhere else so work is not blocked.
      activeDist = `.next-build-${Date.now()}`;
      mkdirSync(join(ROOT, activeDist), { recursive: true });
      setDistDir(activeDist);
      notes.push('.next is locked by another process');
      notes.push(`building into ${activeDist} instead`);
    }
  }

  const line = '='.repeat(64);
  console.log(`\n${line}\n CLEAN\n${line}`);

  if (reclaimed > 0) {
    console.log(
      ` reclaimed ${reclaimed} previously locked director${reclaimed === 1 ? 'y' : 'ies'}`,
    );
  }
  for (const note of notes) console.log(` ${note}`);

  console.log(line);

  if (activeDist !== '.next') {
    console.log(' Your editor is holding a handle on .next.');
    console.log(' This build works around it, but to restore the default:');
    console.log('   reload the VS Code window, then run npm run clean');
  } else {
    console.log(' Ready.');
  }

  console.log(`${line}\n`);
}

main();
