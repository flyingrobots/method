import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readTypedFrontmatter, updateTypedFrontmatter } from '../src/frontmatter.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
});

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-fm-'));
  tempRoots.push(root);
  return root;
}

function writeDoc(root: string, name: string, frontmatter: string, body: string): string {
  const path = join(root, name);
  writeFileSync(path, `---\n${frontmatter}\n---\n\n${body}\n`, 'utf8');
  return path;
}

describe('Typed frontmatter access', () => {
  it('Does `readTypedFrontmatter` preserve arrays, booleans, and numbers instead of collapsing them to strings?', () => {
    const root = createTempRoot();
    const path = writeDoc(
      root,
      'typed.md',
      ['title: "Typed Test"', 'acceptance_criteria:', '  - "First criterion"', '  - "Second criterion"', 'ready: true', 'priority: 3'].join(
        '\n',
      ),
      '# Typed Test',
    );

    const fm = readTypedFrontmatter(path);

    expect(fm.title).toBe('Typed Test');
    expect(Array.isArray(fm.acceptance_criteria)).toBe(true);
    expect(fm.acceptance_criteria).toEqual(['First criterion', 'Second criterion']);
    expect(fm.ready).toBe(true);
    expect(fm.priority).toBe(3);
  });

  it('Does `updateTypedFrontmatter` reject type downgrades from array to string?', () => {
    const root = createTempRoot();
    const path = writeDoc(
      root,
      'downgrade.md',
      ['title: "Downgrade Test"', 'acceptance_criteria:', '  - "First"', '  - "Second"'].join('\n'),
      '# Downgrade Test',
    );

    expect(() => {
      updateTypedFrontmatter(path, { acceptance_criteria: 'collapsed string' });
    }).toThrow(/cannot downgrade.*acceptance_criteria.*array.*string/iu);
  });

  it('Does `updateTypedFrontmatter` reject type downgrades from boolean to string?', () => {
    const root = createTempRoot();
    const path = writeDoc(root, 'bool-downgrade.md', ['title: "Bool Test"', 'ready: true'].join('\n'), '# Bool Test');

    expect(() => {
      updateTypedFrontmatter(path, { ready: 'yes' });
    }).toThrow(/cannot downgrade.*ready.*boolean.*string/iu);
  });

  it('Does `updateTypedFrontmatter` allow same-type updates without error?', () => {
    const root = createTempRoot();
    const path = writeDoc(
      root,
      'same-type.md',
      ['title: "Same Type"', 'acceptance_criteria:', '  - "Old"', 'ready: false'].join('\n'),
      '# Same Type',
    );

    updateTypedFrontmatter(path, {
      acceptance_criteria: ['New', 'Criteria'],
      ready: true,
    });

    const fm = readTypedFrontmatter(path);
    expect(fm.acceptance_criteria).toEqual(['New', 'Criteria']);
    expect(fm.ready).toBe(true);
  });

  it('Does `updateTypedFrontmatter` allow writing to a field that was previously null?', () => {
    const root = createTempRoot();
    const path = writeDoc(root, 'null-field.md', ['title: "Null Field"', 'github_labels:'].join('\n'), '# Null Field');

    // YAML parses bare `github_labels:` as null — writing a string should not throw
    expect(() => {
      updateTypedFrontmatter(path, { github_labels: 'bug,priority' });
    }).not.toThrow();

    const fm = readTypedFrontmatter(path);
    expect(fm.github_labels).toBe('bug,priority');
  });
});
