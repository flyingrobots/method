import { describe, expect, it } from 'vitest';
import { replaceGeneratedSections } from '../src/generate.js';

describe('Hybrid Signpost Generation', () => {
  it('replaces content between generate markers without touching surrounding prose', () => {
    const input = [
      '# My Doc',
      '',
      'Hand-written intro.',
      '',
      '<!-- generate:test-section -->',
      'old generated content',
      '<!-- /generate -->',
      '',
      'Hand-written outro.',
    ].join('\n');

    const generators = {
      'test-section': () => 'new generated content\n',
    };

    const result = replaceGeneratedSections(input, generators);

    expect(result).toContain('Hand-written intro.');
    expect(result).toContain('Hand-written outro.');
    expect(result).toContain('new generated content');
    expect(result).not.toContain('old generated content');
    expect(result).toContain('<!-- generate:test-section -->');
    expect(result).toContain('<!-- /generate -->');
  });

  it('handles multiple generate markers in one file', () => {
    const input = [
      '# Doc',
      '',
      '<!-- generate:alpha -->',
      'old alpha',
      '<!-- /generate -->',
      '',
      'middle prose',
      '',
      '<!-- generate:beta -->',
      'old beta',
      '<!-- /generate -->',
    ].join('\n');

    const generators = {
      'alpha': () => 'new alpha\n',
      'beta': () => 'new beta\n',
    };

    const result = replaceGeneratedSections(input, generators);

    expect(result).toContain('new alpha');
    expect(result).toContain('new beta');
    expect(result).toContain('middle prose');
    expect(result).not.toContain('old alpha');
    expect(result).not.toContain('old beta');
  });

  it('leaves file unchanged when no markers exist', () => {
    const input = '# No markers\n\nJust prose.\n';
    const generators = { 'unused': () => 'stuff' };

    const result = replaceGeneratedSections(input, generators);

    expect(result).toBe(input);
  });

  it('leaves marker intact when no generator matches', () => {
    const input = [
      '<!-- generate:unknown -->',
      'existing content',
      '<!-- /generate -->',
    ].join('\n');

    const result = replaceGeneratedSections(input, {});

    expect(result).toContain('existing content');
  });

  it('preserves exact whitespace around markers', () => {
    const input = [
      'before',
      '',
      '<!-- generate:x -->',
      'old',
      '<!-- /generate -->',
      '',
      'after',
    ].join('\n');

    const generators = { 'x': () => 'new\n' };
    const result = replaceGeneratedSections(input, generators);

    expect(result).toBe([
      'before',
      '',
      '<!-- generate:x -->',
      'new',
      '<!-- /generate -->',
      '',
      'after',
    ].join('\n'));
  });
});
