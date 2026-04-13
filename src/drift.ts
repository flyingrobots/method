import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { Cycle } from './domain.js';

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

export function detectWorkspaceDrift(root: string, cycles: readonly Cycle[], testsDir?: string): DriftReport {
  if (cycles.length === 0) {
    return {
      exitCode: 0,
      output: 'No active cycles found.\n',
    };
  }

  const questions = cycles.flatMap((cycle) => extractPlaybackQuestions(cycle.designDoc));
  const testDescriptions = collectTestDescriptions(testsDir ?? resolve(root, 'tests'));
  const normalizedDescriptions = testDescriptions.map((d) => ({
    original: d,
    normalized: normalizeForMatch(d),
    semantic: normalizeForSemanticMatch(d),
  }));
  const unmatched = questions.filter((question) => {
    // Tier 1: exact normalized match
    if (normalizedDescriptions.some((desc) => desc.normalized === question.normalized)) {
      return false;
    }
    // Tier 2: semantic normalization match (strips question form, backticks, etc.)
    const semanticQ = normalizeForSemanticMatch(question.text);
    if (normalizedDescriptions.some((desc) => desc.semantic === semanticQ)) {
      return false;
    }
    // Tier 3: high-confidence token similarity
    const bestScore = Math.max(
      ...normalizedDescriptions.map((desc) => tokenSimilarity(semanticQ, desc.semantic)),
      0,
    );
    return bestScore < SEMANTIC_MATCH_THRESHOLD;
  });
  const summaryLine = `Scanned ${cycles.length} active cycle${plural(cycles.length)}, ${questions.length} playback question${plural(questions.length)}, ${testDescriptions.length} test description${plural(testDescriptions.length)}.`;
  const searchBasis = 'Search basis: normalized match, semantic normalization, or high-confidence token similarity in tests/**/*.test.* and tests/**/*.spec.* descriptions.';

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
      const hint = findNearMiss(question.text, normalizedDescriptions);
      if (hint !== undefined) {
        const pct = Math.round(hint.score * 100);
        findingLines.push(`  Near miss (${pct}%): "${hint.text}"`);
      } else {
        findingLines.push('  No matching test description found.');
      }
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

function collectTestDescriptions(testsDir: string): string[] {
  const descriptions: string[] = [];
  for (const file of collectTestFiles(testsDir)) {
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

function collectTestFiles(testsDir: string): string[] {
  if (!existsSync(testsDir)) {
    return [];
  }

  return collectFiles(testsDir, (name) => /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(name));
}

function collectFiles(root: string, predicate: (name: string) => boolean, maxDepth = 10): string[] {
  if (maxDepth <= 0 || !existsSync(root)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      files.push(...collectFiles(path, predicate, maxDepth - 1));
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

const SEMANTIC_MATCH_THRESHOLD = 0.85;
const NEAR_MISS_THRESHOLD = 0.65;

function findNearMiss(
  question: string,
  descriptions: readonly { original: string; semantic: string }[],
): { text: string; score: number } | undefined {
  const semanticQ = normalizeForSemanticMatch(question);
  let bestScore = 0;
  let bestOriginal: string | undefined;

  for (const desc of descriptions) {
    const score = tokenSimilarity(semanticQ, desc.semantic);
    if (score > bestScore) {
      bestScore = score;
      bestOriginal = desc.original;
    }
  }

  return bestScore >= NEAR_MISS_THRESHOLD && bestScore < SEMANTIC_MATCH_THRESHOLD && bestOriginal !== undefined
    ? { text: bestOriginal, score: bestScore }
    : undefined;
}

function tokenSimilarity(left: string, right: string): number {
  const tokenize = (value: string): Set<string> =>
    new Set(value.replace(/[^\p{L}\p{N}\s]/gu, '').split(' ').filter((t) => t.length > 0).map(stemToken));
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (leftTokens.size === 0 && rightTokens.size === 0) {
    return 1;
  }
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersection += 1;
    }
  }

  // Jaccard similarity: |intersection| / |union|
  const union = leftTokens.size + rightTokens.size - intersection;
  return intersection / union;
}

function stemToken(token: string): string {
  // Minimal English suffix stripping for verb/noun forms.
  // Goal: "creates" and "create" should produce the same stem.
  if (token.length <= 3) {
    return token;
  }
  if (token.endsWith('ing') && token.length > 5) {
    return token.slice(0, -3);
  }
  if (token.endsWith('ied') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith('ed') && token.length > 4) {
    return token.slice(0, -2);
  }
  // Strip trailing "s" (handles "creates" → "create", "docs" → "doc")
  // but not "ss" (e.g. "pass") or "us"/"is" endings
  if (token.endsWith('s') && !token.endsWith('ss') && !token.endsWith('us') && token.length > 3) {
    return token.slice(0, -1);
  }
  return token;
}

function normalizeForMatch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, ' ');
}

function normalizeForSemanticMatch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    // Strip backticks
    .replace(/`/gu, '')
    // Strip leading question words: "Does", "Is", "Can", "Will", "Are", "Do", "Has", "Have"
    .replace(/^(?:does|is|can|will|are|do|has|have)\s+/u, '')
    // Collapse whitespace
    .replace(/\s+/gu, ' ')
    // Strip trailing punctuation
    .replace(/[.?!]+$/u, '')
    .trim();
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
