/**
 * Error thrown when a workflow definition fails validation or contains
 * inconsistencies that would break downstream orchestrations.
 */
export class WorkflowDefinitionError extends Error {
  public override readonly name = 'WorkflowDefinitionError';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Error thrown when a workflow state transition request is invalid for the
 * current runtime state.
 */
export class WorkflowStateTransitionError extends Error {
  public override readonly name = 'WorkflowStateTransitionError';

  constructor(message: string) {
    super(message);
  }
}
