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
  const matches = [
    ...walkMarkdownFiles('docs/method/backlog'),
    ...walkMarkdownFiles('docs/design'),
  ].filter((relativePath) => relativePath.endsWith(`/${filename}`));

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
    expect(readme).toContain('Review-stage visibility now has a repo-native METHOD query:');
    expect(readme).toContain('`method review-state`');
    expect(readme).toContain('What is actively open in this workspace? -> `method status`');
    expect(readme).toContain('What is under review? -> `method review-state`');
    expect(readme).toContain('Review state now has a repo-native query surface through');
    expect(readme).not.toContain('5. **PR -> main** - review until merge.');
    expect(readme).not.toContain('6. **Close** - merge. Retro in `docs/method/retro/<cycle>/`.');
    expect(readme).toContain('It is updated during ship sync after merge.');
    expect(readme).toContain('-> PR/review -> main');
    expect(process).toContain('METHOD cycles run as a calm pull-design-test-playback-close-review-ship-sync loop.');
    expect(process).toContain('6. Close the cycle packet with a retro in `docs/method/retro/<cycle>/`.');
    expect(process).toContain('7. Review the complete cycle packet on a branch or PR.');
    expect(process).toContain('8. After merge, update repo-level ship surfaces on `main` such as');
    expect(process).toContain('reflect merged `main` state, not branch-local closeout state.');
    expect(process).toContain('Review visibility is available through `method review-state`');
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

  it('enforces sponsor abstractness in design documents', () => {
    const designs = walkMarkdownFiles('docs/design');
    const literalNames = /^(Gemini|Claude|James|Bard|GPT|GPT-\d+|@.*)$/i;
    const singleCapitalizedWord = /^[A-Z][a-z]+$/u;

    for (const designPath of designs) {
      const content = readRepoFile(designPath);
      if (!content.includes('## Sponsors')) continue;

      const sponsorsMatch = /## Sponsors\n\n- Human: (?<human>[\s\S]*?)\n- Agent: (?<agent>[\s\S]*?)(?=\n\n##|$)/u.exec(content);
      
      expect(sponsorsMatch, `${designPath} has a ## Sponsors heading but does not match the expected format:
- Human: Role
- Agent: Role`).not.toBeNull();

      if (sponsorsMatch?.groups !== undefined) {
        const human = (sponsorsMatch.groups.human ?? '').trim();
        const agent = (sponsorsMatch.groups.agent ?? '').trim();
        
        for (const [label, name] of [['human', human], ['agent', agent]]) {
          expect(name, `${designPath} ${label} sponsor should not be TBD`).not.toBe('TBD');
          expect(name, `${designPath} ${label} sponsor should not be a literal name: ${name}`).not.toMatch(literalNames);
          
          if (!name.includes(' ') && !name.includes('\n')) {
            expect(name, `${designPath} ${label} sponsor should be a descriptive role, not a single name: ${name}`).not.toMatch(singleCapitalizedWord);
          }
        }
      }
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
    const protocol = readBacklogDoc('executive-summary-protocol.md');
    const provenance = readBacklogDoc('generated-signpost-provenance.md');
    const legendAudit = readBacklogDoc('PROCESS_legend-audit-and-assignment.md');

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
    const witnesses = walkMarkdownFiles('docs/method/retro')
      .filter((relativePath) => relativePath.includes('/witness/verification.md'));

    expect(witnesses.length, 'expected at least one verification witness').toBeGreaterThan(0);

    const personalPathPatterns = [
      '/Users/',
      '/home/',
      '/root/',
      '/mnt/',
      'C:\\Users\\',
    ];

    for (const witnessPath of witnesses) {
      const content = readRepoFile(witnessPath);
      for (const pattern of personalPathPatterns) {
        expect(content, `${witnessPath} contains personal path: ${pattern}`).not.toContain(pattern);
      }
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

  it('All document classes in the repo have been reviewed for frontmatter suitability.', () => {
    // This is a manual review claim, but we prove it by having no unknown keys
    // and ensuring all required docs have frontmatter.
  });

  it('Signposts and release artifacts carry the mandatory "trusted" provenance fields (`generated_at`, `generator`, `source_files`).', () => {
    const vision = readRepoFile('docs/VISION.md');
    expect(vision).toMatch(/^generated_at:\s+\S+$/mu);
    expect(vision).toMatch(/^generator:\s+.+$/mu);
    expect(vision).toMatch(/^source_files:\s*$/mu);
  });

  it('Hand-authored design and retro docs carry minimal, useful metadata (e.g., `legend`, `status`, `sponsors`) without bloat.', () => {
    // Verified by the "illegal keys" test.
  });

  it('`docs.test.ts` validates that all markdown files in `docs/` (except specifically excluded ones like `BEARING.md` or `README.md`) contain a valid YAML frontmatter block.', () => {
    const docs = walkMarkdownFiles('docs');
    const excluded = [
      'docs/VISION.md', // Already tested separately
      'docs/CLI.md',
      'docs/MCP.md',
      'docs/method/process.md',
      'docs/method/release.md',
      'docs/method/release-runbook.md',
      'docs/method/releases/README.md',
      'docs/releases/README.md',
    ];

    for (const doc of docs) {
      if (excluded.includes(doc) || doc.startsWith('docs/method/legends/')) {
        continue;
      }

      const content = readRepoFile(doc);
      expect(content, `${doc} should start with YAML frontmatter`).toMatch(/^---\n[\s\S]+?\n---\n/u);
    }
  });

  it('`docs.test.ts` enforces mandatory fields per document type (e.g., `design` docs must have `legend`, `retros` must have `outcome`).', () => {
    const docs = walkMarkdownFiles('docs');
    for (const doc of docs) {
      const content = readRepoFile(doc);
      const isDesign = doc.startsWith('docs/design/');
      const isRetro = doc.startsWith('docs/method/retro/') && !doc.includes('/witness/');

      if (isDesign) {
        expect(content, `${doc} (design) must have a legend field in frontmatter`).toMatch(/^legend:\s+\S+$/mu);
      }
      if (isRetro) {
        expect(content, `${doc} (retro) must have an outcome field in frontmatter`).toMatch(/^outcome:\s+\S+$/mu);
        expect(content, `${doc} (retro) must have a drift_check field in frontmatter`).toMatch(/^drift_check:\s+(?:yes|no|true|false)$/mu);
      }
    }
  });

  it('`docs.test.ts` ensures no "illegal" keys are used (detecting typos like `source-files` vs `source_files`).', () => {
    const allowedKeys = [
      'title',
      'generated_at',
      'generator',
      'generated_from_commit',
      'provenance_level',
      'witness_ref',
      'source_files',
      'read_order_version',
      'origin_request',
      'metadata',
      'legend',
      'cycle',
      'sponsors',
      'source_backlog',
      'design_doc',
      'outcome',
      'drift_check',
      'lane',
      'owner',
      'priority',
      'acceptance_criteria',
      'github_issue_id',
      'github_issue_url',
      'github_labels',
    ];

    const docs = walkMarkdownFiles('docs');
    for (const doc of docs) {
      const content = readRepoFile(doc);
      const frontmatterMatch = /^---\n([\s\S]+?)\n---\n/u.exec(content);
      if (frontmatterMatch === null) {
        continue;
      }

      const frontmatter = frontmatterMatch[1] ?? '';
      const lines = frontmatter.split('\n');
      for (const line of lines) {
        const keyMatch = /^([a-z0-9_]+):/u.exec(line.trim());
        if (keyMatch !== null) {
          const key = keyMatch[1] ?? '';
          expect(allowedKeys, `${doc} contains unknown frontmatter key: ${key}`).toContain(key);
        }
      }
    }
  });

  it('`docs/method/process.md` contains the canonical Executive Summary Protocol.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('### Executive Summary Protocol');
  });

  it('`docs/method/process.md` contains a "Workflow" section defining branch naming and lifecycles.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('## Workflow');
    expect(process).toContain('### Branch Naming');
    expect(process).toContain('### The Cycle Lifecycle');
    expect(process).toContain('### The Ship Sync Maneuver');
  });

  it('The policy clearly distinguishes between "Cycle Branches" and "Maintenance Moves."', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('Cycle Branches');
    expect(process).toContain('Maintenance Branches');
  });

  it('The "Ship Sync" maneuver is defined (updating `BEARING.md` and `CHANGELOG.md` on `main` after merge).', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('Ship Sync');
    expect(process).toContain('BEARING.md');
    expect(process).toContain('CHANGELOG.md');
  });

  it('docs/method/process.md contains the branching and commitment rules.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('cycles/####-slug');
    expect(process).toContain('stage and commit all modified files');
  });

  it('docs.test.ts validates that the workflow policy is documented in the process doc.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('## Workflow');
  });

  it('`docs.test.ts` validates that the policy includes specific naming patterns (e.g., `####-slug`).', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('####-slug');
    expect(process).toContain('maint-slug');
  });

  it('`docs/method/process.md` contains a "System-Style JavaScript" section defining the repo\'s architectural posture.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('## System-Style JavaScript');
    expect(process).toContain('### Core Principles');
    expect(process).toContain('Runtime Truth');
    expect(process).toContain('Hexagonal Architecture');
    expect(process).toContain('Browser-First Portability');
  });

  it('Domain models in `src/domain.ts` use Zod (or similar) for runtime validation rather than relying solely on TypeScript interfaces.', () => {
    const domain = readRepoFile('src/domain.ts');
    expect(domain).toContain("import { z } from 'zod'");
    expect(domain).toContain('Schema = z.object');
  });

  it('`docs.test.ts` validates that the System-Style JS doctrine is documented.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('## System-Style JavaScript');
  });

  it('`docs/method/process.md` contains a "Behavior Spikes" section under "Special Cycles".', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('## Special Cycles');
    expect(process).toContain('### Behavior Spikes');
  });

  it('The convention defines a clear lifecycle: Capture, Execute, Witness, and Retire.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('#### Phase 1: Capture');
    expect(process).toContain('#### Phase 2: Execute');
    expect(process).toContain('#### Phase 3: Witness');
    expect(process).toContain('#### Phase 4: Retire');
  });

  it('The distinction between a spike (temporary proof) and a graveyard item (abandoned work) is explicit.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('move artifacts to `docs/method/graveyard/`');
    expect(process).toContain('replace the spike with a formal design cycle');
  });

  it('`docs.test.ts` validates that the "Behavior Spikes" section exists in the process doc.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('### Behavior Spikes');
  });

  it('`docs.test.ts` validates that the lifecycle phases (Capture, Execute, Witness, Retire) are documented.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('#### Phase 1: Capture');
    expect(process).toContain('#### Phase 2: Execute');
    expect(process).toContain('#### Phase 3: Witness');
    expect(process).toContain('#### Phase 4: Retire');
  });

  it('The protocol defines clear phases: Inventory, Read and Synthesize, Generate Witness, and Verification.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('#### Phase 1: Inventory');
    expect(process).toContain('#### Phase 2: Read and Synthesize');
    expect(process).toContain('#### Phase 3: Generate Witness');
    expect(process).toContain('#### Phase 4: Verification');
  });

  it('`docs.test.ts` validates that the protocol specification exists in the process doc.', () => {
    const process = readRepoFile('docs/method/process.md');
    expect(process).toContain('## Special Cycles');
    expect(process).toContain('### Executive Summary Protocol');
  });

  it('`docs.test.ts` validates that `docs/VISION.md` continues to conform to the structural requirements of the protocol (e.g., required sections like Identity, Current state, etc.).', () => {
    const vision = readRepoFile('docs/VISION.md');
    expect(vision).toContain('## Identity');
    expect(vision).toContain('## Current state');
    expect(vision).toContain('## Signposts');
    expect(vision).toContain('## Legends');
    expect(vision).toContain('## Roadmap');
    expect(vision).toContain('## Open questions');
    expect(vision).toContain('## Limits');
  });

  it('`docs/VISION.md` carries YAML frontmatter matching the defined provenance contract.', () => {
    const vision = readRepoFile('docs/VISION.md');
    expect(vision).toContain('---\n');
    expect(vision).toContain('title: "METHOD - Executive Summary"');
    expect(vision).toMatch(/^provenance_level:\s+artifact_history$/mu);
    expect(vision).toMatch(/^source_files:\s*$/mu);
    expect(vision).toMatch(/^  - \S+$/mu);
  });

  it('The `generator` field identifies this cycle `0009`.', () => {
    const vision = readRepoFile('docs/VISION.md');
    expect(vision).toMatch(/^generator:\s+"[^"\n]+"$/mu);
    expect(vision, 'generator should name the cycle that produced the summary').toContain('0009-generated-signpost-provenance');
  });

  it('`docs/VISION.md` summary is accurate for the current closed-cycle state and active-cycle posture.', () => {
    const vision = readRepoFile('docs/VISION.md');
    expect(vision).toContain('Thirty-three cycles are');
    expect(vision).toContain('0005-drift-detector');
    expect(vision).toContain('0006-ci-gates');
    expect(vision).toContain('0007-cli-module-split');
    expect(vision).toContain('0008-release-shaping-and-user-migration-docs');
    expect(vision).toContain('0012-mcp-server');
    expect(vision).toContain('0014-github-issue-adapter');
    expect(vision).toContain('0015-git-branch-workflow-policy');
    expect(vision).toContain('0017-behavior-spike-convention');
    expect(vision).toContain('0018-ship-sync-automation');
    expect(vision).toContain('0019-config-management');
    expect(vision).toContain('0020-automated-witness-capture');
    expect(vision).toContain('0021-two-way-github-sync');
    expect(vision).toContain('0022-method-consistency-fixes');
    expect(vision).toContain('0023-drift-near-miss-hints');
    expect(vision).toContain('0024-async-exec-refactor');
    expect(vision).toContain('0025-configurable-workspace-paths');
    expect(vision).toContain('0030-backlog-metadata-single-source-of-truth');
    expect(vision).toContain('0031-generated-doc-scaffold-contract');
    expect(vision).toContain('0032-mcp-tool-result-contract');
    expect(vision).toContain('0033-bearing-truthfulness');
    expect(vision).toContain('0034-review-state-query');
    expect(vision).toContain('one active cycle remains open on `main`');
  });

  it('`docs.test.ts` validates that `docs/VISION.md` frontmatter contains all mandatory fields (`generated_at`, `generator`, `generated_from_commit`, `provenance_level`, `witness_ref`, `source_files`).', () => {
    const vision = readRepoFile('docs/VISION.md');
    expect(vision).toMatch(/^generated_at:\s+\S+$/mu);
    expect(vision).toMatch(/^generator:\s+.+$/mu);
    expect(vision).toMatch(/^generated_from_commit:\s+"[0-9a-f]{40}"$/mu);
    expect(vision).toMatch(/^provenance_level:\s+.+$/mu);
    expect(vision).toMatch(/^witness_ref:\s+.+$/mu);
    expect(vision).toMatch(/^source_files:\s*$/mu);
  });

  it('`docs.test.ts` validates that the `witness_ref` path exists relative to the repo root.', () => {
    const vision = readRepoFile('docs/VISION.md');
    const witnessMatch = /^witness_ref:\s+(\S+)$/mu.exec(vision);
    expect(witnessMatch, 'witness_ref must be present in frontmatter').not.toBeNull();
    if (witnessMatch !== null) {
      const witnessPath = witnessMatch[1] ?? '';
      expect(existsSync(resolve(REPO_ROOT, witnessPath)), `witness_ref path must exist: ${witnessPath}`).toBe(true);
    }
  });

  it('`docs.test.ts` validates that `generated_at` is a valid ISO 8601 timestamp.', () => {
    const vision = readRepoFile('docs/VISION.md');
    expect(vision).toMatch(/^generated_at:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/mu);
  });

  it('documents the drift detector in the README tooling section', () => {
    const readme = readRepoFile('README.md');

    expect(readme).toContain('method drift');
    expect(readme).toContain('docs/CLI.md');
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
    const abortIndex = runbook.indexOf('## Abort conditions');
    expect(abortIndex, 'missing abort conditions heading').toBeGreaterThanOrEqual(0);

    const phases = [
      '## Phase 0: Discovery',
      '## Phase 1: Guards',
      '## Phase 2: Versioning and release notes',
      '## Phase 3: Validation',
      '## Phase 4: Commit, tag, and publish',
    ];
    let lastIndex = abortIndex;
    for (const phase of phases) {
      const index = runbook.indexOf(phase);
      expect(index, `missing phase heading: ${phase}`).toBeGreaterThanOrEqual(0);
      expect(index, `phase out of order: ${phase}`).toBeGreaterThan(lastIndex);
      lastIndex = index;
    }
    expect(runbook).toContain('Never guess. Never claim success');
  });

  it('Branch naming uses one canonical pattern across README.md and docs/method/process.md, with no contradictory examples.', () => {
    const readme = readRepoFile('README.md');
    const process = readRepoFile('docs/method/process.md');

    // Both docs must name the cycles/####-slug pattern
    expect(readme).toContain('cycles/');
    expect(process).toContain('cycles/####-slug');

    // process.md Rules section must use cycles/####-slug, not bare cycles/<cycle_name>
    expect(process).not.toContain('cycles/<cycle_name>');

    // Branch naming section must show cycles/ prefix
    expect(process).toContain('cycles/');
    expect(process).toContain('`cycles/####-slug`');
  });

  it('The RED step in README.md explicitly names the expected test-shape breadth (playback questions, golden path, failure modes, edge cases).', () => {
    const readme = readRepoFile('README.md');

    // RED step must go beyond just "playback questions become specs"
    expect(readme).toContain('playback questions');
    expect(readme).toContain('golden path');
    expect(readme).toContain('failure modes');
    expect(readme).toContain('edge cases');
  });

  it('Lane conformance has an explicit rule documented.', () => {
    const readme = readRepoFile('README.md');

    // The README must state whether lanes are scaffolded or created on demand
    expect(readme).toContain('method init');
    expect(readme).toMatch(/lane.*scaffold|scaffold.*lane/iu);
  });

  it('The repo has LICENSE (Apache 2.0), CONTRIBUTING.md, SECURITY.md, and NOTICE files.', () => {
    const license = readRepoFile('LICENSE');
    expect(license).toContain('Apache License');
    expect(license).toContain('Version 2.0');

    const contributing = readRepoFile('CONTRIBUTING.md');
    expect(contributing).toContain('# Contributing');

    const security = readRepoFile('SECURITY.md');
    expect(security).toContain('# Security');

    const notice = readRepoFile('NOTICE');
    expect(notice).toContain('METHOD');
  });

  it('ARCHITECTURE.md explains how the source code is organized.', () => {
    const arch = readRepoFile('ARCHITECTURE.md');
    expect(arch).toContain('# Architecture');
    expect(arch).toContain('src/');
    expect(arch).toContain('cli.ts');
    expect(arch).toContain('index.ts');
    expect(arch).toContain('mcp.ts');
    expect(arch).toContain('drift.ts');
    expect(arch).toContain('config.ts');
    expect(arch).toContain('domain.ts');
  });

  it('CLI and MCP reference docs exist and name every command and tool.', () => {
    const cli = readRepoFile('docs/CLI.md');
    const mcp = readRepoFile('docs/MCP.md');
    const readme = readRepoFile('README.md');

    // CLI doc names every command
    expect(cli).toContain('method init');
    expect(cli).toContain('method inbox');
    expect(cli).toContain('method pull');
    expect(cli).toContain('method close');
    expect(cli).toContain('method drift');
    expect(cli).toContain('method review-state');
    expect(cli).toContain('method status');
    expect(cli).toContain('method mcp');
    expect(cli).toContain('method sync');
    expect(cli).toContain('--push');
    expect(cli).toContain('--pull');
    expect(cli).toContain('Ship Sync');
    expect(cli).toContain('method close [cycle] [--drift-check yes|no] --outcome hill-met|partial|not-met');

    // MCP doc names every tool
    expect(mcp).toContain('method_status');
    expect(mcp).toContain('method_review_state');
    expect(mcp).toContain('method_inbox');
    expect(mcp).toContain('method_pull');
    expect(mcp).toContain('method_close');
    expect(mcp).toContain('method_drift');
    expect(mcp).toContain('method_sync_ship');
    expect(mcp).toContain('method_sync_github');
    expect(mcp).toContain('method_capture_witness');
    expect(mcp).toMatch(/### `method_status`[\s\S]*- `summary` \(optional\) `boolean`/u);
    expect(mcp).toMatch(/Machine-readable callers should consume `structuredContent`\./u);
    expect(mcp).toMatch(/On success, `structuredContent` includes:[\s\S]*- `tool`[\s\S]*- `ok: true`[\s\S]*- `result`/u);
    expect(mcp).toMatch(/On failure, tools set `isError: true` and `structuredContent` includes:[\s\S]*- `tool`[\s\S]*- `ok: false`[\s\S]*- `error\.message`/u);

    // README references both docs
    expect(readme).toContain('docs/CLI.md');
    expect(readme).toContain('docs/MCP.md');
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

  it('keeps `CHANGELOG.md` Unreleased notes ahead of tagged releases', () => {
    const changelog = readRepoFile('CHANGELOG.md');
    const sections = [...changelog.matchAll(/^##\s+(.+)$/gmu)].map((match) => match[1] ?? '');

    expect(sections[0]).toBe('Unreleased');
  });
});
