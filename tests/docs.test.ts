import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

function readBacklogDoc(filename: string): string {
  const matches = walkMarkdownFiles('docs/method/backlog')
    .filter((relativePath) => relativePath.endsWith(`/${filename}`));

  if (matches.length === 0) {
    throw new Error(`Could not find backlog doc ${filename}`);
  }
  if (matches.length > 1) {
    throw new Error(`Ambiguous backlog doc ${filename}: ${matches.join(', ')}`);
  }

  return readRepoFile(matches[0]);
}

function legendCodes(): string[] {
  return readdirSync(resolve(REPO_ROOT, 'docs/method/legends'))
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => entry.replace(/\.md$/u, ''))
    .sort((left, right) => left.localeCompare(right));
}

function inboxItemNames(): string[] {
  const inboxPath = resolve(REPO_ROOT, 'docs/method/backlog/inbox');
  if (!existsSync(inboxPath)) {
    return [];
  }

  return readdirSync(inboxPath)
    .filter((entry) => entry.endsWith('.md'))
    .sort((left, right) => left.localeCompare(right));
}

function walkMarkdownFiles(relativePath: string): string[] {
  const root = resolve(REPO_ROOT, relativePath);
  const entries = readdirSync(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const child = `${relativePath}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(child));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(child);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
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

  it('documents cycle closeout before PR review and ship sync after merge', () => {
    const readme = readRepoFile('README.md');
    const process = readRepoFile('docs/method/process.md');

    expect(readme).toContain('5. **Close** - write the retro and witness packet on the branch.');
    expect(readme).toContain('6. **PR / review** - review the full cycle packet until merge or');
    expect(readme).toContain('7. **Ship sync on `main`** - after merge, update repo-level ship');
    expect(readme).toContain('Review-stage visibility is not yet a repo-native METHOD query.');
    expect(readme).toContain('Branch and PR context carry that state for now.');
    expect(readme).toContain('What is actively open in this workspace? -> `method status`');
    expect(readme).not.toContain('What is under review? -> the branch and its closed cycle packet');
    expect(readme).toContain('Review state is not yet part of METHOD\'s repo-native coordination');
    expect(readme).not.toContain('5. **PR -> main** - review until merge.');
    expect(readme).not.toContain('6. **Close** - merge. Retro in `docs/method/retro/<cycle>/`.');
    expect(readme).toContain('It is updated during ship sync after merge.');
    expect(readme).toContain('-> PR/review -> main');
    expect(process).toContain('METHOD cycles run as a calm pull-design-test-playback-close-review-ship-sync loop.');
    expect(process).toContain('6. Close the cycle packet with a retro in `docs/method/retro/<cycle>/`.');
    expect(process).toContain('7. Review the complete cycle packet on a branch or PR.');
    expect(process).toContain('8. After merge, update repo-level ship surfaces on `main` such as');
    expect(process).toContain('reflect merged `main` state, not branch-local closeout state.');
    expect(process).toContain('Review visibility is currently outside METHOD\'s repo-native');
  });

  it('keeps METHOD distinct from forge-specific PR tooling', () => {
    const readme = readRepoFile('README.md');

    expect(readme).toContain('METHOD is not a GitHub workflow, a pull-request cockpit, or a');
    expect(readme).toContain('Draft Punks Doghouse');
    expect(readme).toContain('they do not define the method');
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

    expect(codes.length, 'expected at least one legend in docs/method/legends/').toBeGreaterThan(0);

    for (const code of codes) {
      const legendDoc = readRepoFile(`docs/method/legends/${code}.md`);

      expect(legendDoc).toContain(`# Legend: ${code}`);
      expect(readme).toContain(`\`${code}\``);
      expect(vision).toContain(`### ${code}`);
    }
  });

  it('keeps this repo inbox aligned with the current legend split', () => {
    const untaggedItems = inboxItemNames().filter((entry) => !/^(PROCESS|SYNTH)_/u.test(entry));

    expect(untaggedItems).toEqual([]);
  });

  it('keeps README legend examples aligned with the repo taxonomy', () => {
    const readme = readRepoFile('README.md');

    expect(readme).not.toContain('`VIZ`, `PROTO`, `TUI`');
    expect(readme).not.toContain('VIZ_braille-rendering.md');
    expect(readme).not.toContain('PROTO_strand-lifecycle.md');
  });

  it('records synthesis protocol and provenance contract details in backlog docs', () => {
    const protocol = readBacklogDoc('SYNTH_executive-summary-protocol.md');
    const provenance = readBacklogDoc('SYNTH_generated-signpost-provenance.md');
    const legendAudit = readBacklogDoc('PROCESS_legend-audit-and-assignment.md');

    expect(protocol).toContain('## Protocol Specification');
    expect(protocol).toContain('### Phase 1: Inventory');
    expect(protocol).toContain('### Phase 2: Read and Synthesize');
    expect(protocol).toContain('### Phase 3: Generate Witness');
    expect(protocol).toContain('### Phase 4: Verification');
    expect(provenance).toContain('## Provenance Contract');
    expect(provenance).toContain('| `generated_at` | full ISO 8601 timestamp with timezone | yes |');
    expect(provenance).toContain('`generated_from_commit`');
    expect(provenance).toContain('`witness_ref`');
    expect(provenance).toContain('| `read_order_version` | string | no |');
    expect(provenance).toContain('| `origin_request` | object | no |');
    expect(provenance).toContain('| `metadata` | object | no |');
    expect(provenance).toContain('METHOD now defines which provenance fields are mandatory');
    expect(provenance).toContain('Example (YAML frontmatter format):');
    expect(provenance).toContain('```yaml');
    expect(provenance).toContain('generated_at: 2026-04-02T17:41:54-07:00');
    expect(provenance).toContain('read_order_version: "1"');
    expect(legendAudit).toContain('By default, METHOD allows untagged backlog items.');
    expect(legendAudit).toContain('One possible repo-level opt-in would be');
    expect(legendAudit).toContain('`method.config.json`');
    expect(legendAudit).toContain('`require_legend_coverage`');
    expect(legendAudit).toContain('`method status`');
    expect(legendAudit).toContain('`legend-audit`');
    expect(legendAudit).toMatch(/If METHOD later implements that\s+flag/u);
    expect(legendAudit).toContain('define the `PROCESS` and `SYNTH` legends');
    expect(legendAudit).not.toContain('`graft`');
    expect(legendAudit).not.toContain('`CORE`');
    expect(legendAudit).not.toContain('`WARP`');
  });

  it('sanitizes personal absolute paths from committed verification witnesses', () => {
    const readmeRevisionVerification = readRepoFile('docs/method/retro/0003-readme-revision/witness/verification.md');
    const visionRefreshVerification = readRepoFile('docs/method/retro/0004-readme-and-vision-refresh/witness/verification.md');
    const driftDetectorVerification = readRepoFile('docs/method/retro/0005-drift-detector/witness/verification.md');

    const personalPathPatterns = [
      '/Users/',
      '/home/',
      '/root/',
      '/mnt/',
      'C:\\Users\\',
    ];

    for (const pattern of personalPathPatterns) {
      expect(readmeRevisionVerification).not.toContain(pattern);
      expect(visionRefreshVerification).not.toContain(pattern);
      expect(driftDetectorVerification).not.toContain(pattern);
    }
  });

  it('proves both clean and drift-found exit codes in the 0005 verification witness', () => {
    const verification = readRepoFile('docs/method/retro/0005-drift-detector/witness/verification.md');

    expect(verification).toContain('$ echo $?\n0');
    expect(verification).toContain('$ echo $?\n2');
  });

  it('keeps ALL_CAPS markdown docs at approved depths or approved legend paths', () => {
    const markdownFiles = [
      ...walkMarkdownFiles('docs'),
      ...readdirSync(REPO_ROOT)
        .filter((entry) => entry.endsWith('.md'))
        .map((entry) => entry),
    ];

    const offenders = markdownFiles.filter((relativePath) => {
      const base = relativePath.split('/').at(-1) ?? '';
      const isAllCaps = /^[A-Z][A-Z0-9-]*\.md$/u.test(base);

      if (!isAllCaps || base === 'README.md') {
        return false;
      }

      if (!relativePath.includes('/')) {
        return false;
      }

      if (/^docs\/[A-Z][A-Z0-9-]*\.md$/u.test(relativePath)) {
        return false;
      }

      return !/^docs\/method\/legends\/[A-Z][A-Z0-9-]*\.md$/u.test(relativePath);
    });

    expect(offenders).toEqual([]);
  });

  it('ships a VISION signpost with bounded provenance metadata and repo-state grounding', () => {
    const vision = readRepoFile('docs/VISION.md');

    expect(vision).toContain('---\n');
    expect(vision).toContain('title: "METHOD - Executive Summary"');
    expect(vision).toMatch(/^generated_at:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/mu);
    expect(vision).toMatch(/^generator:\s+(?:"[^"\n]+"|[^"\n][^\n]*)$/mu);
    expect(vision).toMatch(/^generated_from_commit:\s+"?[0-9a-f]{40}"?$/mu);
    expect(vision).toMatch(/^witness_ref:\s+\S+$/mu);
    expect(vision).toMatch(/^provenance_level:\s+"?artifact_history"?$/mu);
    expect(vision).toMatch(/^source_files:\s*$/mu);
    expect(vision).toMatch(/^  - \S+$/mu);
    if (/^read_order_version:/mu.test(vision)) {
      expect(vision).toMatch(/^read_order_version:\s+(?:"[^"\n]+"|[^\s][^\n]*)$/mu);
    }
    if (/^origin_request:/mu.test(vision)) {
      expect(vision).toMatch(/^origin_request:\s+.+$/mu);
    }
    if (/^metadata:/mu.test(vision)) {
      expect(vision).toMatch(/^metadata:\s+.+$/mu);
    }
    expect(vision).toContain('docs/method/retro/0004-readme-and-vision-refresh/readme-and-vision-refresh.md');
    expect(vision).toContain('docs/method/retro/0004-readme-and-vision-refresh/witness/verification.md');
    expect(vision).toContain('# METHOD - Executive Summary');
    expect(vision).toContain('## Legends');
    expect(vision).toContain('## Roadmap');
    expect(vision).toContain('## Open questions');
  });

  it('documents the drift detector in the README tooling section', () => {
    const readme = readRepoFile('README.md');

    expect(readme).toContain('| `method drift [cycle]` | Check active cycle playback questions against test descriptions. |');
  });

  it('ships a minimal CI workflow that runs build and test on push and pull requests', () => {
    const workflow = readRepoFile('.github/workflows/ci.yml');

    expect(workflow).toContain('name: CI');
    expect(workflow).toContain('push:');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('permissions:');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('runs-on: ubuntu-24.04');
    expect(workflow).toContain('timeout-minutes: 10');
    expect(workflow).toContain('actions/checkout@v4');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('actions/setup-node@v4');
    expect(workflow).toContain('node-version: 22');
    expect(workflow).toContain('cache: npm');
    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm run build');
    expect(workflow).toContain('npm test');
  });

  it('documents the CI gate in the README tooling section', () => {
    const readme = readRepoFile('README.md');

    expect(readme).toContain('.github/workflows/ci.yml');
    expect(readme).toContain('GitHub Actions');
    expect(readme).toContain('ubuntu-24.04');
    expect(readme).toContain('Node `22`');
    expect(readme).toContain('npm ci');
    expect(readme).toContain('npm run build');
    expect(readme).toContain('npm test');
  });

  it('defines shaped releases as artifacts, not versioned backlog lanes', () => {
    const release = readRepoFile('docs/method/release.md');

    expect(release).toContain('docs/method/releases/vX.Y.Z/release.md');
    expect(release).toContain('docs/method/releases/vX.Y.Z/verification.md');
    expect(release).toContain('docs/releases/vX.Y.Z.md');
    expect(release).toContain('`CHANGELOG.md` remains the ledger');
    expect(release).toContain('Releases aggregate shipped work.');
    expect(release).toMatch(/They do not create\s+`docs\/method\/backlog\/<version>\/`/u);
    expect(release).toMatch(/The release design names and justifies the intended version/u);
  });

  it('ships a release runbook that separates doctrine from pre-flight execution', () => {
    const runbook = readRepoFile('docs/method/release-runbook.md');

    expect(runbook).toContain('# Release Runbook');
    const phases = [
      '## Phase 0: Discovery',
      '## Phase 1: Guards',
      '## Phase 2: Versioning and release notes',
      '## Phase 3: Validation',
      '## Phase 4: Commit, tag, and publish',
    ];
    let lastIndex = -1;
    for (const phase of phases) {
      const index = runbook.indexOf(phase);
      expect(index, `missing phase heading: ${phase}`).toBeGreaterThanOrEqual(0);
      expect(index, `phase out of order: ${phase}`).toBeGreaterThan(lastIndex);
      lastIndex = index;
    }
    expect(runbook).toContain('## Abort conditions');
    expect(runbook).toContain('Never guess. Never claim success');
  });

  it('documents release-note surfaces in the repo structure and release guidance', () => {
    const readme = readRepoFile('README.md');
    const releasesGuide = readRepoFile('docs/releases/README.md');

    expect(readme).toContain('docs/releases/');
    expect(readme).toContain('release-runbook.md');
    expect(readme).toMatch(/release\s+notes\s+when\s+the\s+cycle\s+changes\s+them/u);
    expect(releasesGuide).toContain('# Releases');
    expect(releasesGuide).toContain('`docs/releases/vX.Y.Z.md`');
    expect(releasesGuide).toContain('Summary');
    expect(releasesGuide).toContain('What Changed');
    expect(releasesGuide).toContain('Why It Matters');
    expect(releasesGuide).toContain('Migration');
    expect(releasesGuide).toContain('No migration required.');
  });
});
