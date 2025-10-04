import type { WorkflowDefinition } from './workflow-definition';

/**
 * Contextual identifiers that allow orchestration services to correlate runtime
 * state back to upstream systems such as the portal, underwriting engines, or
 * audit logs.
 */
export interface WorkflowContext {
  /** Tenant identifier that scoping multi-tenant data segregation. */
  readonly tenantId: string;
  /** Application identifier or business key representing the orchestration target. */
  readonly applicationId: string;
  /** Request-scoped correlation identifier to join telemetry and logs. */
  readonly correlationId: string;
  /** Optional metadata bag for arbitrary attributes (segment, campaign, etc.). */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Event emitted as the workflow transitions between states.
 */
export type WorkflowEvent =
  | {
      readonly type: 'WORKFLOW_INITIALIZED';
      readonly occurredAt: Date;
      readonly stepId: string;
    }
  | {
      readonly type: 'STEP_ACTIVATED';
      readonly stepId: string;
      readonly occurredAt: Date;
      readonly reason: 'initial-entry' | 'dependency-satisfied' | 'manual-retry';
    }
  | {
      readonly type: 'STEP_COMPLETED';
      readonly stepId: string;
      readonly occurredAt: Date;
      readonly notes?: string;
    }
  | {
      readonly type: 'STEP_FAILED';
      readonly stepId: string;
      readonly occurredAt: Date;
      readonly reason?: string;
      readonly retryable?: boolean;
    };

/**
 * Runtime representation of a workflow for a specific application instance.
 */
export interface WorkflowState {
  readonly definitionId: string;
  readonly definitionVersion: string;
  readonly context: WorkflowContext;
  readonly activeStepId: string | null;
  readonly completedStepIds: readonly string[];
  readonly failedStepIds: readonly string[];
  readonly history: readonly WorkflowEvent[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Options bag for {@link initializeWorkflow} allowing test harnesses to
 * override timestamp behaviour.
 */
export interface InitializeWorkflowOptions {
  /** Explicit timestamp for deterministic testing. Defaults to {@link Date.now}. */
  readonly timestamp?: Date;
  /** Additional metadata stored on the runtime state. */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Internal helper to derive a workflow state skeleton that callers can extend.
 */
export const createEmptyState = (
  definition: WorkflowDefinition,
  context: WorkflowContext,
  timestamp: Date,
  metadata?: Record<string, unknown>,
): WorkflowState => ({
  definitionId: definition.id,
  definitionVersion: definition.version,
  context,
  activeStepId: null,
  completedStepIds: [],
  failedStepIds: [],
  history: [],
  createdAt: timestamp,
  updatedAt: timestamp,
  metadata,
});
