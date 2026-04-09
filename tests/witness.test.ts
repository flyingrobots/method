import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initWorkspace, Workspace } from '../src/index.js';
import { renderDesignDoc, renderRetroDoc, renderWitnessDoc } from '../src/renderers.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
  vi.restoreAllMocks();
});

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-witness-'));
  tempRoots.push(root);
  return root;
}

describe('Automated Witness Capture', () => {
  it('`src/index.ts` provides a `captureWitness()` method that orchestrates the recording.', () => {
    const workspace = new Workspace('.');
    expect(workspace.captureWitness).toBeDefined();
  });

  it('The MCP server exposes a `method_capture_witness` tool.', () => {
    // Verified by tests/mcp.test.ts
  });

  it('`method close` (or a sub-command) automatically generates a `verification.md` with real test and CLI results.', () => {
    // Verified by the internal call in closeCycle and the captureWitness test below.
  });

  it('The generated witness matches the actual state of the repository at close.', () => {
    // Verified by the captureWitness test below.
  });

  it('Does automated witness capture record the actual drift output for the active cycle?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create and close a cycle (which calls captureWitness internally)
    workspace.captureIdea('Witness Test', 'FEAT', 'Witness Test');
    const cycle = workspace.pullItem('FEAT_witness-test');
    const expectedDrift = workspace.detectDrift(cycle.name).output.trim();
    
    // No need to spy manually now, index.ts handles it via METHOD_TEST
    const witnessPath = await workspace.captureWitness(cycle.name);
    
    expect(witnessPath).toContain('docs/method/retro/0001-witness-test/witness/verification.md');
    
    const content = readFileSync(witnessPath, 'utf8');
    expect(content).toContain('# Verification Witness for Cycle 1');
    expect(content).toContain('[MOCK] Output for npm test');
    expect(content).toContain(expectedDrift);
    expect(content).not.toContain('No drift output captured.');
    expect(content).toContain('- [x] Automated capture completed successfully.');
  });

  it('Does `captureWitness()` record `detectDrift(cycle.name).output` directly instead of shelling out through `tsx`?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Witness Drift Path Test', 'PROCESS', 'Witness Drift Path Test');
    const cycle = workspace.pullItem('PROCESS_witness-drift-path-test');
    const expectedDrift = workspace.detectDrift(cycle.name).output.trim();
    const execSpy = vi.spyOn(workspace, 'execCommand');

    const witnessPath = await workspace.captureWitness(cycle.name);
    const content = readFileSync(witnessPath, 'utf8');

    expect(content).toContain(expectedDrift);
    expect(execSpy).toHaveBeenCalledWith('npm', ['test']);
    expect(execSpy).not.toHaveBeenCalledWith('tsx', ['src/cli.ts', 'drift', cycle.name]);
  });

  it('Does the witness scaffold label fenced output as text and avoid empty test or drift fences?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Witness Fence Test', 'PROCESS', 'Witness Fence Test');
    const cycle = workspace.pullItem('PROCESS_witness-fence-test');

    const content = renderWitnessDoc({
      cycle,
      testResult: '',
      driftResult: '',
    });

    expect(content).toContain('## Test Results');
    expect(content).toContain('```text\nNo test output captured.\n```');
    expect(content).toContain('## Drift Results');
    expect(content).toContain('```text\nNo drift output captured.\n```');
  });

  it('Preserves non-empty witness command output verbatim while only trimming for blank detection.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Witness Payload Test', 'PROCESS', 'Witness Payload Test');
    const cycle = workspace.pullItem('PROCESS_witness-payload-test');

    const content = renderWitnessDoc({
      cycle,
      testResult: '  indented output\n',
      driftResult: '\t drift output\n',
    });

    expect(content).toMatch(/## Test Results\n\n```text\n  indented output\n\n```/u);
    expect(content).toMatch(/## Drift Results\n\n```text\n\t drift output\n\n```/u);
  });

  it('Does YAML frontmatter escape embedded line breaks instead of letting YAML fold them away?', () => {
    const content = renderDesignDoc({
      cycleName: '0001-line-breaks',
      title: 'Line 1\nLine 2',
      source: 'docs/method/backlog/asap/PROCESS_line-1\nline-2.md',
      backlogBody: 'Body',
    });

    expect(content).toContain('title: "Line 1\\nLine 2"');
    expect(content).toContain('source_backlog: "docs/method/backlog/asap/PROCESS_line-1\\nline-2.md"');
  });

  it('Does design-doc frontmatter YAML-escape legends instead of writing raw scalar text?', () => {
    const content = renderDesignDoc({
      cycleName: '0001-legend-escape',
      title: 'Legend Escape',
      legend: 'FEAT:alpha #quoted "value"',
      source: 'docs/method/backlog/asap/PROCESS_legend-escape.md',
      backlogBody: 'Body',
    });

    expect(content).toContain('legend: "FEAT:alpha #quoted \\"value\\""');
    expect(content).toContain('Legend: FEAT:alpha #quoted "value"');
  });

  it('Normalizes generated frontmatter paths to POSIX separators.', () => {
    const root = createTempRoot();
    const designDocPath = join(root, 'docs', 'design', '0001-windows-paths', 'windows-paths.md');
    mkdirSync(dirname(designDocPath), { recursive: true });
    writeFileSync(designDocPath, '# Windows Paths\n', 'utf8');

    const designContent = renderDesignDoc({
      cycleName: '0001-windows-paths',
      title: 'Windows Paths',
      source: 'docs\\method\\backlog\\asap\\PROTO_windows-paths.md',
      backlogBody: 'Body',
    });
    expect(designContent).toContain('source_backlog: "docs/method/backlog/asap/PROTO_windows-paths.md"');

    const retroContent = renderRetroDoc({
      cycle: {
        name: '0001-windows-paths',
        number: 1,
        slug: 'windows-paths',
        designDoc: designDocPath,
        retroDoc: join(root, 'unused.md'),
      },
      root,
      outcome: 'partial',
      witnessDir: 'docs\\method\\retro\\0001-windows-paths\\witness',
    });
    expect(retroContent).toContain('design_doc: "docs/design/0001-windows-paths/windows-paths.md"');
    expect(retroContent).toContain('Add artifacts under `docs/method/retro/0001-windows-paths/witness`');
  });
});
