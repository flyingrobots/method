import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CANONICAL_LABELS,
  collectBacklogCards,
  labelsFor,
  loadExistingIssueMap,
  renderJson,
  sourceBacklogMarker,
} from '../scripts/migrate-backlog-to-github-issues.mjs';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), 'method-migrate-test-'));
  tempDirs.push(root);
  return root;
}

describe('backlog GitHub issue migration script', () => {
  it('collects lane cards with title, legend, priority, and Method labels', () => {
    const root = tempRoot();
    const backlogRoot = join(root, 'docs/method/backlog');
    mkdirSync(join(backlogRoot, 'bad-code'), { recursive: true });
    writeFileSync(
      join(backlogRoot, 'bad-code/CORE_fix-old-thing.md'),
      ['---', 'priority: high', '---', '', '# Fix Old Thing', '', 'The original card body.', ''].join('\n'),
      'utf8',
    );

    const cards = collectBacklogCards(root, backlogRoot);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      lane: 'bad-code',
      legend: 'CORE',
      priority: 'high',
      relativePath: 'docs/method/backlog/bad-code/CORE_fix-old-thing.md',
      title: 'Fix Old Thing',
    });
    expect(cards[0]?.labels).toEqual(['lane:bad-code', 'legend:core', 'priority:high', 'type:maintenance']);
    expect(cards[0]?.body).toContain(sourceBacklogMarker('docs/method/backlog/bad-code/CORE_fix-old-thing.md'));
  });

  it('keeps the full canonical label set independent of migrated card contents', () => {
    expect(CANONICAL_LABELS).toEqual(
      expect.arrayContaining(['lane:inbox', 'work-in-progress', 'type:bug', 'type:enhancement', 'type:spike']),
    );
    expect(labelsFor({ lane: 'v1.2.3', legend: 'PROCESS', priority: 'medium' })).toEqual([
      'lane:release',
      'legend:process',
      'priority:medium',
    ]);
  });

  it('loads exact migrated source paths from existing GitHub issue bodies without search indexing', () => {
    let observedArgs: string[] = [];
    const existing = loadExistingIssueMap('owner/repo', (_command, args) => {
      observedArgs = args;
      return {
        ok: true,
        status: 0,
        stderr: '',
        stdout: `${JSON.stringify({
          number: 7,
          title: 'Migrated card',
          url: 'https://github.com/owner/repo/issues/7',
          state: 'OPEN',
          body: `${sourceBacklogMarker('docs/method/backlog/cool-ideas/PROCESS_card.md')}\n`,
        })}\n`,
      };
    });

    expect(observedArgs).toContain('--paginate');
    expect(observedArgs).toContain('--jq');
    expect(existing.get('docs/method/backlog/cool-ideas/PROCESS_card.md')).toEqual({
      number: 7,
      title: 'Migrated card',
      url: 'https://github.com/owner/repo/issues/7',
      state: 'OPEN',
    });
  });

  it('fails closed when existing issue loading fails', () => {
    expect(() =>
      loadExistingIssueMap('owner/repo', () => ({
        ok: false,
        status: 1,
        stdout: '',
        stderr: 'rate limited',
      })),
    ).toThrow('Unable to load existing GitHub issues');
  });

  it('renders dry-run style JSON without shelling out to GitHub', () => {
    const results = renderJson([
      {
        action: 'create-dry-run',
        card: {
          relativePath: 'docs/method/backlog/cool-ideas/PROCESS_card.md',
          title: 'Card',
          labels: ['lane:cool-ideas', 'legend:process'],
        },
      },
    ]);

    expect(results).toEqual([
      {
        action: 'create-dry-run',
        path: 'docs/method/backlog/cool-ideas/PROCESS_card.md',
        title: 'Card',
        labels: ['lane:cool-ideas', 'legend:process'],
      },
    ]);
  });
});
