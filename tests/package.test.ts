import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

type PackFile = { path: string };
type PackResult = { files: PackFile[]; filename: string };
type PackageJson = { name: string; version: string };

describe('METHOD package', () => {
  it('packs only the built runtime surface and essential metadata', () => {
    const packageJson = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as PackageJson;
    const packageFileStem = packageJson.name.replace(/^@/u, '').replace('/', '-');
    const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });

    const parsed = JSON.parse(output) as PackResult[];
    expect(parsed).toHaveLength(1);

    const pack = parsed[0];
    const packedPaths = pack.files.map((entry) => entry.path).sort((left, right) => left.localeCompare(right));

    expect(pack.filename).toBe(`${packageFileStem}-${packageJson.version}.tgz`);
    expect(packedPaths).toContain('package.json');
    expect(packedPaths).toContain('README.md');
    expect(packedPaths).toContain('CHANGELOG.md');
    expect(packedPaths).toContain('LICENSE');
    expect(packedPaths).toContain('NOTICE');
    expect(packedPaths).toContain('dist/cli.js');
    expect(packedPaths).toContain('dist/index.js');
    expect(packedPaths).toContain('dist/index.d.ts');

    expect(packedPaths.some((path) => path.startsWith('src/'))).toBe(false);
    expect(packedPaths.some((path) => path.startsWith('tests/'))).toBe(false);
    expect(packedPaths.some((path) => path.startsWith('docs/'))).toBe(false);
    expect(packedPaths.some((path) => path.startsWith('.'))).toBe(false);
    expect(packedPaths.some((path) => path.endsWith('.map'))).toBe(false);
    expect(packedPaths.length).toBeLessThan(45);
  });
});
