declare module '@plutus/core-domain' {
  export interface WorkflowStep {
    id: string;
    stage: string;
    name: string;
    description: string;
    dependencies: string[];
    onSuccess: string | null;
    onFailure?: string | null;
    expectedDurationSeconds: number;
  }

  export interface WorkflowDefinition {
    id: string;
    name: string;
    version: string;
    entryStepId: string;
    steps: Record<string, WorkflowStep>;
    orderedStepIds: string[];
  }

  export interface WorkflowContext {
    applicationId: string;
    tenantId: string;
    correlationId: string;
    metadata?: Record<string, string>;
  }

  export interface WorkflowEvent {
    type: 'STEP_COMPLETED' | 'STEP_FAILED';
    stepId: string;
    occurredAt: Date;
  }

  export interface WorkflowState {
    activeStepId: string | null;
    completedStepIds: string[];
    failedStepIds: string[];
    metadata: Record<string, string>;
  }

  export function createWorkflowDefinition(input: {
    id: string;
    name: string;
    version: string;
    entryStepId: string;
    steps: WorkflowStep[];
  }): WorkflowDefinition;

  export function initializeWorkflow(
    definition: WorkflowDefinition,
    context: WorkflowContext,
  ): WorkflowState;

  export function advanceWorkflow(
    definition: WorkflowDefinition,
    state: WorkflowState,
    event: WorkflowEvent,
  ): WorkflowState;
}
