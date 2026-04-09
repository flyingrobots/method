import { readFileSync, writeFileSync } from 'node:fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const FM_DELIMITER = '---\n';
const FM_END = '\n---\n';

interface ParsedDoc {
  frontmatter: Record<string, string>;
  body: string;
  raw: string;
}

function parseDoc(path: string): ParsedDoc {
  const raw = readFileSync(path, 'utf8');
  if (!raw.startsWith(FM_DELIMITER)) {
    const title = deriveLegacyTitle(raw);
    return {
      frontmatter: title === undefined ? {} : { title },
      body: raw,
      raw,
    };
  }

  const end = raw.indexOf(FM_END, FM_DELIMITER.length);
  if (end === -1) {
    return { frontmatter: {}, body: raw, raw };
  }

  const yamlBlock = raw.slice(FM_DELIMITER.length, end);
  const body = raw.slice(end + FM_END.length);

  let frontmatter: Record<string, string> = {};
  try {
    const parsed = parseYaml(yamlBlock);
    if (parsed !== null && typeof parsed === 'object') {
      for (const [key, value] of Object.entries(parsed)) {
        frontmatter[key] = String(value);
      }
    }
  } catch {
    // Malformed YAML — return empty frontmatter, preserve raw
    frontmatter = {};
  }

  if ((frontmatter.title ?? '').trim().length === 0) {
    const title = deriveLegacyTitle(raw);
    if (title !== undefined) {
      frontmatter.title = title;
    }
  }

  return { frontmatter, body, raw };
}

function serializeDoc(frontmatter: Record<string, string>, body: string): string {
  const yamlBlock = stringifyYaml(frontmatter, { lineWidth: 0 }).trim();
  return `---\n${yamlBlock}\n---\n${body}`;
}

export function readFrontmatter(path: string): Record<string, string> {
  return parseDoc(path).frontmatter;
}

export function updateFrontmatter(path: string, updates: Record<string, string>): void {
  const doc = parseDoc(path);
  const merged = { ...doc.frontmatter, ...updates };

  if (doc.raw.startsWith(FM_DELIMITER)) {
    const end = doc.raw.indexOf(FM_END, FM_DELIMITER.length);
    if (end !== -1) {
      const afterFm = doc.raw.slice(end + FM_END.length);
      writeFileSync(path, serializeDoc(merged, afterFm), 'utf8');
      return;
    }
  }

  // No existing frontmatter — prepend it
  writeFileSync(path, serializeDoc(merged, `\n${doc.raw}`), 'utf8');
}

export function readBody(path: string): string {
  const doc = parseDoc(path);
  const lines = doc.body.trim().split(/\r?\n/u);
  const bodyLines = lines[0]?.startsWith('# ') ? lines.slice(1) : lines;
  const result = bodyLines.join('\n').trim();
  return result.length > 0 ? result : 'TBD';
}

export function updateBody(path: string, newBody: string): void {
  const doc = parseDoc(path);
  const heading = readHeading(path);

  if (doc.raw.startsWith(FM_DELIMITER)) {
    const end = doc.raw.indexOf(FM_END, FM_DELIMITER.length);
    if (end !== -1) {
      const fmBlock = doc.raw.slice(0, end + FM_END.length);
      writeFileSync(path, `${fmBlock}\n# ${heading}\n\n${newBody.trim()}\n`, 'utf8');
      return;
    }
  }

  writeFileSync(path, `# ${heading}\n\n${newBody.trim()}\n`, 'utf8');
}

export function readHeading(path: string): string {
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/u)) {
    if (line.startsWith('# ')) {
      return line.slice(2).trim();
    }
  }
  return '';
}

function deriveLegacyTitle(raw: string): string | undefined {
  for (const line of raw.split(/\r?\n/u)) {
    if (!line.startsWith('# ')) {
      continue;
    }

    const title = line.slice(2).trim();
    if (title.length > 0) {
      return title;
    }
  }

  return undefined;
}
