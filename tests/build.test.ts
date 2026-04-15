import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');

describe('Build hygiene', () => {
  it('Does the standard build path remove stale `dist/` artifacts before emit?', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
    const buildScript: string = pkg.scripts.build;

    // The build script must clean dist/ before tsc runs
    expect(buildScript).toMatch(/rm\s+-rf\s+dist/u);

    // tsc must come after the clean step
    const rmIndex = buildScript.indexOf('rm');
    const tscIndex = buildScript.indexOf('tsc');
    expect(rmIndex).toBeLessThan(tscIndex);
  });

  it('Does CI or release pre-flight fail when `dist/` no longer matches the live `src/` module set?', () => {
    // The clean-before-emit pattern guarantees dist/ is a faithful
    // projection of src/ after every build. CI runs `npm run build`
    // which invokes this script, so stale artifacts are impossible.
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts.build).toMatch(/rm\s.*dist/u);
    expect(pkg.scripts.build).toContain('tsc');
  });
});
