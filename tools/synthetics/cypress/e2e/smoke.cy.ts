/// <reference types="cypress" />

/**
 * Synthetic smoke validation executed via Nx and GitHub Actions. Each check is
 * intentionally deterministic so teams can schedule it from chaos/DR runbooks
 * without requiring live dependencies.
 */
describe('observability guardrails', () => {
  it('exposes a non-empty service name', () => {
    const serviceName = Cypress.env('OBS_SERVICE_NAME');
    expect(serviceName, 'service name should be present').to.be.a('string').and.not.be.empty;
  });

  it('redaction list contains sensitive defaults', () => {
    const redactions = (Cypress.env('OBS_REDACT_KEYS') ?? 'password,token').split(',');
    expect(redactions.map((entry) => entry.trim().toLowerCase())).to.include('token');
  });
});
