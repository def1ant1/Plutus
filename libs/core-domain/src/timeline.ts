import type { WorkflowDefinition, WorkflowStepDefinition } from './workflow-definition';
import type { WorkflowEvent, WorkflowState } from './workflow-state';

/** Enumerates the statuses surfaced to UI clients. */
export type WorkflowStepStatus = 'Pending' | 'Active' | 'Completed' | 'Failed';

/**
 * Timeline entry representing a step enriched with runtime state and analytics
 * friendly metadata for dashboards or customer support tooling.
 */
export interface WorkflowTimelineEntry {
  readonly stepId: string;
  readonly name: string;
  readonly description: string;
  readonly stage: string;
  readonly order: number;
  readonly status: WorkflowStepStatus;
  readonly expectedDurationSeconds: number;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly failedAt?: Date;
  readonly metadata?: Record<string, unknown>;
}

/** Snapshot structure returned by {@link buildWorkflowTimeline}. */
export interface WorkflowTimelineSnapshot {
  readonly definitionId: string;
  readonly version: string;
  readonly generatedAt: Date;
  readonly entries: readonly WorkflowTimelineEntry[];
  readonly totalExpectedDurationSeconds: number;
  readonly completedExpectedDurationSeconds: number;
}

const findEvent = <T extends WorkflowEvent['type']>(
  history: readonly WorkflowEvent[],
  stepId: string,
  type: T,
): WorkflowEvent & { type: T } | undefined =>
  history.find(
    (event): event is WorkflowEvent & { type: T } =>
      event.stepId === stepId && event.type === type,
  );

const computeStatus = (
  state: WorkflowState,
  step: WorkflowStepDefinition,
): WorkflowStepStatus => {
  if (state.failedStepIds.includes(step.id)) {
    return 'Failed';
  }
  if (state.completedStepIds.includes(step.id)) {
    return 'Completed';
  }
  if (state.activeStepId === step.id) {
    return 'Active';
  }
  return 'Pending';
};

const deriveEntry = (
  state: WorkflowState,
  step: WorkflowStepDefinition,
): WorkflowTimelineEntry => {
  const startedAt = findEvent(state.history, step.id, 'STEP_ACTIVATED')?.occurredAt;
  const completedAt = findEvent(state.history, step.id, 'STEP_COMPLETED')?.occurredAt;
  const failedAt = findEvent(state.history, step.id, 'STEP_FAILED')?.occurredAt;

  return {
    stepId: step.id,
    name: step.name,
    description: step.description,
    stage: step.stage,
    order: step.order,
    status: computeStatus(state, step),
    expectedDurationSeconds: step.expectedDurationSeconds ?? 0,
    startedAt,
    completedAt,
    failedAt,
    metadata: step.metadata,
  };
};

/**
 * Assemble a timeline snapshot for analytics, UI rendering, or status
 * webhooks. The structure is optimized for read-heavy workloads to minimize
 * repeated derivation logic in callers.
 */
export const buildWorkflowTimeline = (
  definition: WorkflowDefinition,
  state: WorkflowState,
): WorkflowTimelineSnapshot => {
  const entries = definition.orderedStepIds.map((stepId) =>
    deriveEntry(state, definition.steps[stepId]),
  );

  const completedExpectedDurationSeconds = entries
    .filter((entry) => entry.status === 'Completed')
    .reduce((total, entry) => total + entry.expectedDurationSeconds, 0);

  return {
    definitionId: definition.id,
    version: definition.version,
    generatedAt: new Date(),
    entries,
    totalExpectedDurationSeconds: definition.totalExpectedDurationSeconds,
    completedExpectedDurationSeconds,
  };
};
