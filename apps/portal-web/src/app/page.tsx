import {
  advanceWorkflow,
  createWorkflowDefinition,
  initializeWorkflow,
} from '@plutus/core-domain';
import { loadConfig } from '@plutus/config';
import { getLogger } from './lib/telemetry.server';
import styles from './page.module.css';

const config = loadConfig();

const definition = createWorkflowDefinition({
  id: 'loan-orchestration',
  name: 'Loan Origination Flow',
  version: '2024.10.01',
  entryStepId: 'collect-intake',
  steps: [
    {
      id: 'collect-intake',
      stage: 'intake',
      name: 'Collect borrower intake package',
      description:
        'Portal intake forms, document capture, borrower attestations.',
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
});

const initialState = initializeWorkflow(definition, {
  applicationId: 'demo-app',
  tenantId: 'demo-tenant',
  correlationId: 'demo-correlation',
  metadata: { seeded: 'true' },
});

const progressedState = advanceWorkflow(
  definition,
  advanceWorkflow(definition, initialState, {
    type: 'STEP_COMPLETED',
    stepId: 'collect-intake',
    occurredAt: new Date(),
  }),
  {
    type: 'STEP_COMPLETED',
    stepId: 'kyc-screening',
    occurredAt: new Date(),
  },
);

const statusForStep = (
  stepId: string,
): 'Active' | 'Completed' | 'Pending' | 'Failed' => {
  if (progressedState.failedStepIds.includes(stepId)) {
    return 'Failed';
  }
  if (progressedState.completedStepIds.includes(stepId)) {
    return 'Completed';
  }
  if (progressedState.activeStepId === stepId) {
    return 'Active';
  }
  return 'Pending';
};

const stepsWithStatus = definition.orderedStepIds.map((id) => ({
  ...definition.steps[id],
  status: statusForStep(id),
}));

const stageDescriptions: Record<string, string> = {
  intake: 'Gather borrower data, documents, and declarations.',
  verification: 'Verify identity, financials, and compliance posture.',
  decision: 'Apply policy DAGs and decision analytics.',
  funding: 'Disburse funds, update ledgers, and finalize contracts.',
};

/**
 * Renders the enterprise orchestration portal landing page with a seeded workflow timeline
 * and runtime configuration snapshot so engineers can immediately verify wiring against the
 * shared domain libraries. This component intentionally mirrors the Nest service bootstrap
 * data to provide fast feedback loops during pre-production hardening.
 */
export default function Index(): JSX.Element {
  const logger = getLogger();
  logger.info(
    {
      totalSteps: stepsWithStatus.length,
      env: config.env,
    },
    'Rendering portal workflow timeline',
  );

  return (
    <main className={styles['page']}>
      <section className={styles['headerPanel']}>
        <div>
          <span className={styles['tag']}>Environment: {config.env}</span>
          <h1 className={styles['title']}>{definition.name}</h1>
          <p className={styles['subtitle']}>
            Version {definition.version} • Temporal namespace{' '}
            {config.temporal.namespace}
          </p>
        </div>
        <div className={styles['configCard']}>
          <h2>Runtime configuration snapshot</h2>
          <dl>
            <div>
              <dt>HTTP endpoint</dt>
              <dd>
                {config.http.host}:{config.http.port}/{config.http.globalPrefix}
              </dd>
            </div>
            <div>
              <dt>Temporal task queue</dt>
              <dd>{config.temporal.taskQueue}</dd>
            </div>
            <div>
              <dt>Observability</dt>
              <dd>{config.observability.otlpTracesEndpoint}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-label="Workflow timeline" className={styles['timeline']}>
        {stepsWithStatus.map((step, index) => (
          <article key={step.id} className={styles['timelineStep']}>
            <header>
              <span
                className={`${styles['badge']} ${styles[`badge${step.status}`]}`}
              >
                {step.status}
              </span>
              <h3>
                {index + 1}. {step.name}
              </h3>
              <p className={styles['stageLabel']}>
                Stage: {step.stage} — {stageDescriptions[step.stage]}
              </p>
            </header>
            <p>{step.description}</p>
            <footer className={styles['stepFooter']}>
              <span>
                SLA: {Math.round(step.expectedDurationSeconds / 60)} minutes
              </span>
              {step.onSuccess ? (
                <span>
                  On success → {definition.steps[step.onSuccess].name}
                </span>
              ) : (
                <span>Completes workflow</span>
              )}
            </footer>
          </article>
        ))}
      </section>
    </main>
  );
}
