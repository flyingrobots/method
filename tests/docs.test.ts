import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(import.meta.dirname, '..');

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('METHOD docs', () => {
  it('structures the README around stances, constraints, and quality gates', () => {
    const readme = readRepoFile('README.md');

    expect(readme).toContain('### Stances');
    expect(readme).toContain('### Design constraints');
    expect(readme).toContain('### Quality gates');
    expect(readme).toContain('## Coordination');
    expect(readme).toContain('### BEARING.md');
  });

  it('keeps reproducibility as part of done', () => {
    const readme = readRepoFile('README.md');

    expect(readme).toContain('If a claimed result cannot be reproduced, it is not done.');
    expect(readme).not.toContain('What is everyone working on? → `ls docs/design/`');
  });

  it('ships the BEARING signpost the README describes', () => {
    const bearing = readRepoFile('docs/BEARING.md');

    expect(bearing).toContain('# BEARING');
    expect(bearing).toContain('Where are we going?');
    expect(bearing).toContain('What just shipped?');
    expect(bearing).toContain('What feels wrong?');
  });

  it('describes the current legends in repo-visible docs', () => {
    const readme = readRepoFile('README.md');
    const processLegend = readRepoFile('docs/method/legends/PROCESS.md');
    const synthLegend = readRepoFile('docs/method/legends/SYNTH.md');

    expect(readme).toContain('`PROCESS`');
    expect(readme).toContain('`SYNTH`');
    expect(processLegend).toContain('# Legend: PROCESS');
    expect(synthLegend).toContain('# Legend: SYNTH');
  });

  it('ships a VISION signpost with bounded provenance metadata', () => {
    const vision = readRepoFile('docs/VISION.md');

    expect(vision).toContain('---\n');
    expect(vision).toContain('title: "METHOD - Executive Summary"');
    expect(vision).toContain('generated_at:');
    expect(vision).toContain('generator:');
    expect(vision).toContain('source_files:');
    expect(vision).toContain('# METHOD - Executive Summary');
    expect(vision).toContain('## Legends');
    expect(vision).toContain('## Roadmap');
    expect(vision).toContain('## Open questions');
  });
});
