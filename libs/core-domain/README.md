# @plutus/core-domain

Enterprise workflow primitives shared between the portal Next.js app and the
orchestrator service. The package provides:

- `createWorkflowDefinition` – normalizes workflow descriptors, performs safety
  validation, and precomputes helpful aggregates such as ordered step IDs and
  total SLA duration.
- `initializeWorkflow` / `advanceWorkflow` – a deterministic state machine that
  guards transitions, tracks audit history, and automatically routes failure
  branches.
- `buildWorkflowTimeline` – materializes presentation-ready timeline entries
  with status labels and timestamps for customer support tooling.
- `testing/*` fixtures – strongly typed, reusable seeds for loan-origination
  flows used by both portal and orchestrator test suites.

## Usage

```ts
import {
  createWorkflowDefinition,
  initializeWorkflow,
  advanceWorkflow,
  buildWorkflowTimeline,
} from '@plutus/core-domain';

const definition = createWorkflowDefinition({...});
const runtime = initializeWorkflow(definition, {
  tenantId: 'tenant-a',
  applicationId: 'abc123',
  correlationId: 'req-1',
});
const progressed = advanceWorkflow(definition, runtime, {
  type: 'STEP_COMPLETED',
  stepId: 'collect-intake',
  occurredAt: new Date(),
});
const timeline = buildWorkflowTimeline(definition, progressed);
```

## Developer workflow

- `pnpm nx build core-domain` – compile the TypeScript sources to
  `dist/libs/core-domain`.
- `pnpm nx test core-domain` – execute Jest specs covering nominal, branching,
  and failure scenarios for the state machine and timeline helpers.
