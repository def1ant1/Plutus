import { WorkflowStateTransitionError } from './errors';
import type {
  InitializeWorkflowOptions,
  WorkflowContext,
  WorkflowEvent,
  WorkflowState,
} from './workflow-state';
import { createEmptyState } from './workflow-state';
import type { WorkflowDefinition, WorkflowStepDefinition } from './workflow-definition';

/**
 * Events accepted by {@link advanceWorkflow} to mutate the runtime state.
 */
export type WorkflowTransitionEvent =
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

const toDate = (value: Date | undefined): Date => (value instanceof Date ? value : new Date());

const areDependenciesSatisfied = (
  definition: WorkflowDefinition,
  step: WorkflowStepDefinition,
  completed: ReadonlySet<string>,
  failed: ReadonlySet<string>,
): boolean =>
  step.dependencies.every((dependency) => completed.has(dependency) || failed.has(dependency));

const chooseNextActiveStep = (
  definition: WorkflowDefinition,
  completed: ReadonlySet<string>,
  failed: ReadonlySet<string>,
  preferredStepId?: string | null,
): string | null => {
  if (preferredStepId) {
    const preferred = definition.steps[preferredStepId];
    if (preferred) {
      const isAvailable =
        !completed.has(preferredStepId) &&
        !failed.has(preferredStepId) &&
        areDependenciesSatisfied(definition, preferred, completed, failed);
      if (isAvailable) {
        return preferredStepId;
      }
    }
  }

  return (
    definition.orderedStepIds.find((stepId) => {
      if (completed.has(stepId) || failed.has(stepId)) {
        return false;
      }
      const step = definition.steps[stepId];
      return areDependenciesSatisfied(definition, step, completed, failed);
    }) ?? null
  );
};

const appendEvent = (history: WorkflowEvent[], event: WorkflowEvent): WorkflowEvent[] => [
  ...history,
  event,
];

/**
 * Initialize a workflow state for an application using the provided definition
 * and context. The returned state is immutable and can be safely shared across
 * orchestrator services.
 */
export const initializeWorkflow = (
  definition: WorkflowDefinition,
  context: WorkflowContext,
  options: InitializeWorkflowOptions = {},
): WorkflowState => {
  const timestamp = toDate(options.timestamp ?? new Date());
  const baseState = createEmptyState(definition, context, timestamp, options.metadata);

  const entryStep = definition.steps[definition.entryStepId];
  if (!entryStep) {
    throw new WorkflowStateTransitionError(
      `Workflow definition "${definition.id}" is missing its configured entry step.`,
    );
  }

  if (entryStep.dependencies.length > 0) {
    throw new WorkflowStateTransitionError(
      `Entry step "${entryStep.id}" cannot declare dependencies; adjust the workflow definition.`,
    );
  }

  const history: WorkflowEvent[] = [
    {
      type: 'WORKFLOW_INITIALIZED',
      occurredAt: timestamp,
      stepId: entryStep.id,
    },
    {
      type: 'STEP_ACTIVATED',
      occurredAt: timestamp,
      stepId: entryStep.id,
      reason: 'initial-entry',
    },
  ];

  return {
    ...baseState,
    activeStepId: entryStep.id,
    history,
  };
};

const assertStepIsEligible = (
  definition: WorkflowDefinition,
  step: WorkflowStepDefinition,
  completed: ReadonlySet<string>,
  failed: ReadonlySet<string>,
  activeStepId: string | null,
): void => {
  if (completed.has(step.id)) {
    throw new WorkflowStateTransitionError(
      `Step "${step.id}" has already completed; duplicate completion events are not allowed.`,
    );
  }

  if (failed.has(step.id)) {
    throw new WorkflowStateTransitionError(
      `Step "${step.id}" has already failed; resolve the failure before re-emitting events.`,
    );
  }

  const dependenciesSatisfied = areDependenciesSatisfied(definition, step, completed, failed);
  if (!dependenciesSatisfied) {
    throw new WorkflowStateTransitionError(
      `Step "${step.id}" cannot transition because upstream dependencies are incomplete.`,
    );
  }

  if (activeStepId && activeStepId !== step.id) {
    throw new WorkflowStateTransitionError(
      `Step "${step.id}" is not the currently active step (${activeStepId}); defer the event.`,
    );
  }
};

/**
 * Advance a workflow state by applying the provided transition events in order.
 * The function returns a fresh state object leaving the original untouched to
 * encourage pure functional programming patterns.
 */
export const advanceWorkflow = (
  definition: WorkflowDefinition,
  currentState: WorkflowState,
  ...events: readonly WorkflowTransitionEvent[]
): WorkflowState => {
  if (events.length === 0) {
    return currentState;
  }

  const completed = new Set(currentState.completedStepIds);
  const failed = new Set(currentState.failedStepIds);
  let history = [...currentState.history];
  let activeStepId = currentState.activeStepId;
  let lastTimestamp = currentState.updatedAt;

  for (const event of events) {
    const timestamp = toDate(event.occurredAt);
    if (timestamp > lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const step = definition.steps[event.stepId];
    if (!step) {
      throw new WorkflowStateTransitionError(
        `Unknown step "${event.stepId}" referenced by transition event ${event.type}.`,
      );
    }

    assertStepIsEligible(definition, step, completed, failed, activeStepId);

    switch (event.type) {
      case 'STEP_COMPLETED': {
        completed.add(step.id);
        activeStepId = activeStepId === step.id ? null : activeStepId;
        history = appendEvent(history, event);
        const nextStepId = chooseNextActiveStep(definition, completed, failed, step.onSuccess);
        if (nextStepId) {
          history = appendEvent(history, {
            type: 'STEP_ACTIVATED',
            stepId: nextStepId,
            occurredAt: timestamp,
            reason: 'dependency-satisfied',
          });
          activeStepId = nextStepId;
        }
        break;
      }
      case 'STEP_FAILED': {
        failed.add(step.id);
        activeStepId = activeStepId === step.id ? null : activeStepId;
        history = appendEvent(history, event);
        const nextStepId = chooseNextActiveStep(definition, completed, failed, step.onFailure);
        if (nextStepId) {
          history = appendEvent(history, {
            type: 'STEP_ACTIVATED',
            stepId: nextStepId,
            occurredAt: timestamp,
            reason: 'dependency-satisfied',
          });
          activeStepId = nextStepId;
        }
        break;
      }
      default: {
        const exhaustiveCheck: never = event;
        throw new WorkflowStateTransitionError(
          `Unsupported workflow transition event ${(exhaustiveCheck as WorkflowTransitionEvent).type}.`,
        );
      }
    }
  }

  const orderedCompleted = definition.orderedStepIds.filter((id) => completed.has(id));
  const orderedFailed = definition.orderedStepIds.filter((id) => failed.has(id));

  return {
    ...currentState,
    activeStepId,
    completedStepIds: orderedCompleted,
    failedStepIds: orderedFailed,
    history,
    updatedAt: lastTimestamp,
  };
};
