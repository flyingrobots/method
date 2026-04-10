import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import { headerBox, separator } from '@flyingrobots/bijou';
import { createNodeContext } from '@flyingrobots/bijou-node';
import { ConfigSchema, DEFAULT_PATHS, PathsSchema, type PathsConfig } from './config.js';
import type { DoctorCheck, DoctorCheckId, DoctorIssue, DoctorReport, DoctorSeverity, DoctorStatus } from './domain.js';
import { LANES } from './domain.js';
import { parse as parseYaml } from 'yaml';

interface ConfigInspection {
  paths: PathsConfig | null;
  issues: DoctorIssue[];
}

const DOCTOR_CHECKS: readonly DoctorCheckId[] = [
  'config',
  'structure',
  'frontmatter',
  'git-hooks',
  'backlog',
] as const;

export function runDoctor(root: string): DoctorReport {
  const configInspection = inspectConfig(root);
  const structureIssues = configInspection.paths === null ? [] : inspectStructure(root, configInspection.paths);
  const frontmatterIssues = configInspection.paths === null ? [] : inspectFrontmatter(root, configInspection.paths);
  const gitHookIssues = inspectGitHooks(root);
  const backlogIssues = configInspection.paths === null ? [] : inspectBacklog(root, configInspection.paths);

  const issues = [
    ...configInspection.issues,
    ...structureIssues,
    ...frontmatterIssues,
    ...gitHookIssues,
    ...backlogIssues,
  ];

  const checks = DOCTOR_CHECKS.map((id) => summarizeCheck(id, issues));
  const counts = {
    errors: issues.filter((issue) => issue.severity === 'error').length,
    warnings: issues.filter((issue) => issue.severity === 'warning').length,
  };

  return {
    root,
    status: summarizeStatus(counts),
    checks,
    issues,
    counts,
  };
}

export function renderDoctorText(report: DoctorReport): string {
  const ctx = createNodeContext();
  const checkLines = report.checks.map((check) =>
    `${check.id.padEnd(12, ' ')} ${check.status.padEnd(5, ' ')} ${check.message}`,
  );

  const issueLines = report.issues.length === 0
    ? ['No issues found.']
    : report.issues.flatMap((issue) => {
      const header = `- [${issue.severity}] ${issue.code}: ${issue.message}`;
      const pathLine = issue.path === undefined ? [] : [`  Path: ${issue.path}`];
      return [header, ...pathLine, `  Fix: ${issue.fix}`];
    });

  return [
    `${headerBox('METHOD Doctor', { detail: report.root, ctx })}`,
    '',
    `Status: ${report.status} (${report.counts.errors} errors, ${report.counts.warnings} warnings)`,
    '',
    `${separator({ label: 'Checks', ctx })}`,
    ...checkLines,
    '',
    `${separator({ label: 'Issues', ctx })}`,
    ...issueLines,
    '',
  ].join('\n');
}

function inspectConfig(root: string): ConfigInspection {
  const configPath = resolve(root, '.method.json');
  if (!existsSync(configPath)) {
    return { paths: DEFAULT_PATHS, issues: [] };
  }

  let rawConfig: unknown;
  try {
    rawConfig = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      paths: null,
      issues: [
        createIssue(
          'config-parse-failed',
          'config',
          'error',
          'The `.method.json` file does not parse as valid JSON.',
          relative(root, configPath),
          `Fix the JSON syntax in \`${relative(root, configPath)}\`: ${message}`,
        ),
      ],
    };
  }

  const parsedConfig = ConfigSchema.safeParse(rawConfig);
  if (parsedConfig.success) {
    return { paths: parsedConfig.data.paths, issues: [] };
  }

  const parsedPaths = PathsSchema.safeParse(
    rawConfig !== null && typeof rawConfig === 'object'
      ? ('paths' in rawConfig ? (rawConfig as { paths?: unknown }).paths : {})
      : {},
  );

  return {
    paths: parsedPaths.success ? parsedPaths.data : null,
    issues: [
      createIssue(
        'config-invalid',
        'config',
        'error',
        'The `.method.json` file parses, but it does not satisfy METHOD configuration rules.',
        relative(root, configPath),
        `Fix the invalid configuration fields in \`${relative(root, configPath)}\`: ${parsedConfig.error.message}`,
      ),
    ],
  };
}

function inspectStructure(root: string, paths: PathsConfig): DoctorIssue[] {
  const requiredDirectories = [
    resolve(root, paths.backlog),
    resolve(root, paths.method_dir, 'legends'),
    resolve(root, paths.graveyard),
    resolve(root, paths.method_dir, 'releases'),
    resolve(root, paths.retro),
    resolve(root, 'docs/releases'),
    resolve(root, paths.design),
  ];
  const requiredFiles = [
    resolve(root, 'CHANGELOG.md'),
    resolve(root, paths.method_dir, 'process.md'),
    resolve(root, paths.method_dir, 'release.md'),
    resolve(root, paths.method_dir, 'release-runbook.md'),
    resolve(root, paths.method_dir, 'releases/README.md'),
    resolve(root, 'docs/releases/README.md'),
  ];

  const issues: DoctorIssue[] = [];

  for (const directory of requiredDirectories) {
    if (isDirectoryPath(directory)) {
      continue;
    }
    if (existsSync(directory)) {
      issues.push(createIssue(
        'path-not-directory',
        'structure',
        'error',
        'A required METHOD directory path exists, but it is not a directory.',
        relative(root, directory),
        `Replace \`${relative(root, directory)}\` with a directory before running METHOD workspace commands.`,
      ));
      continue;
    }
    issues.push(createIssue(
      'missing-directory',
      'structure',
      'error',
      'A required METHOD directory is missing.',
      relative(root, directory),
      `Run \`method init\` in \`${root}\` or recreate \`${relative(root, directory)}\`.`,
    ));
  }

  for (const file of requiredFiles) {
    if (isFilePath(file)) {
      continue;
    }
    if (existsSync(file)) {
      issues.push(createIssue(
        'path-not-file',
        'structure',
        'error',
        'A required METHOD file path exists, but it is not a file.',
        relative(root, file),
        `Replace \`${relative(root, file)}\` with a regular file before running METHOD workspace commands.`,
      ));
      continue;
    }
    issues.push(createIssue(
      'missing-file',
      'structure',
      'error',
      'A required METHOD file is missing.',
      relative(root, file),
      `Run \`method init\` in \`${root}\` or restore \`${relative(root, file)}\`.`,
    ));
  }

  return issues;
}

function inspectFrontmatter(root: string, paths: PathsConfig): DoctorIssue[] {
  const issues: DoctorIssue[] = [];
  const packetRoots = [
    resolve(root, paths.backlog),
    resolve(root, paths.design),
    resolve(root, paths.retro),
    resolve(root, paths.graveyard),
  ];

  for (const packetRoot of packetRoots) {
    if (!isDirectoryPath(packetRoot)) {
      continue;
    }

    for (const file of collectMarkdownFiles(packetRoot)) {
      const relativePath = relative(root, file);
      const raw = readFileSync(file, 'utf8');
      const opening = /^\uFEFF?---\r?\n/u.exec(raw);
      if (opening === null) {
        issues.push(createIssue(
          'missing-frontmatter',
          'frontmatter',
          'error',
          'METHOD packet markdown is missing a YAML frontmatter block.',
          relativePath,
          `Add a top-of-file \`---\` frontmatter block to \`${relativePath}\`.`,
        ));
        continue;
      }

      const rest = raw.slice(opening[0].length);
      const closing = /\r?\n---(?:\r?\n|$)/u.exec(rest);
      if (closing === null) {
        issues.push(createIssue(
          'unterminated-frontmatter',
          'frontmatter',
          'error',
          'YAML frontmatter is missing the closing delimiter.',
          relativePath,
          `Close the frontmatter block in \`${relativePath}\` with a terminating \`---\` line.`,
        ));
        continue;
      }

      const end = opening[0].length + closing.index;
      const yamlBlock = raw.slice(opening[0].length, end);
      try {
        const parsed = parseYaml(yamlBlock);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          issues.push(createIssue(
            'frontmatter-not-mapping',
            'frontmatter',
            'error',
            'Frontmatter must parse to a YAML mapping/object.',
            relativePath,
            `Rewrite the frontmatter in \`${relativePath}\` as key/value pairs.`,
          ));
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        issues.push(createIssue(
          'frontmatter-parse-failed',
          'frontmatter',
          'error',
          'YAML frontmatter does not parse cleanly.',
          relativePath,
          `Fix the YAML syntax in \`${relativePath}\`: ${message}`,
        ));
      }
    }
  }

  return issues;
}

function inspectGitHooks(root: string): DoctorIssue[] {
  try {
    const configuredHooksPath = runGitOptional(['config', '--get', 'core.hooksPath'], root);
    if (configuredHooksPath.length > 0) {
      const hookDir = resolve(root, configuredHooksPath);
      if (!existsSync(hookDir)) {
        return [
          createIssue(
            'git-hooks-missing',
            'git-hooks',
            'warning',
            'Git hooks are configured, but the configured hooks directory does not exist.',
            relative(root, hookDir),
            `Create \`${relative(root, hookDir)}\` or update \`core.hooksPath\` to a valid hooks directory.`,
          ),
        ];
      }

      if (!isDirectoryPath(hookDir)) {
        return [
          createIssue(
            'git-hooks-not-directory',
            'git-hooks',
            'warning',
            'Git hooks are configured, but the configured hooks path is not a directory.',
            relative(root, hookDir),
            `Replace \`${relative(root, hookDir)}\` with a directory or update \`core.hooksPath\` to a valid hooks directory.`,
          ),
        ];
      }

      if (hasInstalledHook(hookDir)) {
        return [];
      }

      return [
        createIssue(
          'git-hooks-empty',
          'git-hooks',
          'warning',
          'Git hooks are configured, but no executable hook files are installed there.',
          relative(root, hookDir),
          `Add an executable hook under \`${relative(root, hookDir)}\` or remove the unused hook configuration.`,
        ),
      ];
    }

    const defaultHooksPath = runGit(['rev-parse', '--git-path', 'hooks'], root);
    const hookDir = resolve(root, defaultHooksPath);
    if (existsSync(hookDir) && !isDirectoryPath(hookDir)) {
      return [
        createIssue(
          'git-hooks-not-directory',
          'git-hooks',
          'warning',
          'The default git hooks path exists, but it is not a directory.',
          relative(root, hookDir),
          `Replace \`${relative(root, hookDir)}\` with a directory before relying on default git hooks.`,
        ),
      ];
    }

    if (hasInstalledHook(hookDir)) {
      return [];
    }

    return [
      createIssue(
        'git-hooks-not-configured',
        'git-hooks',
        'warning',
        'No configured git hooks were found for this repository.',
        relative(root, hookDir),
        'Configure `core.hooksPath` or install at least one executable hook under `.git/hooks/`.',
      ),
    ];
  } catch {
    return [
      createIssue(
        'git-hooks-unavailable',
        'git-hooks',
        'warning',
        'Git repository metadata is unavailable, so hook configuration could not be inspected.',
        undefined,
        'Run `method doctor` from inside a git repository if hook diagnostics are required.',
      ),
    ];
  }
}

function inspectBacklog(root: string, paths: PathsConfig): DoctorIssue[] {
  const backlogRoot = resolve(root, paths.backlog);
  if (!isDirectoryPath(backlogRoot)) {
    return [];
  }

  const issues: DoctorIssue[] = [];
  for (const file of collectMarkdownFiles(backlogRoot)) {
    const relativeToBacklog = relative(backlogRoot, file);
    const [firstSegment] = relativeToBacklog.split(/[\\/]/u);
    if (firstSegment !== undefined && (LANES as readonly string[]).includes(firstSegment)) {
      continue;
    }

    const relativePath = relative(root, file);
    issues.push(createIssue(
      'orphaned-backlog-item',
      'backlog',
      'warning',
      'Backlog markdown exists outside the recognized lane directories.',
      relativePath,
      `Move \`${relativePath}\` into \`${paths.backlog}/<lane>/\` or retire it into \`${paths.graveyard}\`.`,
    ));
  }

  return issues;
}

function summarizeCheck(id: DoctorCheckId, issues: readonly DoctorIssue[]): DoctorCheck {
  const matching = issues.filter((issue) => issue.check === id);
  const errors = matching.filter((issue) => issue.severity === 'error').length;
  const warnings = matching.filter((issue) => issue.severity === 'warning').length;

  if (errors > 0) {
    return {
      id,
      status: 'error',
      message: `${errors} error(s), ${warnings} warning(s)`,
    };
  }

  if (warnings > 0) {
    return {
      id,
      status: 'warn',
      message: `${warnings} warning(s)`,
    };
  }

  return {
    id,
    status: 'ok',
    message: 'No issues found.',
  };
}

function summarizeStatus(counts: { errors: number; warnings: number }): DoctorStatus {
  if (counts.errors > 0) {
    return 'error';
  }
  if (counts.warnings > 0) {
    return 'warn';
  }
  return 'ok';
}

function createIssue(
  code: string,
  check: DoctorCheckId,
  severity: DoctorSeverity,
  message: string,
  path: string | undefined,
  fix: string,
): DoctorIssue {
  return {
    code,
    check,
    severity,
    message,
    path,
    fix,
  };
}

function collectMarkdownFiles(root: string, maxDepth = 10): string[] {
  if (maxDepth <= 0 || !isDirectoryPath(root)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      files.push(...collectMarkdownFiles(path, maxDepth - 1));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function hasInstalledHook(directory: string): boolean {
  if (!isDirectoryPath(directory)) {
    return false;
  }

  return readdirSync(directory).some((entry) => {
    if (entry.endsWith('.sample')) {
      return false;
    }

    const path = resolve(directory, entry);
    const stats = statSync(path);
    if (!stats.isFile()) {
      return false;
    }

    return (stats.mode & 0o111) !== 0 || /\.(cmd|ps1|bat)$/iu.test(basename(entry));
  });
}

function isDirectoryPath(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isFilePath(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function runGit(args: readonly string[], root: string): string {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function runGitOptional(args: readonly string[], root: string): string {
  try {
    return runGit(args, root);
  } catch (error: unknown) {
    if (isExpectedMissingValue(error)) {
      return '';
    }
    throw error;
  }
}

function isExpectedMissingValue(error: unknown): boolean {
  return error instanceof Error
    && 'status' in error
    && typeof error.status === 'number'
    && error.status === 1;
}
