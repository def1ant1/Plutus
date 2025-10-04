import { WorkflowDefinitionError } from './errors';

/**
 * Input describing a discrete step within a workflow definition.
 */
export interface WorkflowStepInput {
  /** Unique identifier for the step. */
  readonly id: string;
  /** Human-friendly name used in portals and audit logs. */
  readonly name: string;
  /** Narrative description documenting operational intent. */
  readonly description: string;
  /** Logical stage grouping (e.g. intake, verification, decision). */
  readonly stage: string;
  /**
   * Upstream step identifiers that must be completed before this step becomes
   * eligible for activation.
   */
  readonly dependencies: readonly string[];
  /**
   * Identifier of the next step to activate when this step succeeds. When
   * `null`, the workflow is considered complete on success.
   */
  readonly onSuccess: string | null;
  /**
   * Optional identifier of the step to activate when this step fails. When
   * omitted or `null`, the workflow will look for the next available step based
   * on dependency satisfaction.
   */
  readonly onFailure?: string | null;
  /** Target SLA duration for this step expressed in seconds. */
  readonly expectedDurationSeconds?: number;
  /** Arbitrary metadata for analytics, audit tags, etc. */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Input payload for creating a workflow definition.
 */
export interface WorkflowDefinitionInput {
  /** Canonical identifier for the workflow (e.g. loan-orchestration). */
  readonly id: string;
  /** Human friendly name displayed in UIs and documentation. */
  readonly name: string;
  /** Semantic version or git SHA describing the workflow revision. */
  readonly version: string;
  /** Identifier for the entry step where the workflow begins. */
  readonly entryStepId: string;
  /** Ordered collection of steps to register with the workflow. */
  readonly steps: readonly WorkflowStepInput[];
  /** Optional metadata propagated to clients. */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Enriched workflow definition returned by {@link createWorkflowDefinition}.
 */
export interface WorkflowDefinition {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly entryStepId: string;
  readonly steps: Record<string, WorkflowStepDefinition>;
  readonly orderedStepIds: readonly string[];
  readonly totalExpectedDurationSeconds: number;
  readonly stageNames: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Resolved step definition containing normalized structures for runtime use.
 */
export interface WorkflowStepDefinition extends WorkflowStepInput {
  /** Index within {@link WorkflowDefinition.orderedStepIds}. */
  readonly order: number;
}

/**
 * Perform a topological sort of the workflow steps to guarantee deterministic
 * ordering and to detect cycles early in the development process.
 */
const orderSteps = (
  steps: readonly WorkflowStepInput[],
): readonly string[] => {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, Set<string>>();

  for (const step of steps) {
    if (!inDegree.has(step.id)) {
      inDegree.set(step.id, 0);
    }

    for (const dependency of step.dependencies) {
      const neighbors = adjacency.get(dependency) ?? new Set<string>();
      neighbors.add(step.id);
      adjacency.set(dependency, neighbors);
      inDegree.set(step.id, (inDegree.get(step.id) ?? 0) + 1);
      if (!inDegree.has(dependency)) {
        inDegree.set(dependency, 0);
      }
    }
  }

  const queue: string[] = [];
  for (const [stepId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(stepId);
    }
  }

  const ordered: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    ordered.push(id);

    for (const neighbor of adjacency.get(id) ?? []) {
      const nextDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (ordered.length !== inDegree.size) {
    throw new WorkflowDefinitionError(
      'Workflow definition contains a circular dependency. Review step dependency graph.',
    );
  }

  return ordered;
};

/**
 * Create an immutable workflow definition with validation and helpful
 * denormalized views (ordered IDs, duration totals, etc.).
 */
export const createWorkflowDefinition = (
  input: WorkflowDefinitionInput,
): WorkflowDefinition => {
  if (input.steps.length === 0) {
    throw new WorkflowDefinitionError('Workflow definition must contain at least one step.');
  }

  const stepIds = new Set<string>();
  for (const step of input.steps) {
    if (stepIds.has(step.id)) {
      throw new WorkflowDefinitionError(`Duplicate step identifier detected: ${step.id}`);
    }
    stepIds.add(step.id);
  }

  if (!stepIds.has(input.entryStepId)) {
    throw new WorkflowDefinitionError(
      `Entry step "${input.entryStepId}" does not exist in the provided steps array.`,
    );
  }

  for (const step of input.steps) {
    for (const dependency of step.dependencies) {
      if (!stepIds.has(dependency)) {
        throw new WorkflowDefinitionError(
          `Step "${step.id}" declares missing dependency "${dependency}".`,
        );
      }
    }

    if (step.onSuccess && !stepIds.has(step.onSuccess)) {
      throw new WorkflowDefinitionError(
        `Step "${step.id}" references unknown success transition "${step.onSuccess}".`,
      );
    }

    if (step.onFailure && !stepIds.has(step.onFailure)) {
      throw new WorkflowDefinitionError(
        `Step "${step.id}" references unknown failure transition "${step.onFailure}".`,
      );
    }
  }

  const orderedStepIds = orderSteps(input.steps);
  const stageNames = Array.from(new Set(input.steps.map((step) => step.stage)));
  const steps: Record<string, WorkflowStepDefinition> = {};
  let totalExpectedDurationSeconds = 0;

  orderedStepIds.forEach((stepId, order) => {
    const step = input.steps.find((candidate) => candidate.id === stepId)!;
    const expectedDurationSeconds = step.expectedDurationSeconds ?? 0;
    totalExpectedDurationSeconds += expectedDurationSeconds;
    steps[step.id] = {
      ...step,
      expectedDurationSeconds,
      order,
    };
  });

  return {
    id: input.id,
    name: input.name,
    version: input.version,
    entryStepId: input.entryStepId,
    orderedStepIds,
    steps,
    totalExpectedDurationSeconds,
    stageNames,
    metadata: input.metadata,
  };
};
