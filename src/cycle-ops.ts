import { basename, dirname, relative, resolve } from 'node:path';
import type { Cycle } from './domain.js';
import { isReleaseLane } from './domain.js';
import { MethodError } from './errors.js';
import { readFrontmatter as fmReadFrontmatter } from './frontmatter.js';
import type { ResolvedPaths } from './index.js';
import { fileStem, normalizeOptionalString, normalizeRepoPath } from './workspace-utils.js';

export const CYCLE_NAME_PATTERN = /^(?:(?<legend>[A-Z][A-Z0-9]*)_)?(?<slug>[a-z0-9][a-z0-9-]*)$/;
export const LEGACY_CYCLE_PATTERN = /^(?<number>\d{4})-(?<slug>[a-z0-9][a-z0-9-]*)$/;

export function resolveCyclePacketPaths(
  root: string,
  paths: ResolvedPaths,
  cycleName: string,
  release?: string,
): { designDoc: string; retroDoc: string } {
  if (release === undefined) {
    return {
      designDoc: resolve(paths.design, `${cycleName}.md`),
      retroDoc: resolve(paths.retro, cycleName, `${cycleName}.md`),
    };
  }

  return {
    designDoc: resolve(root, 'docs/releases', release, 'design', `${cycleName}.md`),
    retroDoc: resolve(root, 'docs/releases', release, 'retros', cycleName, `${cycleName}.md`),
  };
}

export function readCycleFromDoc(root: string, paths: ResolvedPaths, file: string): Cycle | undefined {
  // Flat design doc: docs/design/<cycleName>.md
  if (isFlatDesignDocPath(paths, file)) {
    const stem = fileStem(file);
    const nameMatch = CYCLE_NAME_PATTERN.exec(stem);
    if (nameMatch?.groups === undefined) {
      return undefined;
    }
    return {
      name: stem,
      slug: nameMatch.groups.slug,
      designDoc: file,
      retroDoc: inferRetroDocFromDesign(root, paths, file),
    };
  }

  // Retro in dir: docs/method/retro/<cycleName>/<cycleName>.md
  if (isRetroDocPath(paths, file)) {
    const retroDir = basename(dirname(file));
    const stem = fileStem(file);
    if (stem !== retroDir) {
      return undefined;
    }
    const nameMatch = CYCLE_NAME_PATTERN.exec(stem);
    if (nameMatch?.groups === undefined) {
      return undefined;
    }
    return {
      name: stem,
      slug: nameMatch.groups.slug,
      designDoc: inferDesignDocFromRetro(root, paths, file),
      retroDoc: file,
    };
  }

  // Flat release design doc: docs/releases/v1.0.0/design/<cycleName>.md
  if (isReleaseDesignDocPath(root, file) && dirname(file) !== file) {
    const parentDir = basename(dirname(file));
    if (parentDir === 'design') {
      const stem = fileStem(file);
      const nameMatch = CYCLE_NAME_PATTERN.exec(stem);
      if (nameMatch?.groups !== undefined) {
        return {
          name: stem,
          slug: nameMatch.groups.slug,
          designDoc: file,
          retroDoc: inferRetroDocFromDesign(root, paths, file),
        };
      }
    }
  }

  // Release retro dir: docs/releases/v1.0.0/retros/<cycleName>/<cycleName>.md
  if (isReleaseRetroDocPath(root, file)) {
    const retroDir = basename(dirname(file));
    const stem = fileStem(file);
    if (stem === retroDir) {
      const nameMatch = CYCLE_NAME_PATTERN.exec(stem);
      if (nameMatch?.groups !== undefined) {
        return {
          name: stem,
          slug: nameMatch.groups.slug,
          designDoc: inferDesignDocFromRetro(root, paths, file),
          retroDoc: file,
        };
      }
    }
  }

  // Legacy layout: docs/design/<NNNN-slug>/<slug>.md or retro/<NNNN-slug>/<slug>.md
  const cycleDir = basename(dirname(file));
  const legacyMatch = LEGACY_CYCLE_PATTERN.exec(cycleDir);
  if (legacyMatch?.groups === undefined) {
    return undefined;
  }

  const slug = legacyMatch.groups.slug;
  if (fileStem(file) !== slug) {
    return undefined;
  }

  if (isDesignDocPath(paths, file) || isReleaseDesignDocPath(root, file)) {
    return {
      name: cycleDir,
      slug,
      designDoc: file,
      retroDoc: inferRetroDocFromDesign(root, paths, file),
    };
  }
  if (isRetroDocPath(paths, file) || isReleaseRetroDocPath(root, file)) {
    return {
      name: cycleDir,
      slug,
      designDoc: inferDesignDocFromRetro(root, paths, file),
      retroDoc: file,
    };
  }
  return undefined;
}

export function readCycleRelease(cycle: Cycle): string | undefined {
  const frontmatter = fmReadFrontmatter(cycle.designDoc);
  const release = normalizeOptionalString(frontmatter.release);
  if (release === undefined) {
    return undefined;
  }
  if (!isReleaseLane(release)) {
    throw new MethodError(`Invalid release tag: ${release}`);
  }
  return release;
}

function isFlatDesignDocPath(paths: ResolvedPaths, file: string): boolean {
  return dirname(file) === paths.design && file.endsWith('.md');
}

function isDesignDocPath(paths: ResolvedPaths, file: string): boolean {
  return file.startsWith(`${paths.design}/`);
}

function isRetroDocPath(paths: ResolvedPaths, file: string): boolean {
  return file.startsWith(`${paths.retro}/`);
}

function isReleaseDesignDocPath(root: string, file: string): boolean {
  const normalized = normalizeRepoPath(relative(root, file));
  return /^docs\/releases\/v\d+\.\d+\.\d+\/design\//u.test(normalized);
}

function isReleaseRetroDocPath(root: string, file: string): boolean {
  const normalized = normalizeRepoPath(relative(root, file));
  return /^docs\/releases\/v\d+\.\d+\.\d+\/retros\//u.test(normalized);
}

function inferRetroDocFromDesign(root: string, paths: ResolvedPaths, designDoc: string): string {
  if (isReleaseDesignDocPath(root, designDoc)) {
    const relPath = normalizeRepoPath(relative(root, designDoc));
    const parentDir = basename(dirname(designDoc));
    const stem = fileStem(designDoc);
    // Flat release design: docs/releases/v1.0.0/design/CYCLE.md → retros/CYCLE/CYCLE.md
    if (parentDir === 'design') {
      const retroPath = relPath.replace(/\/design\/[^/]+\.md$/u, `/retros/${stem}/${stem}.md`);
      return resolve(root, retroPath);
    }
    // Legacy release design: docs/releases/v1.0.0/design/NNNN-slug/slug.md → retros/NNNN-slug/slug.md
    return resolve(root, normalizeRepoPath(relative(root, designDoc)).replace('/design/', '/retros/'));
  }
  // Flat design doc: docs/design/CYCLE.md → docs/method/retro/CYCLE/CYCLE.md
  if (isFlatDesignDocPath(paths, designDoc)) {
    const stem = fileStem(designDoc);
    return resolve(paths.retro, stem, `${stem}.md`);
  }
  // Legacy design doc: docs/design/<dir>/<slug>.md → docs/method/retro/<dir>/<slug>.md
  const cycleDir = basename(dirname(designDoc));
  const slug = fileStem(designDoc);
  return resolve(paths.retro, cycleDir, `${slug}.md`);
}

function inferDesignDocFromRetro(root: string, paths: ResolvedPaths, retroDoc: string): string {
  if (isReleaseRetroDocPath(root, retroDoc)) {
    const relPath = normalizeRepoPath(relative(root, retroDoc));
    const retroDir = basename(dirname(retroDoc));
    const stem = fileStem(retroDoc);
    // New format: dir name = file stem → flat design
    if (retroDir === stem) {
      const designPath = relPath.replace(/\/retros\/[^/]+\/[^/]+\.md$/u, `/design/${stem}.md`);
      return resolve(root, designPath);
    }
    // Legacy format: dir name = NNNN-slug, file stem = slug → nested design
    return resolve(root, normalizeRepoPath(relative(root, retroDoc)).replace('/retros/', '/design/'));
  }
  const retroDir = basename(dirname(retroDoc));
  const stem = fileStem(retroDoc);
  // New format: dir name = cycle name = file stem → flat design doc
  if (retroDir === stem) {
    return resolve(paths.design, `${stem}.md`);
  }
  // Legacy format: dir name = NNNN-slug → nested design doc
  return resolve(paths.design, retroDir, `${stem}.md`);
}
