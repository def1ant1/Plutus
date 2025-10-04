import { advanceWorkflow, initializeWorkflow } from './state-machine';
import { WorkflowStateTransitionError } from './errors';
import { defaultLoanWorkflowContext, buildLoanOriginationDefinition } from './testing';

describe('workflow state machine', () => {
  const definition = buildLoanOriginationDefinition();
  const baseTimestamp = new Date('2024-01-01T00:00:00.000Z');

  it('initializes with the entry step active and history seeded', () => {
    const state = initializeWorkflow(definition, defaultLoanWorkflowContext, {
      timestamp: baseTimestamp,
    });

    expect(state.activeStepId).toEqual('collect-intake');
    expect(state.completedStepIds).toEqual([]);
    expect(state.failedStepIds).toEqual([]);
    expect(state.history).toHaveLength(2);
    expect(state.history[0]).toMatchObject({
      type: 'WORKFLOW_INITIALIZED',
      stepId: 'collect-intake',
      occurredAt: baseTimestamp,
    });
    expect(state.history[1]).toMatchObject({
      type: 'STEP_ACTIVATED',
      stepId: 'collect-intake',
    });
  });

  it('advances sequential happy path transitions', () => {
    const state = initializeWorkflow(definition, defaultLoanWorkflowContext, {
      timestamp: baseTimestamp,
    });

    const afterIntake = advanceWorkflow(definition, state, {
      type: 'STEP_COMPLETED',
      stepId: 'collect-intake',
      occurredAt: new Date('2024-01-01T00:15:00.000Z'),
    });

    expect(afterIntake.completedStepIds).toEqual(['collect-intake']);
    expect(afterIntake.activeStepId).toEqual('kyc-screening');

    const afterKyc = advanceWorkflow(definition, afterIntake, {
      type: 'STEP_COMPLETED',
      stepId: 'kyc-screening',
      occurredAt: new Date('2024-01-01T00:20:00.000Z'),
    });

    expect(afterKyc.completedStepIds).toEqual(['collect-intake', 'kyc-screening']);
    expect(afterKyc.activeStepId).toEqual('credit-decision');
  });

  it('routes to manual review when screening fails', () => {
    const state = initializeWorkflow(definition, defaultLoanWorkflowContext, {
      timestamp: baseTimestamp,
    });

    const afterIntake = advanceWorkflow(definition, state, {
      type: 'STEP_COMPLETED',
      stepId: 'collect-intake',
      occurredAt: new Date('2024-01-01T00:15:00.000Z'),
    });

    const afterFailure = advanceWorkflow(definition, afterIntake, {
      type: 'STEP_FAILED',
      stepId: 'kyc-screening',
      occurredAt: new Date('2024-01-01T00:20:00.000Z'),
      reason: 'Watchlist hit',
    });

    expect(afterFailure.failedStepIds).toEqual(['kyc-screening']);
    expect(afterFailure.activeStepId).toEqual('manual-review');
    expect(afterFailure.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'STEP_FAILED', stepId: 'kyc-screening' }),
        expect.objectContaining({ type: 'STEP_ACTIVATED', stepId: 'manual-review' }),
      ]),
    );
  });

  it('rejects out-of-order completions', () => {
    const state = initializeWorkflow(definition, defaultLoanWorkflowContext, {
      timestamp: baseTimestamp,
    });

    expect(() =>
      advanceWorkflow(definition, state, {
        type: 'STEP_COMPLETED',
        stepId: 'credit-decision',
        occurredAt: new Date('2024-01-01T00:05:00.000Z'),
      }),
    ).toThrow(WorkflowStateTransitionError);
  });
});
