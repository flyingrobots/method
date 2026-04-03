import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

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

  it('keeps README legend examples aligned with the repo taxonomy', () => {
    const readme = readRepoFile('README.md');

    expect(readme).not.toContain('`VIZ`, `PROTO`, `TUI`');
    expect(readme).not.toContain('VIZ_braille-rendering.md');
    expect(readme).not.toContain('PROTO_strand-lifecycle.md');
  });

  it('records synthesis protocol and provenance contract details in backlog docs', () => {
    const protocol = readRepoFile('docs/method/backlog/inbox/SYNTH_executive-summary-protocol.md');
    const provenance = readRepoFile('docs/method/backlog/inbox/SYNTH_generated-signpost-provenance.md');
    const legendAudit = readRepoFile('docs/method/backlog/inbox/PROCESS_legend-audit-and-assignment.md');

    expect(protocol).toContain('## Protocol Specification');
    expect(protocol).toContain('### Phase 1: Inventory');
    expect(protocol).toContain('### Phase 2: Read and Synthesize');
    expect(protocol).toContain('### Phase 3: Generate Witness');
    expect(protocol).toContain('### Phase 4: Verification');
    expect(provenance).toContain('## Provenance Contract');
    expect(provenance).toContain('`generated_at`');
    expect(provenance).toContain('`generated_from_commit`');
    expect(provenance).toContain('`witness_ref`');
    expect(legendAudit).not.toContain('`CORE`');
    expect(legendAudit).not.toContain('`WARP`');
  });

  it('sanitizes personal absolute paths from committed verification witnesses', () => {
    const readmeRevisionVerification = readRepoFile('docs/method/retro/0003-readme-revision/witness/verification.md');
    const visionRefreshVerification = readRepoFile('docs/method/retro/0004-readme-and-vision-refresh/witness/verification.md');

    expect(readmeRevisionVerification).not.toContain('/Users/');
    expect(visionRefreshVerification).not.toContain('/Users/');
  });

  it('ships a VISION signpost with bounded provenance metadata and repo-state grounding', () => {
    const vision = readRepoFile('docs/VISION.md');

    expect(vision).toContain('---\n');
    expect(vision).toContain('title: "METHOD - Executive Summary"');
    expect(vision).toMatch(/^generated_at:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/mu);
    expect(vision).toMatch(/^generator:\s+"[^"\n]+"$/mu);
    expect(vision).toMatch(/^generated_from_commit: "[0-9a-f]{40}"$/mu);
    expect(vision).toMatch(/^witness_ref:\s+\S+$/mu);
    expect(vision).toMatch(/^provenance_level:\s+artifact_history$/mu);
    expect(vision).toMatch(/^source_files:\s*$/mu);
    expect(vision).toMatch(/^  - \S+$/mu);
    expect(vision).toContain('docs/method/retro/0004-readme-and-vision-refresh/readme-and-vision-refresh.md');
    expect(vision).toContain('docs/method/retro/0004-readme-and-vision-refresh/witness/verification.md');
    expect(vision).toContain('# METHOD - Executive Summary');
    expect(vision).toContain('## Legends');
    expect(vision).toContain('## Roadmap');
    expect(vision).toContain('## Open questions');
  });
});
