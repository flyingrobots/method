import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');

describe('CI hardening', () => {
  it('Does CI run lint, audit, build, test, and pack verification on every push and pull request?', () => {
    const ci = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf8');
    expect(ci).toContain('npm audit');
    expect(ci).toContain('npm run lint');
    expect(ci).toContain('npm run build');
    expect(ci).toContain('npm test');
    expect(ci).toContain('npm pack --dry-run');
    expect(ci).toContain('on:');
    expect(ci).toContain('push:');
    expect(ci).toContain('pull_request:');
  });

  it('Does the pre-commit hook enforce lint and regenerate reference docs before allowing a commit?', () => {
    const hookPath = resolve(ROOT, 'scripts/hooks/pre-commit');
    expect(existsSync(hookPath)).toBe(true);
    const content = readFileSync(hookPath, 'utf8');
    expect(content).toContain('npm run lint');
    expect(content).toContain('sync refs');
    // Hook must be executable
    const stats = statSync(hookPath);
    expect(stats.mode & 0o111).toBeGreaterThan(0);
  });

  it('Does the `npm run lint` script invoke Biome and exit cleanly on the current codebase?', () => {
    const result = execFileSync('npm', ['run', 'lint'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    expect(result).toContain('Checked');
  });
});
