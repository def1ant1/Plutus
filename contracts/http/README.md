# HTTP Contracts

OpenAPI 3.1 specs for intake, configuration, and IAM services. Contracts embed exhaustive
field documentation, residency-aware error taxonomies, and OAuth2/API key security models.

## Artifacts

- `intake.openapi.yaml`
- `config.openapi.yaml`
- `iam.openapi.yaml`

Validate with Spectral via `make contracts-openapi-validate`.
Rendered HTML/PDF outputs are published to `contracts/artifacts/http/` by `pnpm contracts:docs`.

> ℹ️  PDF generation automatically degrades to a lightweight PDFKit export when
>  headless Chromium dependencies are unavailable (common in CI containers).
