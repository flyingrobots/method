import { z } from 'zod';

export const LANES = ['inbox', 'asap', 'up-next', 'cool-ideas', 'bad-code'] as const;
export const LaneSchema = z.enum([...LANES, 'root']);
export type Lane = z.infer<typeof LaneSchema>;


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

export const DoctorStatusSchema = z.enum(['ok', 'warn', 'error']);
export type DoctorStatus = z.infer<typeof DoctorStatusSchema>;

export const DoctorSeveritySchema = z.enum(['warning', 'error']);
export type DoctorSeverity = z.infer<typeof DoctorSeveritySchema>;

export const DoctorCheckIdSchema = z.enum([
  'config',
  'structure',
  'frontmatter',
  'git-hooks',
  'backlog',
]);
export type DoctorCheckId = z.infer<typeof DoctorCheckIdSchema>;

export const DoctorCheckSchema = z.object({
  id: DoctorCheckIdSchema,
  status: DoctorStatusSchema,
  message: z.string(),
});
export type DoctorCheck = z.infer<typeof DoctorCheckSchema>;

export const DoctorIssueSchema = z.object({
  code: z.string(),
  check: DoctorCheckIdSchema,
  severity: DoctorSeveritySchema,
  message: z.string(),
  path: z.string().optional(),
  fix: z.string(),
});
export type DoctorIssue = z.infer<typeof DoctorIssueSchema>;

export const DoctorReportSchema = z.object({
  root: z.string(),
  status: DoctorStatusSchema,
  checks: z.array(DoctorCheckSchema),
  issues: z.array(DoctorIssueSchema),
  counts: z.object({
    errors: z.number().int().nonnegative(),
    warnings: z.number().int().nonnegative(),
  }),
});
export type DoctorReport = z.infer<typeof DoctorReportSchema>;
