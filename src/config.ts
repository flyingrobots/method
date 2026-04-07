import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

export const PathsSchema = z.object({
  backlog: z.string().default('docs/method/backlog'),
  design: z.string().default('docs/design'),
  retro: z.string().default('docs/method/retro'),
  tests: z.string().default('tests'),
  graveyard: z.string().default('docs/method/graveyard'),
  method_dir: z.string().default('docs/method'),
});

export type PathsConfig = z.infer<typeof PathsSchema>;

export const DEFAULT_PATHS: PathsConfig = PathsSchema.parse({});

export const ConfigSchema = z.object({
  forge: z.enum(['github']).default('github'),
  github_token: z.string().optional(),
  github_repo: z.string().optional(), // owner/repo
  paths: PathsSchema.default({
    backlog: 'docs/method/backlog',
    design: 'docs/design',
    retro: 'docs/method/retro',
    tests: 'tests',
    graveyard: 'docs/method/graveyard',
    method_dir: 'docs/method',
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(root: string): Config {
  const configPath = join(root, '.method.json');
  let fileConfig: Record<string, unknown> = {};

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf8');
      fileConfig = JSON.parse(content);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse .method.json at ${configPath}: ${message}`);
    }
  }

  // Environment variables override file config
  const envConfig: Record<string, unknown> = {};
  if (process.env.GITHUB_TOKEN) {
    envConfig.github_token = process.env.GITHUB_TOKEN;
  }
  if (process.env.GITHUB_REPO) {
    envConfig.github_repo = process.env.GITHUB_REPO;
  }

  const merged = {
    ...fileConfig,
    ...envConfig,
  };

  const result = ConfigSchema.safeParse(merged);
  if (!result.success) {
    throw new Error(`Invalid configuration: ${result.error.message}`);
  }

  return result.data;
}
