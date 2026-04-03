import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(import.meta.dirname, '..');

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

function legendCodes(): string[] {
  return readdirSync(resolve(REPO_ROOT, 'docs/method/legends'))
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => entry.replace(/\.md$/u, ''))
    .sort((left, right) => left.localeCompare(right));
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

  it('describes the discovered legends in repo-visible docs', () => {
    const readme = readRepoFile('README.md');
    const vision = readRepoFile('docs/VISION.md');
    const codes = legendCodes();

    expect(codes.length).toBeGreaterThan(0);

    for (const code of codes) {
      const legendDoc = readRepoFile(`docs/method/legends/${code}.md`);

      expect(legendDoc).toContain(`# Legend: ${code}`);
      expect(readme).toContain(`\`${code}\``);
      expect(vision).toContain(`### ${code}`);
    }
  });

  it('ships a VISION signpost with bounded provenance metadata and repo-state grounding', () => {
    const vision = readRepoFile('docs/VISION.md');

    expect(vision).toContain('---\n');
    expect(vision).toContain('title: "METHOD - Executive Summary"');
    expect(vision).toContain('generated_at:');
    expect(vision).toContain('generator:');
    expect(vision).toMatch(/^generated_from_commit: "[0-9a-f]{40}"$/mu);
    expect(vision).toContain('witness_ref:');
    expect(vision).toContain('provenance_level: artifact_history');
    expect(vision).toContain('source_files:');
    expect(vision).toContain('docs/method/retro/0004-readme-and-vision-refresh/readme-and-vision-refresh.md');
    expect(vision).toContain('docs/method/retro/0004-readme-and-vision-refresh/witness/verification.md');
    expect(vision).toContain('# METHOD - Executive Summary');
    expect(vision).toContain('## Legends');
    expect(vision).toContain('## Roadmap');
    expect(vision).toContain('## Open questions');
  });
});
