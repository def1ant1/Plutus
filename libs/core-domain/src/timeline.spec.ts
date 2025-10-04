import { buildWorkflowTimeline } from './timeline';
import { initializeWorkflow } from './state-machine';
import {
  buildLoanOriginationDefinition,
  defaultLoanWorkflowContext,
  seedLoanOriginationWorkflow,
} from './testing';

describe('workflow timeline utilities', () => {
  const definition = buildLoanOriginationDefinition();
  const baseTimestamp = new Date('2024-01-01T00:00:00.000Z');

  it('marks the entry step as active for a fresh workflow', () => {
    const state = initializeWorkflow(definition, defaultLoanWorkflowContext, {
      timestamp: baseTimestamp,
    });

    const timeline = buildWorkflowTimeline(definition, state);
    const intakeEntry = timeline.entries.find((entry) => entry.stepId === 'collect-intake');
    const kycEntry = timeline.entries.find((entry) => entry.stepId === 'kyc-screening');

    expect(intakeEntry?.status).toBe('Active');
    expect(intakeEntry?.startedAt).toEqual(baseTimestamp);
    expect(intakeEntry?.completedAt).toBeUndefined();
    expect(kycEntry?.status).toBe('Pending');
  });

  it('tracks nominal progression with cumulative SLA calculations', () => {
    const seeded = seedLoanOriginationWorkflow({
      events: [
        {
          type: 'STEP_COMPLETED',
          stepId: 'collect-intake',
          occurredAt: new Date('2024-01-01T00:15:00.000Z'),
        },
        {
          type: 'STEP_COMPLETED',
          stepId: 'kyc-screening',
          occurredAt: new Date('2024-01-01T00:20:00.000Z'),
        },
      ],
    });

    const timeline = buildWorkflowTimeline(definition, seeded.state);
    const creditDecision = timeline.entries.find((entry) => entry.stepId === 'credit-decision');

    expect(timeline.completedExpectedDurationSeconds).toBe(900 + 300);
    expect(creditDecision?.status).toBe('Active');
  });

  it('labels downstream branches when failures occur', () => {
    const seeded = seedLoanOriginationWorkflow({
      events: [
        {
          type: 'STEP_COMPLETED',
          stepId: 'collect-intake',
          occurredAt: new Date('2024-01-01T00:05:00.000Z'),
        },
        {
          type: 'STEP_FAILED',
          stepId: 'kyc-screening',
          occurredAt: new Date('2024-01-01T00:10:00.000Z'),
          reason: 'Document mismatch',
        },
      ],
    });

    const timeline = buildWorkflowTimeline(definition, seeded.state);
    const manualReview = timeline.entries.find((entry) => entry.stepId === 'manual-review');
    const kycEntry = timeline.entries.find((entry) => entry.stepId === 'kyc-screening');

    expect(kycEntry?.status).toBe('Failed');
    expect(kycEntry?.failedAt).toEqual(new Date('2024-01-01T00:10:00.000Z'));
    expect(manualReview?.status).toBe('Active');
    expect(manualReview?.startedAt).toEqual(new Date('2024-01-01T00:10:00.000Z'));
  });
});
