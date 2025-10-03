# Event Contracts

AsyncAPI + Avro definitions for lifecycle events. Each message includes tenant + residency
context to satisfy sovereignty controls. Validate via `make contracts-validate` or the
Nx target `contracts:validate` before publishing.

## Artifacts

- `lifecycle.asyncapi.yaml` — channel definitions referencing versioned Avro schemas.
- `schemas/*.avsc` — Avro payload contracts with FULL compatibility guarantees.
- HTML/PDF renderings land in `contracts/artifacts/events/` after running `pnpm contracts:docs`.

> ℹ️  In minimal CI containers without Chromium dependencies we fall back to a PDFKit
>  summary PDF; install system libraries to enable rich AsyncAPI PDF exports.
