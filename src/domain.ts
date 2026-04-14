import { z } from 'zod';

export const LANES = ['inbox', 'asap', 'bad-code', 'cool-ideas'] as const;
export type CanonicalLane = (typeof LANES)[number];
const CANONICAL_LANE_SET = new Set<string>(LANES);

/**
 * Lane materialization contract:
 *
 * - `init` creates directories for all canonical lanes (`LANES`).
 * - Individual lane directories may be absent when empty without making
 *   the workspace unhealthy. Only the backlog root must exist.
 * - `doctor` does not flag missing lane directories as structural errors.
 * - `status` reports empty lanes as empty, not as failures.
 *
 * This contract is the single source of truth for lane-materialization
 * expectations. `init`, `doctor`, `status`, and backlog queries all
 * share it through `LANES` and this documentation.
 */
export const SCAFFOLD_LANES: readonly string[] = LANES;
const LANE_PATTERN = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/u;
const RELEASE_LANE_PATTERN = /^v(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/u;

export const LaneSchema = z.string().regex(LANE_PATTERN);
export const BacklogLaneSchema = z.union([LaneSchema, z.literal('root')]);
export type Lane = z.infer<typeof LaneSchema>;
export type BacklogLane = z.infer<typeof BacklogLaneSchema>;

export function isCanonicalLane(value: string): value is CanonicalLane {
  return CANONICAL_LANE_SET.has(value);
}

export function isLaneName(value: string): value is Lane {
  return LANE_PATTERN.test(value);
}

export function isReleaseLane(value: string): boolean {
  return RELEASE_LANE_PATTERN.test(value);
}

export function orderedBacklogLaneNames(lanes: Iterable<string>): string[] {
  const unique = new Set(lanes);
  const leadingCanonical = ['inbox', 'asap'].filter((lane): lane is CanonicalLane => unique.has(lane));
  const legacyUpNext = unique.has('up-next') ? ['up-next'] : [];
  const releaseLanes = [...unique].filter((lane) => isReleaseLane(lane)).sort(compareReleaseLaneNames);
  const trailingCanonical = ['bad-code', 'cool-ideas'].filter((lane): lane is CanonicalLane => unique.has(lane));
  const custom = [...unique]
    .filter((lane) => lane !== 'root' && !isCanonicalLane(lane) && lane !== 'up-next' && !isReleaseLane(lane))
    .sort((left, right) => left.localeCompare(right));

  return [...leadingCanonical, ...legacyUpNext, ...releaseLanes, ...trailingCanonical, ...custom, ...(unique.has('root') ? ['root'] : [])];
}

function compareReleaseLaneNames(left: string, right: string): number {
  const leftMatch = RELEASE_LANE_PATTERN.exec(left);
  const rightMatch = RELEASE_LANE_PATTERN.exec(right);
  if (leftMatch?.groups === undefined || rightMatch?.groups === undefined) {
    return left.localeCompare(right);
  }

  const leftParts = [
    Number.parseInt(leftMatch.groups.major, 10),
    Number.parseInt(leftMatch.groups.minor, 10),
    Number.parseInt(leftMatch.groups.patch, 10),
  ];
  const rightParts = [
    Number.parseInt(rightMatch.groups.major, 10),
    Number.parseInt(rightMatch.groups.minor, 10),
    Number.parseInt(rightMatch.groups.patch, 10),
  ];

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index]! - rightParts[index]!;
    }
  }
  return left.localeCompare(right);
}

export const OutcomeSchema = z.enum(['hill-met', 'partial', 'not-met']);
export type Outcome = z.infer<typeof OutcomeSchema>;

export const CycleSchema = z.object({
  name: z.string(),
  slug: z.string(),
  designDoc: z.string(),
  retroDoc: z.string(),
});
export type Cycle = z.infer<typeof CycleSchema>;

export const BacklogItemSchema = z.object({
  stem: z.string(),
  lane: BacklogLaneSchema,
  path: z.string(),
  legend: z.string().optional(),
  slug: z.string(),
});
export type BacklogItem = z.infer<typeof BacklogItemSchema>;

export const BacklogQueryItemSchema = BacklogItemSchema.extend({
  title: z.string().optional(),
  owner: z.string().optional(),
  priority: z.string().optional(),
  keywords: z.array(z.string()),
  blockedBy: z.array(z.string()),
  blocks: z.array(z.string()),
  hasAcceptanceCriteria: z.boolean(),
});
export type BacklogQueryItem = z.infer<typeof BacklogQueryItemSchema>;

export const BacklogQuerySortSchema = z.enum(['lane', 'priority', 'path']);
export type BacklogQuerySort = z.infer<typeof BacklogQuerySortSchema>;

export const BacklogQueryFiltersSchema = z.object({
  lane: BacklogLaneSchema.optional(),
  legend: z.string().optional(),
  priority: z.string().optional(),
  keyword: z.string().optional(),
  owner: z.string().optional(),
  ready: z.boolean().optional(),
  hasAcceptanceCriteria: z.boolean().optional(),
  blockedBy: z.string().optional(),
  blocks: z.string().optional(),
  sort: BacklogQuerySortSchema,
  limit: z.number().int().min(1).max(100),
});
export type BacklogQueryFilters = z.infer<typeof BacklogQueryFiltersSchema>;

export const BacklogQueryResultSchema = z.object({
  root: z.string(),
  filters: BacklogQueryFiltersSchema,
  items: z.array(BacklogQueryItemSchema),
  totalCount: z.number().int().nonnegative(),
  returnedCount: z.number().int().nonnegative(),
  truncated: z.boolean(),
});
export type BacklogQueryResult = z.infer<typeof BacklogQueryResultSchema>;

export const LegendHealthSchema = z.object({
  legend: z.string(),
  backlog: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
});
export type LegendHealth = z.infer<typeof LegendHealthSchema>;

export const WorkspaceStatusSchema = z.object({
  root: z.string(),
  backlog: z.record(z.string(), z.array(BacklogItemSchema)),
  activeCycles: z.array(CycleSchema),
  legendHealth: z.array(LegendHealthSchema),
});
export type WorkspaceStatus = z.infer<typeof WorkspaceStatusSchema>;

export const NextWorkSignalSchema = z.object({
  type: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  source: z.string(),
});
export type NextWorkSignal = z.infer<typeof NextWorkSignalSchema>;

export const NextWorkScoreBandSchema = z.enum(['highest', 'strong', 'worth-considering']);
export type NextWorkScoreBand = z.infer<typeof NextWorkScoreBandSchema>;

export const NextWorkRecommendationSchema = z.object({
  path: z.string(),
  title: z.string(),
  lane: BacklogLaneSchema,
  priority: z.string().optional(),
  scoreBand: NextWorkScoreBandSchema,
  whyNow: z.array(z.string()),
  signals: z.array(NextWorkSignalSchema),
});
export type NextWorkRecommendation = z.infer<typeof NextWorkRecommendationSchema>;

export const NextWorkSummarySchema = z.object({
  active_cycle_count: z.number().int().nonnegative(),
  lane_counts: z.record(z.string(), z.number().int().nonnegative()),
  bearing_priority: z.string().optional(),
  bearing_concerns: z.array(z.string()),
});
export type NextWorkSummary = z.infer<typeof NextWorkSummarySchema>;

export const NextWorkResultSchema = z.object({
  generated_at: z.string(),
  summary: NextWorkSummarySchema,
  recommendations: z.array(NextWorkRecommendationSchema),
  selection_notes: z.array(z.string()),
});
export type NextWorkResult = z.infer<typeof NextWorkResultSchema>;

export const DoctorStatusSchema = z.enum(['ok', 'warn', 'error']);
export type DoctorStatus = z.infer<typeof DoctorStatusSchema>;

export const DoctorSeveritySchema = z.enum(['warning', 'error']);
export type DoctorSeverity = z.infer<typeof DoctorSeveritySchema>;

export const DoctorCheckIdSchema = z.enum(['config', 'structure', 'frontmatter', 'git-hooks', 'backlog']);
export type DoctorCheckId = z.infer<typeof DoctorCheckIdSchema>;

export const DoctorCheckSchema = z.object({
  id: DoctorCheckIdSchema,
  status: DoctorStatusSchema,
  message: z.string(),
});
export type DoctorCheck = z.infer<typeof DoctorCheckSchema>;

export const DoctorRepairKindSchema = z.enum([
  'create-directory',
  'restore-file',
  'frontmatter-stub',
  'flatten-design-doc',
  'create-gitkeep',
]);
export type DoctorRepairKind = z.infer<typeof DoctorRepairKindSchema>;

export const DoctorRepairHintSchema = z.object({
  kind: DoctorRepairKindSchema,
  targetPath: z.string(),
});
export type DoctorRepairHint = z.infer<typeof DoctorRepairHintSchema>;

export const DoctorIssueSchema = z.object({
  code: z.string(),
  check: DoctorCheckIdSchema,
  severity: DoctorSeveritySchema,
  message: z.string(),
  path: z.string().optional(),
  fix: z.string(),
  repair: DoctorRepairHintSchema.optional(),
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

export const DoctorReceiptSchema = z.object({
  generated_at: z.string(),
  commit_sha: z.string(),
  status: DoctorStatusSchema,
  counts: z.object({
    errors: z.number().int().nonnegative(),
    warnings: z.number().int().nonnegative(),
  }),
  checks: z.array(DoctorCheckSchema),
});
export type DoctorReceipt = z.infer<typeof DoctorReceiptSchema>;
