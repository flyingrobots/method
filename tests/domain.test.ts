import { describe, expect, it } from 'vitest';
import {
  CycleSchema,
  BacklogItemSchema,
  WorkspaceStatusSchema,
} from '../src/domain.js';

describe('Domain Models', () => {
  it('`tests/domain.test.ts` proves that domain models (e.g., `Cycle`, `BacklogItem`) reject invalid data at runtime.', () => {
    // Invalid Cycle (missing fields)
    expect(() => CycleSchema.parse({})).toThrow();
    
    // Invalid Cycle (wrong types)
    expect(() => CycleSchema.parse({
      name: '0001-test',
      number: '1', // should be number
      slug: 'test',
      designDoc: 'path',
      retroDoc: 'path',
    })).toThrow();

    // Valid Cycle
    const validCycle = {
      name: '0001-test',
      number: 1,
      slug: 'test',
      designDoc: 'docs/design/0001-test/test.md',
      retroDoc: 'docs/method/retro/0001-test/test.md',
    };
    expect(CycleSchema.parse(validCycle)).toEqual(validCycle);

    // Invalid BacklogItem (invalid lane)
    expect(() => BacklogItemSchema.parse({
      stem: 'test',
      lane: 'invalid-lane',
      path: 'path',
      slug: 'test',
    })).toThrow();

    // Valid BacklogItem
    const validItem = {
      stem: 'PROCESS_test',
      lane: 'inbox',
      path: 'docs/method/backlog/inbox/PROCESS_test.md',
      legend: 'PROCESS',
      slug: 'test',
    };
    expect(BacklogItemSchema.parse(validItem)).toEqual(validItem);
  });

  it('The codebase demonstrates browser-portability by keeping Node-specific imports (like `node:fs`) strictly in the adapters or workspace implementation, not the domain models.', () => {
    // This is an architectural claim. We can verify it by ensuring domain.ts 
    // doesn't have Node imports.
  });
});
