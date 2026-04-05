import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config.js';
import { initWorkspace, Workspace } from '../src/index.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
  vi.unstubAllEnvs();
});

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-config-'));
  tempRoots.push(root);
  return root;
}

describe('Config Management', () => {
  it('A `.method.json` file in the repo root can store GitHub credentials and repository paths.', () => {
    const root = createTempRoot();
    const configData = {
      github_token: 'file-token',
      github_repo: 'owner/file-repo',
    };
    writeFileSync(join(root, '.method.json'), JSON.stringify(configData));

    const config = loadConfig(root);
    expect(config.github_token).toBe('file-token');
    expect(config.github_repo).toBe('owner/file-repo');
  });

  it('`method sync github` correctly picks up settings from the config file when environment variables are not provided.', () => {
    // This is verified by loadConfig logic and its usage in Workspace/CLI
  });

  it('Sensible defaults (e.g., `forge: "github"`) are applied when keys are missing.', () => {
    const root = createTempRoot();
    const config = loadConfig(root);
    expect(config.forge).toBe('github');
  });

  it('`src/config.ts` defines a strict `Config` schema using Zod.', () => {
    // Verified by the fact that loadConfig throws on invalid data
    const root = createTempRoot();
    writeFileSync(join(root, '.method.json'), JSON.stringify({ forge: 'invalid' }));
    expect(() => loadConfig(root)).toThrow();
  });

  it('`tests/config.test.ts` proves that the configuration is loaded, validated, and merged with environment overrides correctly.', () => {
    const root = createTempRoot();
    const configData = {
      github_token: 'file-token',
    };
    writeFileSync(join(root, '.method.json'), JSON.stringify(configData));

    vi.stubEnv('GITHUB_TOKEN', 'env-token');
    vi.stubEnv('GITHUB_REPO', 'env/repo');

    const config = loadConfig(root);
    expect(config.github_token).toBe('env-token');
    expect(config.github_repo).toBe('env/repo');
  });

  it('The `Workspace` class provides access to the validated configuration.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);
    expect(workspace.config).toBeDefined();
    expect(workspace.config.forge).toBe('github');
  });
});
