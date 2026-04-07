declare module '@git-stunts/plumbing' {
  export default class GitPlumbing {
    static createDefault(options?: { cwd?: string }): GitPlumbing;
    static createRepository(options?: { cwd?: string }): any;
    execute(options: { args: string[]; input?: string | Uint8Array }): Promise<string>;
    executeWithStatus(options: { args: string[] }): Promise<{ stdout: string; status: number }>;
  }

  export class ShellRunnerFactory {
    static create(options?: { env?: string }): (options: any) => Promise<any>;
  }

  export class GitSha {
    readonly hex: string;
    static EMPTY_TREE_VALUE: string;
  }

  export class GitPlumbingError extends Error {
    constructor(message: string, source?: string, context?: Record<string, unknown>);
  }
}
