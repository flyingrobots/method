import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(import.meta.dirname, '..', 'src');

describe('Workspace operation split', () => {
  it('Is the Workspace class in `src/index.ts` a thinner facade after the extraction, with cycle and utility logic in focused modules?', () => {
    const indexLines = readFileSync(resolve(SRC, 'index.ts'), 'utf8').split('\n').length;
    const cycleOpsLines = readFileSync(resolve(SRC, 'cycle-ops.ts'), 'utf8').split('\n').length;
    const utilsLines = readFileSync(resolve(SRC, 'workspace-utils.ts'), 'utf8').split('\n').length;

    // index.ts should be smaller than its historical ~2200 lines
    expect(indexLines).toBeLessThan(2050);
    // Extracted modules should have meaningful content
    expect(cycleOpsLines).toBeGreaterThan(100);
    expect(utilsLines).toBeGreaterThan(30);
  });

  it('Do `src/cycle-ops.ts` and `src/workspace-utils.ts` export the functions that `src/index.ts` previously defined locally?', async () => {
    const cycleOps = await import('../src/cycle-ops.js');
    const utils = await import('../src/workspace-utils.js');

    // cycle-ops exports
    expect(typeof cycleOps.readCycleFromDoc).toBe('function');
    expect(typeof cycleOps.resolveCyclePacketPaths).toBe('function');
    expect(typeof cycleOps.readCycleRelease).toBe('function');
    expect(cycleOps.CYCLE_NAME_PATTERN).toBeInstanceOf(RegExp);
    expect(cycleOps.LEGACY_CYCLE_PATTERN).toBeInstanceOf(RegExp);

    // workspace-utils exports
    expect(typeof utils.fileStem).toBe('function');
    expect(typeof utils.slugify).toBe('function');
    expect(typeof utils.normalizeRepoPath).toBe('function');
    expect(typeof utils.collectMarkdownFiles).toBe('function');
    expect(typeof utils.assertWorkspacePath).toBe('function');
    expect(typeof utils.normalizeOptionalString).toBe('function');
  });
});
