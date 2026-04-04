import { z } from 'zod';

export const LANES = ['inbox', 'asap', 'up-next', 'cool-ideas', 'bad-code'] as const;
export const LaneSchema = z.enum([...LANES, 'root']);
export type Lane = z.infer<typeof LaneSchema>;

export const BACKLOG_DIR = 'docs/method/backlog';
export const DESIGN_DIR = 'docs/design';
export const RETRO_DIR = 'docs/method/retro';

export const OutcomeSchema = z.enum(['hill-met', 'partial', 'not-met']);
export type Outcome = z.infer<typeof OutcomeSchema>;

export const CycleSchema = z.object({
  name: z.string(),
  number: z.number().int().min(1),
  slug: z.string(),
  designDoc: z.string(),
  retroDoc: z.string(),
});
export type Cycle = z.infer<typeof CycleSchema>;

export const BacklogItemSchema = z.object({
  stem: z.string(),
  lane: LaneSchema,
  path: z.string(),
  legend: z.string().optional(),
  slug: z.string(),
});
export type BacklogItem = z.infer<typeof BacklogItemSchema>;

export const LegendHealthSchema = z.object({
  legend: z.string(),
  backlog: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
});
export type LegendHealth = z.infer<typeof LegendHealthSchema>;

export const WorkspaceStatusSchema = z.object({
  root: z.string(),
  backlog: z.record(LaneSchema, z.array(BacklogItemSchema)),
  activeCycles: z.array(CycleSchema),
  legendHealth: z.array(LegendHealthSchema),
});
export type WorkspaceStatus = z.infer<typeof WorkspaceStatusSchema>;
