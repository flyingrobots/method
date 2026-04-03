import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { Cycle } from './workspace.js';

interface PlaybackQuestion {
  designDoc: string;
  sponsor: 'Human' | 'Agent';
  text: string;
  normalized: string;
}

export interface DriftReport {
  exitCode: 0 | 2;
  output: string;
}

export function detectWorkspaceDrift(root: string, cycles: readonly Cycle[]): DriftReport {
  if (cycles.length === 0) {
    return {
      exitCode: 0,
      output: 'No active cycles found.\n',
    };
  }

  const questions = cycles.flatMap((cycle) => extractPlaybackQuestions(cycle.designDoc));
  const testDescriptions = collectTestDescriptions(root);
  const unmatched = questions.filter((question) =>
    !testDescriptions.some((description) => normalizeForMatch(description) === question.normalized));
  const summaryLine = `Scanned ${cycles.length} active cycle${plural(cycles.length)}, ${questions.length} playback question${plural(questions.length)}, ${testDescriptions.length} test description${plural(testDescriptions.length)}.`;
  const searchBasis = 'Search basis: exact normalized match in tests/**/*.test.* and tests/**/*.spec.* descriptions.';

  if (unmatched.length === 0) {
    return {
      exitCode: 0,
      output: [
        'No playback-question drift found.',
        summaryLine,
        searchBasis,
        '',
      ].join('\n'),
    };
  }

  const grouped = new Map<string, PlaybackQuestion[]>();
  for (const question of unmatched) {
    const current = grouped.get(question.designDoc) ?? [];
    current.push(question);
    grouped.set(question.designDoc, current);
  }

  const findingLines: string[] = [];
  for (const designDoc of [...grouped.keys()].sort((left, right) => left.localeCompare(right))) {
    findingLines.push(relative(root, designDoc));
    for (const question of grouped.get(designDoc) ?? []) {
      findingLines.push(`- ${question.sponsor}: ${question.text}`);
      findingLines.push('  No exact normalized test description match found.');
    }
    findingLines.push('');
  }

  return {
    exitCode: 2,
    output: [
      'Playback-question drift found.',
      summaryLine,
      searchBasis,
      '',
      ...findingLines,
    ].join('\n'),
  };
}

function collectTestDescriptions(root: string): string[] {
  const descriptions: string[] = [];
  for (const file of collectTestFiles(root)) {
    const contents = stripComments(readFileSync(file, 'utf8'));
    for (const match of contents.matchAll(/\b(?:it|test)\s*\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/gu)) {
      const description = decodeTestStringLiteral(match[2] ?? '', match[1] ?? '').trim();
      if (description.length > 0) {
        descriptions.push(description);
      }
    }
  }
  return descriptions;
}

function collectTestFiles(root: string): string[] {
  const testsRoot = resolve(root, 'tests');
  if (!existsSync(testsRoot)) {
    return [];
  }

  return collectFiles(testsRoot, (name) => /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(name));
}

function collectFiles(root: string, predicate: (name: string) => boolean): string[] {
  if (!existsSync(root)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(path, predicate));
    } else if (entry.isFile() && predicate(entry.name)) {
      files.push(path);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function extractPlaybackQuestions(path: string): PlaybackQuestion[] {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/u);
  const questions: PlaybackQuestion[] = [];
  let inPlaybackSection = false;
  let sponsor: 'Human' | 'Agent' | undefined;
  let pendingLines: string[] = [];

  const flushPending = (): void => {
    if (sponsor === undefined || pendingLines.length === 0) {
      return;
    }

    const text = pendingLines.join(' ').replace(/\s+/gu, ' ').trim();
    if (text.length === 0) {
      return;
    }

    questions.push({
      designDoc: path,
      sponsor,
      text,
      normalized: normalizeForMatch(text),
    });
    pendingLines = [];
  };

  for (const line of [...lines, '## End']) {
    if (!inPlaybackSection) {
      if (line.trim() === '## Playback Questions') {
        inPlaybackSection = true;
      }
      continue;
    }

    if (/^## /u.test(line)) {
      flushPending();
      break;
    }

    const sponsorMatch = /^### (Human|Agent)\s*$/u.exec(line.trim());
    if (sponsorMatch !== null) {
      flushPending();
      sponsor = sponsorMatch[1] as 'Human' | 'Agent';
      continue;
    }

    const bulletMatch = /^- \[ \] (.+)$/u.exec(line.trim());
    if (bulletMatch !== null) {
      flushPending();
      pendingLines = [bulletMatch[1].trim()];
      continue;
    }

    if (pendingLines.length > 0 && line.trim().length > 0) {
      pendingLines.push(line.trim());
    }
  }

  return questions;
}

function normalizeForMatch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, ' ');
}

function plural(count: number): string {
  return count === 1 ? '' : 's';
}

function decodeTestStringLiteral(value: string, quoteChar: string): string {
  return value.replace(/\\([\\'"`nrt])/gu, (_match, escaped: string) => {
    if (escaped === 'n') return '\n';
    if (escaped === 'r') return '\r';
    if (escaped === 't') return '\t';
    if (escaped === quoteChar) return quoteChar;
    return escaped;
  });
}

function stripComments(value: string): string {
  let result = '';
  let index = 0;
  let state: 'code' | 'single-quote' | 'double-quote' | 'template' | 'line-comment' | 'block-comment' = 'code';
  let escaped = false;

  while (index < value.length) {
    const current = value[index];
    const next = value[index + 1];

    if (state === 'line-comment') {
      if (current === '\n' || current === '\r') {
        result += current;
        state = 'code';
      } else {
        result += ' ';
      }
      index += 1;
      continue;
    }

    if (state === 'block-comment') {
      if (current === '*' && next === '/') {
        result += '  ';
        index += 2;
        state = 'code';
        continue;
      }

      result += current === '\n' || current === '\r' ? current : ' ';
      index += 1;
      continue;
    }

    if (state === 'single-quote' || state === 'double-quote' || state === 'template') {
      result += current;

      if (escaped) {
        escaped = false;
      } else if (current === '\\') {
        escaped = true;
      } else if (
        (state === 'single-quote' && current === '\'')
        || (state === 'double-quote' && current === '"')
        || (state === 'template' && current === '`')
      ) {
        state = 'code';
      }

      index += 1;
      continue;
    }

    if (current === '/' && next === '/') {
      result += '  ';
      index += 2;
      state = 'line-comment';
      continue;
    }

    if (current === '/' && next === '*') {
      result += '  ';
      index += 2;
      state = 'block-comment';
      continue;
    }

    if (current === '\'') {
      state = 'single-quote';
      result += current;
      index += 1;
      continue;
    }

    if (current === '"') {
      state = 'double-quote';
      result += current;
      index += 1;
      continue;
    }

    if (current === '`') {
      state = 'template';
      result += current;
      index += 1;
      continue;
    }

    result += current;
    index += 1;
  }

  return result;
}
