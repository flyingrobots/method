import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { headerBox, separator } from '@flyingrobots/bijou';
import { createNodeContext } from '@flyingrobots/bijou-node';
import { parse as parseYaml } from 'yaml';
import { ConfigSchema, DEFAULT_PATHS, type PathsConfig, PathsSchema } from './config.js';
import type {
  DoctorCheck,
  DoctorCheckId,
  DoctorIssue,
  DoctorReceipt,
  DoctorRepairKind,
  DoctorReport,
  DoctorSeverity,
  DoctorStatus,
} from './domain.js';
import { isLaneName } from './domain.js';
import { workspaceScaffold } from './index.js';
import { collectMarkdownFiles as collectMarkdownFilesShared } from './workspace-utils.js';

interface ConfigInspection {
  paths: PathsConfig | null;
  issues: DoctorIssue[];
}

const DOCTOR_CHECKS: readonly DoctorCheckId[] = ['config', 'structure', 'frontmatter', 'git-hooks', 'backlog'] as const;

export type DoctorRepairMode = 'plan' | 'apply';

export interface DoctorRepairAction {
  issueCode: string;
  kind: DoctorRepairKind;
  targetPath: string;
  status: 'planned' | 'applied' | 'skipped';
  reason?: string;
}

export interface DoctorRepairResult {
  root: string;
  mode: DoctorRepairMode;
  ok: boolean;
  selectedIssues: DoctorIssue[];
  repairs: DoctorRepairAction[];
  touchedPaths: string[];
  unresolvedIssues: DoctorIssue[];
}

export interface DoctorMigrateResult {
  root: string;
  ok: boolean;
  changed: boolean;
  initialReport: DoctorReport;
  repair: DoctorRepairResult;
  finalReport: DoctorReport;
}

export function runDoctor(root: string): DoctorReport {
  const configInspection = inspectConfig(root);
  const structureIssues = configInspection.paths === null ? [] : inspectStructure(root, configInspection.paths);
  const frontmatterIssues = configInspection.paths === null ? [] : inspectFrontmatter(root, configInspection.paths);
  const gitHookIssues = inspectGitHooks(root);
  const backlogIssues = configInspection.paths === null ? [] : inspectBacklog(root, configInspection.paths);

  const issues = [...configInspection.issues, ...structureIssues, ...frontmatterIssues, ...gitHookIssues, ...backlogIssues];

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

export function generateDoctorReceipt(root: string): DoctorReceipt {
  const report = runDoctor(root);
  let commitSha = 'unknown';
  try {
    commitSha = runGit(['rev-parse', 'HEAD'], root);
  } catch {
    // Not a git repo or no commits — receipt still valid, just unanchored
  }

  return {
    generated_at: new Date().toISOString(),
    commit_sha: commitSha,
    status: report.status,
    counts: report.counts,
    checks: report.checks,
  };
}

export function renderDoctorText(report: DoctorReport): string {
  const ctx = createNodeContext();
  const checkLines = report.checks.map((check) => `${check.id.padEnd(12, ' ')} ${check.status.padEnd(5, ' ')} ${check.message}`);

  const issueLines =
    report.issues.length === 0
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

export function runDoctorRepair(root: string, mode: DoctorRepairMode): DoctorRepairResult {
  const initialReport = runDoctor(root);
  const selectedIssues = initialReport.issues.filter((issue) => issue.repair !== undefined);

  if (mode === 'plan') {
    return {
      root,
      mode,
      ok: true,
      selectedIssues,
      repairs: selectedIssues.map((issue) => ({
        issueCode: issue.code,
        kind: issue.repair!.kind,
        targetPath: issue.repair!.targetPath,
        status: 'planned' as const,
      })),
      touchedPaths: [],
      unresolvedIssues: initialReport.issues,
    };
  }

  const touchedPaths = new Set<string>();
  const repairs = selectedIssues.map((issue) => {
    const repair = issue.repair!;
    const outcome = applyRepair(root, issue);
    if (outcome.touchedPath !== undefined) {
      touchedPaths.add(outcome.touchedPath);
    }
    return {
      issueCode: issue.code,
      kind: repair.kind,
      targetPath: repair.targetPath,
      status: outcome.status,
      reason: outcome.reason,
    } satisfies DoctorRepairAction;
  });
  const unresolvedIssues = runDoctor(root).issues;

  return {
    root,
    mode,
    ok: repairs.every((repair) => repair.status !== 'skipped'),
    selectedIssues,
    repairs,
    touchedPaths: [...touchedPaths].sort((left, right) => left.localeCompare(right)),
    unresolvedIssues,
  };
}

export function runDoctorMigrate(root: string): DoctorMigrateResult {
  const initialReport = runDoctor(root);
  const hasRepairableIssues = initialReport.issues.some((issue) => issue.repair !== undefined);
  const repair = hasRepairableIssues
    ? runDoctorRepair(root, 'apply')
    : {
        root,
        mode: 'apply' as const,
        ok: true,
        selectedIssues: [],
        repairs: [],
        touchedPaths: [],
        unresolvedIssues: initialReport.issues,
      };
  const finalReport = runDoctor(root);

  return {
    root,
    ok: repair.ok && finalReport.status !== 'error',
    changed: repair.touchedPaths.length > 0,
    initialReport,
    repair,
    finalReport,
  };
}

export function renderDoctorRepairText(result: DoctorRepairResult): string {
  const title = result.mode === 'plan' ? 'METHOD Repair Plan' : 'METHOD Repair Apply';
  const ctx = createNodeContext();
  const repairLines =
    result.repairs.length === 0
      ? ['No repairable issues selected.']
      : result.repairs.map((repair) => {
          const suffix = repair.reason === undefined ? '' : ` (${repair.reason})`;
          return `- [${repair.status}] ${repair.kind}: ${repair.targetPath}${suffix}`;
        });
  const unresolvedLines =
    result.unresolvedIssues.length === 0
      ? ['No unresolved issues remain.']
      : result.unresolvedIssues.map((issue) => {
          const target = issue.path === undefined ? '' : ` (${issue.path})`;
          return `- [${issue.severity}] ${issue.code}${target}`;
        });
  const touched = result.touchedPaths.length === 0 ? '-' : result.touchedPaths.join(', ');

  return [
    `${headerBox(title, { detail: result.root, ctx })}`,
    '',
    `Selected issues: ${result.selectedIssues.length}`,
    `Touched paths: ${touched}`,
    `Command ok: ${result.ok ? 'yes' : 'no'}`,
    '',
    `${separator({ label: 'Repairs', ctx })}`,
    ...repairLines,
    '',
    `${separator({ label: 'Unresolved', ctx })}`,
    ...unresolvedLines,
    '',
  ].join('\n');
}

export function renderDoctorMigrateText(result: DoctorMigrateResult): string {
  const ctx = createNodeContext();
  const touched = result.repair.touchedPaths.length === 0 ? '-' : result.repair.touchedPaths.join(', ');
  const repairLines =
    result.repair.repairs.length === 0
      ? ['No bounded repairs were applied.']
      : result.repair.repairs.map((repair) => {
          const suffix = repair.reason === undefined ? '' : ` (${repair.reason})`;
          return `- [${repair.status}] ${repair.kind}: ${repair.targetPath}${suffix}`;
        });
  const finalIssueLines =
    result.finalReport.issues.length === 0
      ? ['No issues remain.']
      : result.finalReport.issues.map((issue) => {
          const target = issue.path === undefined ? '' : ` (${issue.path})`;
          return `- [${issue.severity}] ${issue.code}${target}`;
        });

  return [
    `${headerBox('METHOD Migrate', { detail: result.root, ctx })}`,
    '',
    `Before: ${result.initialReport.status} (${result.initialReport.counts.errors} errors, ${result.initialReport.counts.warnings} warnings)`,
    `After: ${result.finalReport.status} (${result.finalReport.counts.errors} errors, ${result.finalReport.counts.warnings} warnings)`,
    `Changed: ${result.changed ? 'yes' : 'no'}`,
    `Command ok: ${result.ok ? 'yes' : 'no'}`,
    `Touched paths: ${touched}`,
    '',
    `${separator({ label: 'Repairs', ctx })}`,
    ...repairLines,
    '',
    `${separator({ label: 'Remaining Issues', ctx })}`,
    ...finalIssueLines,
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
    rawConfig !== null && typeof rawConfig === 'object' ? ('paths' in rawConfig ? (rawConfig as { paths?: unknown }).paths : {}) : {},
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
    resolve(root, 'docs/PROCESS.md'),
    resolve(root, 'docs/RELEASE.md'),
    resolve(root, paths.method_dir, 'releases/README.md'),
    resolve(root, 'docs/releases/README.md'),
  ];

  const issues: DoctorIssue[] = [];

  for (const directory of requiredDirectories) {
    if (isDirectoryPath(directory)) {
      const gitkeepPath = resolve(directory, '.gitkeep');
      if (!existsSync(gitkeepPath)) {
        const relGitkeep = `${relative(root, directory)}/.gitkeep`;
        issues.push(
          createIssue(
            'missing-gitkeep',
            'structure',
            'warning',
            'A required METHOD directory is missing its `.gitkeep` file and may vanish on clone.',
            relGitkeep,
            `Run \`method init\` or create \`${relGitkeep}\` so the directory survives git clone.`,
            { kind: 'create-gitkeep', targetPath: relGitkeep },
          ),
        );
      }
      continue;
    }
    if (existsSync(directory)) {
      issues.push(
        createIssue(
          'path-not-directory',
          'structure',
          'error',
          'A required METHOD directory path exists, but it is not a directory.',
          relative(root, directory),
          `Replace \`${relative(root, directory)}\` with a directory before running METHOD workspace commands.`,
        ),
      );
      continue;
    }
    issues.push(
      createIssue(
        'missing-directory',
        'structure',
        'error',
        'A required METHOD directory is missing.',
        relative(root, directory),
        `Run \`method init\` in \`${root}\` or recreate \`${relative(root, directory)}\`.`,
        { kind: 'create-directory', targetPath: relative(root, directory) },
      ),
    );
  }

  for (const file of requiredFiles) {
    if (isFilePath(file)) {
      continue;
    }
    if (existsSync(file)) {
      issues.push(
        createIssue(
          'path-not-file',
          'structure',
          'error',
          'A required METHOD file path exists, but it is not a file.',
          relative(root, file),
          `Replace \`${relative(root, file)}\` with a regular file before running METHOD workspace commands.`,
        ),
      );
      continue;
    }
    issues.push(
      createIssue(
        'missing-file',
        'structure',
        'error',
        'A required METHOD file is missing.',
        relative(root, file),
        `Run \`method init\` in \`${root}\` or restore \`${relative(root, file)}\`.`,
        { kind: 'restore-file', targetPath: relative(root, file) },
      ),
    );
  }

  // Detect legacy nested design doc directories
  const designDir = resolve(root, paths.design);
  if (isDirectoryPath(designDir)) {
    for (const entry of readdirSync(designDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) {
        continue;
      }
      const subdir = resolve(designDir, entry.name);
      const mdFiles = readdirSync(subdir).filter((name) => name.endsWith('.md'));
      if (mdFiles.length > 0) {
        const relDir = relative(root, subdir);
        issues.push(
          createIssue(
            'legacy-design-layout',
            'structure',
            'warning',
            'Design doc lives in a subdirectory instead of as a flat file under the design root.',
            relDir,
            `Run \`method repair --apply\` to flatten \`${relDir}/\` into \`${paths.design}/<name>.md\`.`,
            { kind: 'flatten-design-doc', targetPath: relDir },
          ),
        );
      }
    }
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
        issues.push(
          createIssue(
            'missing-frontmatter',
            'frontmatter',
            'error',
            'METHOD packet markdown is missing a YAML frontmatter block.',
            relativePath,
            `Add a top-of-file \`---\` frontmatter block to \`${relativePath}\`.`,
            { kind: 'frontmatter-stub', targetPath: relativePath },
          ),
        );
        continue;
      }

      const rest = raw.slice(opening[0].length);
      const closing = /\r?\n---(?:\r?\n|$)/u.exec(rest);
      if (closing === null) {
        issues.push(
          createIssue(
            'unterminated-frontmatter',
            'frontmatter',
            'error',
            'YAML frontmatter is missing the closing delimiter.',
            relativePath,
            `Close the frontmatter block in \`${relativePath}\` with a terminating \`---\` line.`,
          ),
        );
        continue;
      }

      const end = opening[0].length + closing.index;
      const yamlBlock = raw.slice(opening[0].length, end);
      try {
        const parsed = parseYaml(yamlBlock);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          issues.push(
            createIssue(
              'frontmatter-not-mapping',
              'frontmatter',
              'error',
              'Frontmatter must parse to a YAML mapping/object.',
              relativePath,
              `Rewrite the frontmatter in \`${relativePath}\` as key/value pairs.`,
            ),
          );
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        issues.push(
          createIssue(
            'frontmatter-parse-failed',
            'frontmatter',
            'error',
            'YAML frontmatter does not parse cleanly.',
            relativePath,
            `Fix the YAML syntax in \`${relativePath}\`: ${message}`,
          ),
        );
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
    const segments = relativeToBacklog.split(/[\\/]/u).filter((segment) => segment.length > 0);
    const [firstSegment] = segments;
    if (segments.length > 1 && firstSegment !== undefined && isLaneName(firstSegment)) {
      continue;
    }

    const relativePath = relative(root, file);
    issues.push(
      createIssue(
        'orphaned-backlog-item',
        'backlog',
        'warning',
        'Backlog markdown exists outside the recognized lane directories.',
        relativePath,
        `Move \`${relativePath}\` into \`${paths.backlog}/<lane>/\` or retire it into \`${paths.graveyard}\`.`,
      ),
    );
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
  repair?: DoctorIssue['repair'],
): DoctorIssue {
  return {
    code,
    check,
    severity,
    message,
    path,
    fix,
    repair,
  };
}

function applyRepair(root: string, issue: DoctorIssue): { status: 'applied' | 'skipped'; touchedPath?: string; reason?: string } {
  const repair = issue.repair;
  if (repair === undefined) {
    return { status: 'skipped', reason: 'no-repair-hint' };
  }

  const target = resolve(root, repair.targetPath);
  if (repair.kind === 'create-directory') {
    if (isDirectoryPath(target)) {
      return { status: 'skipped', reason: 'already-exists' };
    }
    if (existsSync(target)) {
      return { status: 'skipped', reason: 'path-exists-as-file' };
    }
    mkdirSync(target, { recursive: true });
    return { status: 'applied', touchedPath: repair.targetPath };
  }

  if (repair.kind === 'restore-file') {
    if (isFilePath(target)) {
      return { status: 'skipped', reason: 'already-exists' };
    }
    if (existsSync(target)) {
      return { status: 'skipped', reason: 'path-exists-as-directory' };
    }
    const content = scaffoldContentForPath(root, repair.targetPath);
    if (content === undefined) {
      return { status: 'skipped', reason: 'no-scaffold-template' };
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, 'utf8');
    return { status: 'applied', touchedPath: repair.targetPath };
  }

  if (repair.kind === 'frontmatter-stub') {
    if (!isFilePath(target)) {
      return { status: 'skipped', reason: 'file-missing' };
    }
    const raw = readFileSync(target, 'utf8');
    if (/^\uFEFF?---\r?\n/u.test(raw)) {
      return { status: 'skipped', reason: 'frontmatter-present' };
    }
    const normalized = raw.replace(/^\uFEFF/u, '');
    const title = inferFrontmatterTitle(repair.targetPath, normalized);
    const frontmatter = ['---', `title: "${title.replace(/"/gu, '\\"')}"`, '---'].join('\n');
    writeFileSync(target, normalized.length === 0 ? `${frontmatter}\n` : `${frontmatter}\n\n${normalized}`, 'utf8');
    return { status: 'applied', touchedPath: repair.targetPath };
  }

  if (repair.kind === 'create-gitkeep') {
    if (isFilePath(target)) {
      return { status: 'skipped', reason: 'already-exists' };
    }
    const parentDir = dirname(target);
    if (!isDirectoryPath(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }
    writeFileSync(target, '', 'utf8');
    return { status: 'applied', touchedPath: repair.targetPath };
  }

  if (repair.kind === 'flatten-design-doc') {
    if (!isDirectoryPath(target)) {
      return { status: 'skipped', reason: 'directory-missing' };
    }
    const mdFiles = readdirSync(target).filter((name) => name.endsWith('.md'));
    if (mdFiles.length === 0) {
      return { status: 'skipped', reason: 'no-md-files' };
    }
    const sourceFile = resolve(target, mdFiles[0]);
    const raw = readFileSync(sourceFile, 'utf8');

    // Derive the new cycle name from frontmatter legend + slug, or fall back to dir name
    const dirName = basename(target);
    const legacyMatch = /^(\d{4})-(.+)$/u.exec(dirName);
    const slug = legacyMatch !== null ? legacyMatch[2] : dirName;
    const legendMatch = /^legend:\s*"?([A-Z][A-Z0-9]*)"?\s*$/mu.exec(raw);
    const legend = legendMatch !== null ? legendMatch[1] : undefined;
    const cycleName = legend !== undefined ? `${legend}_${slug}` : slug;

    const designRoot = dirname(target);
    const flatPath = resolve(designRoot, `${cycleName}.md`);
    if (existsSync(flatPath)) {
      return { status: 'skipped', reason: 'flat-target-exists' };
    }

    // Update the cycle frontmatter field if present
    const updated = raw.replace(/^(cycle:\s*)"[^"]*"\s*$/mu, `$1"${cycleName}"`);
    writeFileSync(flatPath, updated, 'utf8');

    // Remove the old directory (all files should be the single md)
    rmSync(target, { recursive: true });

    // Also rename the corresponding retro directory if it exists
    const configInspection = inspectConfig(root);
    const paths = configInspection.paths ?? DEFAULT_PATHS;
    const retroDir = resolve(root, paths.retro, dirName);
    if (isDirectoryPath(retroDir) && dirName !== cycleName) {
      const newRetroDir = resolve(root, paths.retro, cycleName);
      if (!existsSync(newRetroDir)) {
        renameSync(retroDir, newRetroDir);
        // Rename the retro doc inside to match the new cycle name
        const oldRetroDoc = resolve(newRetroDir, `${slug}.md`);
        const newRetroDoc = resolve(newRetroDir, `${cycleName}.md`);
        if (isFilePath(oldRetroDoc) && !existsSync(newRetroDoc)) {
          const retroRaw = readFileSync(oldRetroDoc, 'utf8');
          const retroUpdated = retroRaw
            .replace(/^(cycle:\s*)"[^"]*"\s*$/mu, `$1"${cycleName}"`)
            .replace(/^(design_doc:\s*)"[^"]*"\s*$/mu, `$1"${paths.design}/${cycleName}.md"`);
          writeFileSync(newRetroDoc, retroUpdated, 'utf8');
          if (oldRetroDoc !== newRetroDoc) {
            rmSync(oldRetroDoc);
          }
        }
      }
    }

    return { status: 'applied', touchedPath: relative(root, flatPath) };
  }

  return { status: 'skipped', reason: 'unsupported-repair-kind' };
}

function scaffoldContentForPath(root: string, targetPath: string): string | undefined {
  const configInspection = inspectConfig(root);
  const scaffold = workspaceScaffold(root, configInspection.paths ?? DEFAULT_PATHS);
  return scaffold.files.get(resolve(root, targetPath));
}

function inferFrontmatterTitle(targetPath: string, raw: string): string {
  const heading = /^\s*#\s+(.+)$/mu.exec(raw)?.[1]?.trim();
  if (heading !== undefined && heading.length > 0) {
    return heading;
  }

  const stem = basename(targetPath, '.md')
    .replace(/^[A-Z][A-Z0-9]*_/u, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/u, '');
  return stem
    .split(/[-_]+/u)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// collectMarkdownFiles imported from workspace-utils.ts as collectMarkdownFilesShared
function collectMarkdownFiles(root: string, maxDepth = 10): string[] {
  return collectMarkdownFilesShared(root, maxDepth);
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
  return error instanceof Error && 'status' in error && typeof error.status === 'number' && error.status === 1;
}
