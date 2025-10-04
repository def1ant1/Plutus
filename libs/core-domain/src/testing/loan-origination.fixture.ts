import { buildWorkflowTimeline } from '../timeline';
import { advanceWorkflow, initializeWorkflow } from '../state-machine';
import type { WorkflowTransitionEvent } from '../state-machine';
import type {
  WorkflowContext,
  WorkflowState,
  InitializeWorkflowOptions,
} from '../workflow-state';
import {
  type WorkflowDefinition,
  type WorkflowDefinitionInput,
  createWorkflowDefinition,
} from '../workflow-definition';

/**
 * Canonical workflow definition used by both the portal and orchestrator tests
 * to keep fixtures aligned across surfaces.
 */
export const loanOriginationWorkflowDefinitionInput: WorkflowDefinitionInput = {
  id: 'loan-orchestration',
  name: 'Loan Origination Flow',
  version: '2024.10.01',
  entryStepId: 'collect-intake',
  steps: [
    {
      id: 'collect-intake',
      stage: 'intake',
      name: 'Collect borrower intake package',
      description: 'Portal intake forms, document capture, borrower attestations.',
      dependencies: [],
      onSuccess: 'kyc-screening',
      expectedDurationSeconds: 900,
    },
    {
      id: 'kyc-screening',
      stage: 'verification',
      name: 'KYC & AML screening',
      description: 'Identity, sanctions, PEP, and watchlist checks.',
      dependencies: ['collect-intake'],
      onSuccess: 'credit-decision',
      onFailure: 'manual-review',
      expectedDurationSeconds: 300,
    },
    {
      id: 'credit-decision',
      stage: 'decision',
      name: 'Decisioning & pricing',
      description: 'Policy DAG execution, adverse action reasoning, pricing.',
      dependencies: ['kyc-screening'],
      onSuccess: 'funding',
      onFailure: 'manual-review',
      expectedDurationSeconds: 120,
    },
    {
      id: 'funding',
      stage: 'funding',
      name: 'Funding & GL reconciliation',
      description: 'Wire orchestration, lien filings, general ledger postings.',
      dependencies: ['credit-decision'],
      onSuccess: null,
      expectedDurationSeconds: 600,
    },
    {
      id: 'manual-review',
      stage: 'decision',
      name: 'Operational manual review',
      description: 'Risk officer override path for escalated applications.',
      dependencies: ['kyc-screening'],
      onSuccess: 'funding',
      expectedDurationSeconds: 3600,
    },
  ],
};

/** Default workflow context used across fixtures. */
export const defaultLoanWorkflowContext: WorkflowContext = {
  applicationId: 'demo-app',
  tenantId: 'demo-tenant',
  correlationId: 'demo-correlation',
  metadata: { seeded: 'true' },
};

/**
 * Convenience helper for generating the immutable workflow definition from the
 * shared {@link loanOriginationWorkflowDefinitionInput} descriptor.
 */
export const buildLoanOriginationDefinition = (): WorkflowDefinition =>
  createWorkflowDefinition(loanOriginationWorkflowDefinitionInput);

/**
 * Options for {@link seedLoanOriginationWorkflow} allowing scenario specific
 * overrides.
 */
export interface LoanWorkflowSeedOptions {
  readonly context?: Partial<WorkflowContext>;
  readonly timestamp?: Date;
  readonly initializeOptions?: Partial<InitializeWorkflowOptions>;
  readonly events?: readonly WorkflowTransitionEvent[];
}

/**
 * Seed the loan origination workflow, applying any provided transition events
 * to produce a deterministic runtime state suitable for tests.
 */
export const seedLoanOriginationWorkflow = (
  options: LoanWorkflowSeedOptions = {},
): {
  readonly definition: WorkflowDefinition;
  readonly state: WorkflowState;
} => {
  const definition = buildLoanOriginationDefinition();
  const timestamp = options.timestamp ?? new Date('2024-01-01T00:00:00.000Z');

  const context: WorkflowContext = {
    ...defaultLoanWorkflowContext,
    ...options.context,
    metadata: {
      ...defaultLoanWorkflowContext.metadata,
      ...(options.context?.metadata ?? {}),
    },
  };

  const initialState = initializeWorkflow(
    definition,
    context,
    {
      timestamp,
      ...(options.initializeOptions ?? {}),
    },
  );

  const state = options.events?.length
    ? advanceWorkflow(definition, initialState, ...options.events)
    : initialState;

  return {
    definition,
    state,
  };
};

/**
 * Generate a timeline snapshot for UI assertions without forcing callers to
 * duplicate derivation logic.
 */
export const seedLoanOriginationTimeline = (
  options: LoanWorkflowSeedOptions = {},
) => {
  const { definition, state } = seedLoanOriginationWorkflow(options);
  return buildWorkflowTimeline(definition, state);
};
