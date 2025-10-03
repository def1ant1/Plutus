# Policy Bundles

Baseline policy-as-code bundles compiled with OPA. Each module is documented inline and
structured to make automation trivial. The matrix below enumerates available bundles,
expected inputs, and response contracts.

| Bundle | Package | Purpose | Input Schema | Output Schema |
| --- | --- | --- | --- | --- |
| `abac` | `plutus.abac` | Attribute-based access control for HTTP APIs (intake/config/IAM). | `principal`, `tenant`, `resource` fields with residency metadata. | `{ decision, advice[], residencyEnforced }` |
| `governance` | `plutus.governance` | Config promotion guardrails enforcing residency and SoD controls. | `actor`, `change`, `controls`. | `{ decision, advice[], controlsTriggered[] }` |

## Usage

```sh
# Compile to OPA bundle and emit signature (performed automatically via Make/Nx targets)
opa build -t wasm -e plutus.abac.decision contracts/policies/abac.rego
```

See `Makefile` and CI workflow for automated bundle validation and signing hooks.
